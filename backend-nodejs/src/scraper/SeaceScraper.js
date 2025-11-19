/**
 * SeaceScraper - Scraper completo para el portal SEACE
 * Extrae datos correctos de la tabla HTML y soporta paginación
 */
const puppeteer = require('puppeteer');
const logger = require('../config/logger');

class SeaceScraper {
  constructor(options = {}) {
    this.browser = null;
    this.page = null;
    this.options = {
      headless: true,
      timeout: 90000,
      maxRetries: 3,
      ...options
    };
  }

  async initialize() {
    try {
      logger.info('Inicializando Puppeteer...');

      this.browser = await puppeteer.launch({
        headless: this.options.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080'
        ],
        executablePath: process.env.CHROME_BIN || '/usr/bin/chromium-browser'
      });

      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1920, height: 1080 });
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      logger.info('Scraper inicializado correctamente');
    } catch (error) {
      logger.error('Error al inicializar scraper:', error);
      throw error;
    }
  }

  async searchProcesses(params = {}) {
    const {
      keywords = null,  // Sin default, null = buscar todo
      objetoContratacion = null,  // Sin default, null = no filtrar
      anio = new Date().getFullYear().toString(),
      maxProcesses = 100,
      entidad = null,
      tipoProceso = null,
      fechaDesde = null,  // Nuevo parámetro para fecha desde
      fechaHasta = null   // Nuevo parámetro para fecha hasta
    } = params;

    try {
      if (!this.browser) {
        await this.initialize();
      }

      const allResults = [];
      const baseUrl = 'https://prodapp2.seace.gob.pe/seacebus-uiwd-pub/buscadorPublico/buscadorPublico.xhtml';

      logger.info('Iniciando búsqueda en SEACE', {
        keywords: keywords && Array.isArray(keywords) ? keywords.join(', ') : 'Sin filtro de keywords',
        objetoContratacion,
        anio,
        fechaDesde,
        fechaHasta,
        maxProcesses
      });

      // PASO 1: Acceso al SEACE y navegación a la pestaña correcta
      await this.page.goto(baseUrl, {
        waitUntil: 'networkidle2',
        timeout: this.options.timeout
      });

      logger.info('Página SEACE cargada');
      await this.page.waitForTimeout(3000);

      // PASO 2: Seleccionar pestaña "Procedimientos de Selección"
      await this.selectProcedimientosSeleccion();

      // PASO 3: Configuración de filtros
      // 3.1 Objeto de contratación
      if (objetoContratacion) {
        logger.info(`🔧 Aplicando filtro: objetoContratacion = "${objetoContratacion}"`);
        await this.selectObjetoContratacion(objetoContratacion);
        logger.info(`✅ Filtro objetoContratacion aplicado exitosamente`);
      } else {
        logger.warn('⚠️  NO se aplicó filtro de objetoContratacion (parámetro vacío o undefined)');
      }

      // 3.2 Año de convocatoria
      if (anio) {
        await this.selectAnio(anio);
      }

      // 3.3 Fechas de publicación
      const fechaInicio = fechaDesde || `${anio}-01-01`;
      const fechaFin = fechaHasta || `${anio}-12-31`;
      await this.setFechaPublicacion(fechaInicio, fechaFin);

      // 3.4 Descripción del objeto
      const descripcionTexto = Array.isArray(keywords) ? keywords.join(' ') : keywords;
      if (descripcionTexto && descripcionTexto.trim()) {
        await this.fillDescripcion(descripcionTexto);
      }

      // PASO 4: Ejecución de la búsqueda
      await this.clickBuscar();

      // PASO 5: Esperar resultados
      await this.waitForResults();

      // PASO 6: Extracción de datos de todas las páginas
      let currentPage = 1;
      let hasMorePages = true;
      let totalPagesProcessed = 0;

      // ✨ NUEVO: Extraer un buffer adicional para compensar updates
      // Si maxProcesses = 20, extraer ~40-60 para asegurar 20 nuevos
      const extractionLimit = maxProcesses ? Math.ceil(maxProcesses * 2.5) : null;
      
      logger.info('Iniciando extracción de páginas...');
      if (maxProcesses) {
        logger.info(`💡 Objetivo: ${maxProcesses} procesos NUEVOS. Extrayendo hasta ${extractionLimit} procesos para compensar updates.`);
      }

      while (hasMorePages && (extractionLimit === null || allResults.length < extractionLimit)) {
        logger.info(`=== PROCESANDO PÁGINA ${currentPage} ===`);
        const limitMsg = extractionLimit ? `${allResults.length}/${extractionLimit}` : `${allResults.length}`;
        logger.info(`Procesos acumulados hasta ahora: ${limitMsg}`);

        const pageResults = await this.extractTableData();

        if (pageResults.length === 0) {
          logger.warn(`Página ${currentPage}: No se encontraron procesos. Posible problema de carga.`);
          break;
        }

        allResults.push(...pageResults);
        totalPagesProcessed++;

        logger.info(`Página ${currentPage}: ${pageResults.length} procesos extraídos (Total acumulado: ${allResults.length})`);

        // Verificar si hemos alcanzado el límite de extracción (con buffer)
        if (extractionLimit && allResults.length >= extractionLimit) {
          logger.info(`Límite de extracción ${extractionLimit} alcanzado (objetivo: ${maxProcesses} nuevos). Deteniendo scraping.`);
          break;
        }

        // Verificar si hay más páginas
        hasMorePages = await this.hasNextPage();

        if (!hasMorePages) {
          logger.info('No hay más páginas disponibles. Extracción completada.');
          break;
        }

        // Navegar a la siguiente página
        await this.goToNextPage();
        currentPage++;

        // Pequeña pausa entre páginas para estabilidad
        await this.page.waitForTimeout(1000);
      }

      logger.info('=== EXTRACCIÓN COMPLETADA ===');
      logger.info(`Total de páginas procesadas: ${totalPagesProcessed}`);
      logger.info(`Total de procesos extraídos: ${allResults.length}`);
      logger.info(`Procesos por página promedio: ${totalPagesProcessed > 0 ? (allResults.length / totalPagesProcessed).toFixed(1) : 0}`);
      
      if (maxProcesses) {
        logger.info(`📦 Retornando todos los ${allResults.length} procesos extraídos. El servicio ETL filtrará hasta obtener ${maxProcesses} NUEVOS.`);
      }

      // ✨ CAMBIO: No limitar aquí, dejar que etlService maneje el límite de NUEVOS
      return allResults;

    } catch (error) {
      logger.error('Error durante scraping:', error);
      throw error;
    }
  }

  async selectProcedimientosSeleccion() {
    try {
      logger.info('Seleccionando pestaña "Procedimientos de Selección"...');

      // Usar evaluateHandle con JavaScript puro para buscar por texto
      // en lugar de selectores jQuery que Puppeteer no soporta
      const tabFound = await this.page.evaluate(() => {
        // Buscar tabs por texto
        const tabs = document.querySelectorAll('li[role="tab"] a, a[role="tab"], button[role="tab"]');
        
        for (const tab of tabs) {
          const text = tab.textContent?.trim() || '';
          if (text.includes('Procedimiento') || text.includes('Buscar')) {
            // Verificar si ya está activo
            const isActive = tab.classList.contains('ui-tabs-active') ||
                            tab.classList.contains('ui-state-active') ||
                            tab.getAttribute('aria-selected') === 'true';
            
            if (!isActive) {
              tab.click();
              return { found: true, clicked: true, text: text };
            } else {
              return { found: true, clicked: false, text: text };
            }
          }
        }
        
        return { found: false };
      });

      if (tabFound.found) {
        if (tabFound.clicked) {
          logger.info(`Pestaña encontrada y clickeada: "${tabFound.text}"`);
          await this.page.waitForTimeout(2000);
        } else {
          logger.info(`Pestaña "${tabFound.text}" ya está activa`);
        }
        return;
      }

      // Fallback: si no encontramos por texto, buscar cualquier tab y hacer click
      const anyTabClicked = await this.page.evaluate(() => {
        const tabs = document.querySelectorAll('li[role="tab"] a');
        if (tabs.length > 0) {
          const firstInactiveTab = Array.from(tabs).find(tab => 
            !tab.classList.contains('ui-tabs-active') && 
            !tab.classList.contains('ui-state-active')
          );
          
          if (firstInactiveTab) {
            firstInactiveTab.click();
            return true;
          }
        }
        return false;
      });

      if (anyTabClicked) {
        logger.info('Tab clickeado usando fallback');
        await this.page.waitForTimeout(2000);
        return;
      }

      logger.warn('No se pudo seleccionar la pestaña "Procedimientos de Selección"');
    } catch (err) {
      logger.warn(`Error seleccionando pestaña: ${err.message}`);
    }
  }

  async selectObjetoContratacion(valor) {
    try {
      logger.info('═══════════════════════════════════════════════════════');
      logger.info(`🎯 EJECUTANDO selectObjetoContratacion`);
      logger.info(`   Valor recibido: "${valor}"`);
      logger.info('═══════════════════════════════════════════════════════');

      // Mapear valores a las opciones de SEACE
      const valorMap = {
        'bien': 'Bien',
        'consultoria': 'Consultoría de Obra',
        'consultoría': 'Consultoría de Obra',
        'obra': 'Obra',
        'servicio': 'Servicio',
        'Bien': 'Bien',
        'Consultoría': 'Consultoría de Obra',
        'Consultoría de Obra': 'Consultoría de Obra',
        'Obra': 'Obra',
        'Servicio': 'Servicio'
      };

      const valorSeleccion = valorMap[valor] || valor;
      logger.info(`Valor a seleccionar: "${valorSeleccion}"`);

      // PASO 0: Diagnóstico - Buscar todos los selectonemenu disponibles
      const diagnostico = await this.page.evaluate(() => {
        const allLabels = document.querySelectorAll('label.ui-selectonemenu-label');
        const results = [];
        
        allLabels.forEach((label, index) => {
          const container = label.closest('.ui-selectonemenu');
          const trigger = container ? container.querySelector('.ui-selectonemenu-trigger') : null;
          
          results.push({
            index,
            id: label.id,
            text: label.textContent,
            hasContainer: !!container,
            hasTrigger: !!trigger,
            containerHTML: container ? container.outerHTML.substring(0, 200) : null
          });
        });
        
        return results;
      });

      logger.info(`🔍 Diagnóstico: Encontrados ${diagnostico.length} selectonemenu`);
      diagnostico.forEach(d => {
        logger.info(`  [${d.index}] ID: ${d.id}, Texto: "${d.text}", Trigger: ${d.hasTrigger}`);
      });

      // PASO 1: Buscar el selectonemenu correcto por ID (ObjContratacion del formulario específico)
      const componentInfo = await this.page.evaluate(() => {
        // Buscar el componente específico de Objeto de Contratación por su ID
        const labels = document.querySelectorAll('label.ui-selectonemenu-label');
        
        for (const label of labels) {
          // IMPORTANTE: Buscar ESPECÍFICAMENTE el del formulario "idFormbuscarACF" o "idFormBuscarProceso"
          if (label.id && (
            label.id.includes('idFormbuscarACF:cbxObjContratacion') || 
            label.id.includes('idFormBuscarProceso:') && label.id.includes('ObjContratacion')
          )) {
            const container = label.closest('.ui-selectonemenu');
            if (container) {
              return {
                labelId: label.id,
                labelText: label.textContent.trim(),
                containerId: container.id,
                found: true
              };
            }
          }
        }
        
        // Fallback: buscar por texto solo si no se encuentra por ID
        for (const label of labels) {
          const text = label.textContent.trim();
          // Solo buscar si el texto es una opción específica (no "[Seleccione]")
          if (text === 'Bien' || text === 'Obra' || text === 'Servicio' || text === 'Consultoría de Obra') {
            const container = label.closest('.ui-selectonemenu');
            if (container && label.id.includes('ObjContratacion')) {
              return {
                labelId: label.id,
                labelText: text,
                containerId: container.id,
                found: true
              };
            }
          }
        }
        
        return { found: false };
      });

      if (!componentInfo.found) {
        logger.error('❌ No se encontró el componente de Objeto de Contratación');
        return;
      }

      logger.info(`✅ Componente encontrado - Label ID: ${componentInfo.labelId}, Texto actual: "${componentInfo.labelText}"`);

      // PASO 2: Click en trigger para abrir dropdown usando el ID dinámico
      const triggerClicked = await this.page.evaluate((labelId) => {
        const label = document.querySelector(`label[id="${labelId}"]`);
        if (!label) {
          console.log('❌ No se encontró el label');
          return false;
        }

        const container = label.closest('.ui-selectonemenu');
        if (!container) {
          console.log('❌ No se encontró el container');
          return false;
        }

        const trigger = container.querySelector('.ui-selectonemenu-trigger');
        if (!trigger) {
          console.log('❌ No se encontró el trigger');
          return false;
        }

        trigger.click();
        console.log('✅ Click en trigger ejecutado');
        return true;
      }, componentInfo.labelId);

      if (!triggerClicked) {
        logger.warn('No se pudo hacer click en el trigger del selectonemenu');
        return;
      }

      // PASO 3: Esperar a que el panel se despliegue (animación PrimeFaces)
      await this.page.waitForTimeout(800);

      // PASO 4: Buscar el panel (ID dinámico basado en el label)
      const panelId = componentInfo.labelId.replace('_label', '_panel');
      logger.info(`🔍 Buscando panel con ID: ${panelId}`);

      const panelInfo = await this.page.evaluate((panelId) => {
        const panel = document.getElementById(panelId);
        if (!panel) {
          // Buscar panel visible alternativo
          const visiblePanels = document.querySelectorAll('.ui-selectonemenu-panel:not(.ui-helper-hidden)');
          console.log(`Paneles visibles encontrados: ${visiblePanels.length}`);
          
          if (visiblePanels.length > 0) {
            const alternativePanel = visiblePanels[0];
            return {
              found: true,
              panelId: alternativePanel.id,
              display: alternativePanel.style.display,
              isHidden: alternativePanel.classList.contains('ui-helper-hidden'),
              itemCount: alternativePanel.querySelectorAll('.ui-selectonemenu-item').length
            };
          }
          
          return { found: false };
        }
        
        return {
          found: true,
          panelId: panel.id,
          display: panel.style.display,
          isHidden: panel.classList.contains('ui-helper-hidden'),
          itemCount: panel.querySelectorAll('.ui-selectonemenu-item').length
        };
      }, panelId);

      if (!panelInfo.found) {
        logger.error('❌ El panel no se desplegó correctamente');
        logger.info('💡 Tip: El componente puede tener un ID diferente o estar oculto');
        return;
      }

      logger.info(`✅ Panel encontrado: ${panelInfo.panelId}, Items: ${panelInfo.itemCount}, Display: ${panelInfo.display}, Hidden: ${panelInfo.isHidden}`);

      // PASO 5: Click en el item deseado
      const itemClicked = await this.page.evaluate((panelId, targetLabel) => {
        const panel = document.getElementById(panelId);
        if (!panel) {
          console.log('❌ Panel no encontrado al intentar seleccionar item');
          return false;
        }

        const items = panel.querySelectorAll('.ui-selectonemenu-item');
        console.log(`📋 Items encontrados: ${items.length}`);

        for (const item of items) {
          const itemLabel = item.getAttribute('data-label');
          console.log(`  - Item: "${itemLabel}"`);
          
          if (itemLabel === targetLabel) {
            console.log(`✅ Item objetivo encontrado: "${itemLabel}"`);
            item.click();
            console.log('✅ Click en item ejecutado');
            return true;
          }
        }

        console.log(`❌ No se encontró item con label: "${targetLabel}"`);
        return false;
      }, panelInfo.panelId, valorSeleccion);

      if (itemClicked) {
        logger.info(`✅ Item seleccionado: ${valorSeleccion}`);
        // Esperar a que se cierre el panel y se actualice el label
        await this.page.waitForTimeout(1000);
        
        // VERIFICACIÓN: Confirmar que el label cambió
        const currentLabel = await this.page.evaluate((labelId) => {
          const label = document.getElementById(labelId);
          return label ? label.textContent : null;
        }, componentInfo.labelId);
        
        logger.info(`Label actual después de selección: "${currentLabel}"`);
        
        if (currentLabel === valorSeleccion) {
          logger.info(`✅ Selección verificada correctamente: ${valorSeleccion}`);
        } else {
          logger.warn(`⚠️ El label no coincide. Esperado: "${valorSeleccion}", Actual: "${currentLabel}"`);
        }
      } else {
        logger.warn(`❌ No se pudo seleccionar el item: ${valorSeleccion}`);
      }

    } catch (err) {
      logger.error(`Error seleccionando Objeto de Contratación: ${err.message}`);
    }
  }

  async fillDescripcion(texto) {
    try {
      logger.info(`Ingresando descripción: ${texto}`);

      // Selector correcto basado en el diagnóstico
      const selector = 'input[id="tbBuscador:idFormBuscarProceso:descripcionObjeto"]';

      const element = await this.page.$(selector);
      if (element) {
        logger.info(`Elemento input descripción encontrado: ${selector}`);

        // Verificar que el elemento sea visible
        const isVisible = await element.isIntersectingViewport();
        logger.info(`¿Elemento input visible? ${isVisible}`);

        if (!isVisible) {
          await element.scrollIntoView();
          await this.page.waitForTimeout(500);
        }

        // Para PrimeFaces inputs, hacer focus primero
        await this.page.focus(selector);
        await this.page.waitForTimeout(200);

        // Limpiar el campo usando keyboard
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('a');
        await this.page.keyboard.up('Control');
        await this.page.keyboard.press('Backspace');
        await this.page.waitForTimeout(200);

        // Escribir el texto
        await this.page.keyboard.type(texto, { delay: 100 });

        logger.info(`Descripción ingresada: ${texto}`);
        await this.page.waitForTimeout(1000);
        return;
      }

      logger.warn(`No se encontró el elemento input con selector: ${selector}`);
    } catch (err) {
      logger.warn(`Error ingresando descripción: ${err.message}`);
    }
  }

  async selectAnio(anio) {
    try {
      logger.info(`Seleccionando año: ${anio}`);

      // Selector correcto basado en el diagnóstico
      const selector = 'select[id="tbBuscador:idFormBuscarProceso:anioConvocatoria_input"]';

      const element = await this.page.$(selector);
      if (element) {
        // Verificar que el elemento sea visible
        const isVisible = await element.isIntersectingViewport();
        if (!isVisible) {
          await element.scrollIntoView();
          await this.page.waitForTimeout(500);
        }

        // Seleccionar el valor
        await this.page.select(selector, anio);

        logger.info(`Año seleccionado: ${anio}`);
        await this.page.waitForTimeout(1000);
        return;
      }

      logger.warn(`No se pudo seleccionar año: ${anio}`);
    } catch (err) {
      logger.warn(`Error seleccionando año: ${err.message}`);
    }
  }

  async setFechaPublicacion(fechaDesde, fechaHasta) {
    try {
      logger.info(`Configurando fechas de publicación: ${fechaDesde} - ${fechaHasta}`);

      // Selectores para los campos de fecha de publicación
      const fechaDesdeSelector = 'input[id="tbBuscador:idFormBuscarProceso:fechaPublicacionDesde_input"]';
      const fechaHastaSelector = 'input[id="tbBuscador:idFormBuscarProceso:fechaPublicacionHasta_input"]';

      // Función helper para configurar una fecha
      const setFecha = async (selector, fecha, label) => {
        try {
          const element = await this.page.$(selector);
          if (element) {
            logger.info(`Elemento ${label} encontrado: ${selector}`);

            // Verificar que el elemento sea visible
            const isVisible = await element.isIntersectingViewport();
            if (!isVisible) {
              await element.scrollIntoView();
              await this.page.waitForTimeout(500);
            }

            // Para PrimeFaces date inputs, hacer focus primero
            await this.page.focus(selector);
            await this.page.waitForTimeout(200);

            // Limpiar el campo
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('a');
            await this.page.keyboard.up('Control');
            await this.page.keyboard.press('Backspace');
            await this.page.waitForTimeout(200);

            // Ingresar la fecha en formato dd/mm/yyyy
            await this.page.keyboard.type(fecha, { delay: 100 });

            logger.info(`${label} configurada: ${fecha}`);
            await this.page.waitForTimeout(500);
            return true;
          } else {
            logger.warn(`No se encontró el elemento ${label} con selector: ${selector}`);
            return false;
          }
        } catch (err) {
          logger.warn(`Error configurando ${label}: ${err.message}`);
          return false;
        }
      };

      // Configurar fecha desde
      const desdeSuccess = await setFecha(fechaDesdeSelector, fechaDesde, 'Fecha Desde');

      // Configurar fecha hasta
      const hastaSuccess = await setFecha(fechaHastaSelector, fechaHasta, 'Fecha Hasta');

      if (desdeSuccess && hastaSuccess) {
        logger.info(`Fechas de publicación configuradas exitosamente: ${fechaDesde} - ${fechaHasta}`);
        await this.page.waitForTimeout(1000);
        return true;
      } else {
        logger.warn('No se pudieron configurar todas las fechas de publicación');
        return false;
      }

    } catch (err) {
      logger.warn(`Error configurando fechas de publicación: ${err.message}`);
      return false;
    }
  }

  async clickBuscar() {
    try {
      logger.info('Haciendo click en buscar...');

      // Selector correcto basado en el diagnóstico
      const selector = 'button[id="tbBuscador:idFormBuscarProceso:btnBuscarSel"]';

      const element = await this.page.$(selector);
      if (element) {
        logger.info(`Elemento botón buscar encontrado: ${selector}`);

        // Verificar que el elemento sea visible
        const isVisible = await element.isIntersectingViewport();
        logger.info(`¿Elemento botón visible? ${isVisible}`);

        if (!isVisible) {
          await element.scrollIntoView();
          await this.page.waitForTimeout(500);
        }

        // Para PrimeFaces buttons, usar evaluate para hacer click
        const clickSuccess = await this.page.evaluate((sel) => {
          const button = document.querySelector(sel);
          if (button) {
            button.click();
            return true;
          }
          return false;
        }, selector);

        if (clickSuccess) {
          logger.info('Click en buscar realizado exitosamente');
          await this.page.waitForTimeout(2000);
          return;
        } else {
          logger.warn('No se pudo hacer click usando evaluate');
        }
      } else {
        logger.warn(`No se encontró el elemento botón con selector: ${selector}`);
      }

      logger.warn('No se encontró botón de buscar');
    } catch (err) {
      logger.error(`Error haciendo click en buscar: ${err.message}`);
    }
  }

  async waitForResults() {
    try {
      logger.info('Esperando resultados...');

      await this.page.waitForSelector('table[role="grid"] tbody tr', {
        timeout: this.options.timeout
      });

      await this.page.waitForTimeout(2000);
      logger.info('Tabla de resultados cargada');
    } catch (err) {
      logger.error('Error esperando resultados:', err);
      throw new Error('No se encontraron resultados en el tiempo esperado');
    }
  }

  async extractTableData() {
    try {
      const data = await this.page.evaluate(() => {
        const results = [];
        
        // PASO 4: Fallback o modo de respaldo
        // Primero intentar con la tabla principal
        let rows = document.querySelectorAll('table[role="grid"] tbody tr[data-ri]');
        
        // Si no hay filas, buscar cualquier tabla con clase que contenga 'ui-datatable'
        if (rows.length === 0) {
          console.warn('No se encontraron filas con selector principal. Buscando fallback...');
          const datatables = document.querySelectorAll('table[class*="ui-datatable"]');
          
          for (const table of datatables) {
            const tableRows = table.querySelectorAll('tbody tr');
            if (tableRows.length > 0) {
              console.info(`Fallback: Encontrada tabla ui-datatable con ${tableRows.length} filas`);
              rows = tableRows;
              break; // Rompe el bucle en cuanto encuentra una tabla válida
            }
          }
        }

        // Función helper para extraer texto limpio
        const getCleanText = (cell) => {
          if (!cell) return null;
          const links = cell.querySelectorAll('a');
          const images = cell.querySelectorAll('img');
          if (links.length > 0 || images.length > 0) {
            const textContent = cell.textContent?.trim();
            if (textContent && textContent !== ' ') {
              return textContent;
            }
            return null;
          }
          return cell.textContent?.trim() || null;
        };

        // Función para validar número
        const isNumber = (value) => {
          return value && !isNaN(parseInt(value));
        };

        // PASO 4: Procesamiento de cada fila
        rows.forEach((row, index) => {
          try {
            const cells = row.querySelectorAll('td');

            // Validar que haya al menos columnas mínimas esperadas
            // Estructura SEACE requiere mínimo 7 columnas: N°, Entidad, Fecha, Nomenclatura, Reiniciado, Objeto, Descripción
            if (cells.length < 7) {
              console.warn(`Fila ${index} tiene solo ${cells.length} celdas, se esperaba al menos 7`);
              return;
            }

            // PASO 4.1: Extraer valores según MAPEO EXACTO de tabla SEACE
            // Estructura de columnas en tabla SEACE:
            // [0] N° (número orden)
            // [1] Nombre o Sigla de la Entidad
            // [2] Fecha y Hora de Publicación
            // [3] Nomenclatura
            // [4] Reiniciado Desde
            // [5] Objeto de Contratación
            // [6] Descripción de Objeto
            // [7] Código SNIP
            // [8] Código Único de Inversión
            // [9] VR / VE / Cuantía de la contratación
            // [10] Moneda
            // [11] Versión SEACE
            // [12] Acciones (ignorar)
            
            const numero_orden = getCleanText(cells[0]);
            const nombre_entidad = getCleanText(cells[1]);           // Columna 1: Nombre entidad
            const fecha_publicacion = getCleanText(cells[2]);        // Columna 2: Fecha publicación
            const nomenclatura = getCleanText(cells[3]);             // Columna 3: Nomenclatura/Código
            const reiniciado_desde = getCleanText(cells[4]);         // Columna 4: Reiniciado desde
            const objeto_contratacion = getCleanText(cells[5]);      // Columna 5: Objeto contratación
            const descripcion_objeto = getCleanText(cells[6]);       // Columna 6: Descripción objeto
            const codigo_snip = getCleanText(cells[7]);              // Columna 7: Código SNIP
            const codigo_unico_inversion = getCleanText(cells[8]);   // Columna 8: Código Único de Inversión
            const monto_referencial_text = getCleanText(cells[9]);   // Columna 9: VR/VE/Cuantía (VALOR NUMÉRICO)
            const moneda = getCleanText(cells[10]);                  // Columna 10: Moneda (Soles, Dólares, etc.)
            const version_seace = getCleanText(cells[11]);           // Columna 11: Versión SEACE
            
            // DEBUG: Log para verificar extracción correcta de monto y moneda
            if (index === 0) {
              console.log('[DEBUG] Ejemplo de extracción de primera fila:');
              console.log(`  - Columna 8 (Código Único Inversión): "${codigo_unico_inversion}"`);
              console.log(`  - Columna 9 (Monto VR/VE/Cuantía): "${monto_referencial_text}"`);
              console.log(`  - Columna 10 (Moneda): "${moneda}"`);
            }

            // PASO 4.2: Validar que la fila sea de datos reales
            const isValidNumber = isNumber(numero_orden);
            const isNotHeader = nombre_entidad && nombre_entidad.toLowerCase() !== 'nombre o sigla de la entidad' && nombre_entidad.toLowerCase() !== 'entidad';
            const hasDescriptionLength = descripcion_objeto && descripcion_objeto.length >= 10;

            if (!isValidNumber || !isNotHeader || !hasDescriptionLength) {
              console.warn(`Fila ${index} falló validación: número=${isValidNumber}, entidad=${isNotHeader}, descripción=${hasDescriptionLength}`);
              return;
            }

            // Generar id_proceso único desde nomenclatura
            const idProceso = nomenclatura || `PROC-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;

            // PASO 4.3: Crear objeto proceso con MAPEO CORRECTO
            const proceso = {
              // ID único
              id_proceso: idProceso,

              // Columnas principales - MAPEO EXACTO A TABLA SEACE
              nombre_entidad: nombre_entidad,          // De columna [1]
              entidad_nombre: nombre_entidad,          // Alias para compatibilidad
              fecha_publicacion: fecha_publicacion,    // De columna [2]
              nomenclatura: nomenclatura,              // De columna [3]
              reiniciado_desde: reiniciado_desde,      // De columna [4]
              objeto_contratacion: objeto_contratacion,// De columna [5]
              descripcion_objeto: descripcion_objeto,  // De columna [6]
              codigo_snip: codigo_snip || null,        // De columna [7]

              // Datos de estado y tipo
              estado_proceso: 'Publicado',
              tipo_proceso: null,

              // URLs y referencias
              url_proceso: null,
              source_url: window.location.href,
              pagina_scraping: window.location.href,

              // Identificadores
              numero_convocatoria: nomenclatura,  // Usar nomenclatura como número convocatoria
              entidad_ruc: null,
              codigo_cui: codigo_unico_inversion || null,  // Código Único de Inversión

              // Ubicación (no disponible en tabla SEACE)
              departamento: null,
              provincia: null,
              distrito: null,

              // Económicos - monto_referencial contiene el valor numérico, moneda el tipo
              monto_referencial: monto_referencial_text && monto_referencial_text !== '---' ? monto_referencial_text : null,
              moneda: moneda || 'Soles',
              rubro: objeto_contratacion,  // Usar objeto_contratacion como categoría

              // Versión y metadatos
              version_seace: version_seace || '3',
              fecha_scraping: new Date().toISOString(),

              // Booleanos
              requiere_visita_previa: false,

              // JSON (se populará si hay datos OCDS disponibles)
              datos_ocds: null,

              // Fecha límite (no disponible en tabla principal)
              fecha_limite_presentacion: null
            };

            // Agregar al resultado si pasó todas las validaciones
            results.push(proceso);
            console.info(`Proceso extraído: ${idProceso} - ${entidad}`);

          } catch (err) {
            console.error(`Error extrayendo fila ${index}:`, err);
          }
        });

        console.info(`Total de procesos válidos extraídos: ${results.length}`);
        return results;
      });

      logger.info(`Extraídos ${data.length} procesos de la página actual con validaciones`);

      // Post-procesamiento: limpiar y normalizar datos
      return data.map(proceso => this.normalizeProcesoData(proceso));

    } catch (err) {
      logger.error('Error extrayendo datos de la tabla:', err);
      return [];
    }
  }

  normalizeProcesoData(proceso) {
    // 1. Convertir fecha a formato ISO datetime
    if (proceso.fecha_publicacion) {
      try {
        // Intentar parsear formato dd/mm/yyyy HH:MM
        const parts = proceso.fecha_publicacion.trim().split(' ');
        const fecha = parts[0];
        const hora = parts[1] || '00:00:00';
        
        const [dia, mes, anio] = fecha.split('/');
        if (dia && mes && anio) {
          proceso.fecha_publicacion = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')} ${hora}`;
        }
      } catch (err) {
        logger.warn(`Error parseando fecha: ${proceso.fecha_publicacion}`);
        proceso.fecha_publicacion = null;
      }
    } else {
      proceso.fecha_publicacion = null;
    }

    // 2. Convertir monto a número (en DB es DECIMAL(15,2))
    if (proceso.monto_referencial && proceso.monto_referencial !== '---' && proceso.monto_referencial !== 'N/A') {
      try {
        // Remover puntos de separador de miles y comas decimales
        const valorLimpio = proceso.monto_referencial.replace(/\./g, '').replace(/,/g, '.').trim();
        const montoNumero = parseFloat(valorLimpio);
        proceso.monto_referencial = isNaN(montoNumero) ? null : montoNumero;
      } catch (err) {
        logger.warn(`Error parseando monto: ${proceso.monto_referencial}`);
        proceso.monto_referencial = null;
      }
    } else {
      proceso.monto_referencial = null;
    }

    // 3. Validar moneda (debería ser 'Soles', 'Dólares', etc.)
    if (!proceso.moneda || proceso.moneda.trim() === '') {
      proceso.moneda = 'Soles'; // Default
    }

    // 4. Validar versión SEACE
    if (!proceso.version_seace || proceso.version_seace.trim() === '') {
      proceso.version_seace = '3'; // Default a SEACE 3
    }

    // 5. Limpiar valores nulos y vacíos
    Object.keys(proceso).forEach(key => {
      if (proceso[key] === '' || (typeof proceso[key] === 'string' && proceso[key].trim() === '')) {
        proceso[key] = null;
      }
    });

    // 6. Asegurar que campos críticos no sean nulos
    if (!proceso.id_proceso) {
      logger.warn('Advertencia: id_proceso es nulo, generando uno automático');
      proceso.id_proceso = `PROC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    if (!proceso.nombre_entidad) {
      proceso.nombre_entidad = 'Entidad Desconocida';
    }

    logger.info(`Datos normalizados para proceso ${proceso.id_proceso}`);
    return proceso;
  }

  async hasNextPage() {
    try {
      const pageInfo = await this.page.evaluate(() => {
        // Verificar si existe el botón siguiente habilitado
        const nextButton = document.querySelector('.ui-paginator-next:not(.ui-state-disabled)');
        const hasNext = nextButton !== null;

        // También verificar el texto del paginador para saber en qué página estamos
        const paginatorText = document.querySelector('.ui-paginator-current');
        const currentText = paginatorText ? paginatorText.textContent : '';

        // Extraer información de paginación
        const match = currentText.match(/Página:\s*(\d+)\/(\d+)/);
        const currentPage = match ? parseInt(match[1]) : 1;
        const totalPages = match ? parseInt(match[2]) : 1;

        return {
          hasNext,
          currentPage,
          totalPages,
          paginatorText: currentText
        };
      });

      logger.info(`Estado de paginación: Página ${pageInfo.currentPage}/${pageInfo.totalPages}, ¿Hay siguiente? ${pageInfo.hasNext}`);

      return pageInfo.hasNext;
    } catch (err) {
      logger.warn('Error verificando siguiente página:', err);
      return false;
    }
  }

  async goToNextPage() {
    try {
      logger.info('Navegando a la siguiente página...');

      // Obtener información antes de navegar
      const beforeInfo = await this.page.evaluate(() => {
        const paginatorText = document.querySelector('.ui-paginator-current');
        return paginatorText ? paginatorText.textContent : '';
      });

      // Hacer click en el botón siguiente
      await this.page.evaluate(() => {
        const nextButton = document.querySelector('.ui-paginator-next:not(.ui-state-disabled)');
        if (nextButton) {
          nextButton.click();
          return true;
        }
        return false;
      });

      // Esperar a que la página cambie - usar múltiples estrategias
      await this.page.waitForTimeout(2000);

      // Estrategia 1: Esperar a que cambie el texto del paginador
      try {
        await this.page.waitForFunction(
          (beforeText) => {
            const currentPaginator = document.querySelector('.ui-paginator-current');
            const currentText = currentPaginator ? currentPaginator.textContent : '';
            return currentText !== beforeText;
          },
          { timeout: 10000 },
          beforeInfo
        );
      } catch (e) {
        logger.warn('No se pudo verificar cambio en paginador, continuando...');
      }

      // Estrategia 2: Esperar a que aparezcan nuevas filas en la tabla
      await this.page.waitForSelector('table[role="grid"] tbody tr[data-ri]', {
        timeout: 30000
      });

      // Estrategia 3: Esperar un poco más para estabilidad
      await this.page.waitForTimeout(2000);

      // Verificar que la navegación fue exitosa
      const afterInfo = await this.page.evaluate(() => {
        const paginatorText = document.querySelector('.ui-paginator-current');
        const rowCount = document.querySelectorAll('table[role="grid"] tbody tr[data-ri]').length;
        return {
          paginatorText: paginatorText ? paginatorText.textContent : '',
          rowCount
        };
      });

      logger.info(`Navegación completada: ${afterInfo.paginatorText}, ${afterInfo.rowCount} filas visibles`);

      if (afterInfo.paginatorText === beforeInfo) {
        logger.warn('El texto del paginador no cambió, posible problema de navegación');
      }

    } catch (err) {
      logger.error('Error navegando a siguiente página:', err);
      throw err;
    }
  }

  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        logger.info('Browser cerrado');
      }
    } catch (err) {
      logger.error('Error cerrando browser:', err);
    }
  }
}

module.exports = SeaceScraper;
