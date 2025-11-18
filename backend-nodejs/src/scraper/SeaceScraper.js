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
      keywords = ['software'],
      objetoContratacion = 'servicio',  // Cambiar valor por defecto a 'servicio'
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
        keywords: keywords.join(', '),
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
        await this.selectObjetoContratacion(objetoContratacion);
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

      logger.info('Iniciando extracción de páginas...');

      while (hasMorePages && (maxProcesses === null || allResults.length < maxProcesses)) {
        logger.info(`=== PROCESANDO PÁGINA ${currentPage} ===`);
        const limitMsg = maxProcesses ? `${allResults.length}/${maxProcesses}` : `${allResults.length}`;
        logger.info(`Procesos acumulados hasta ahora: ${limitMsg}`);

        const pageResults = await this.extractTableData();

        if (pageResults.length === 0) {
          logger.warn(`Página ${currentPage}: No se encontraron procesos. Posible problema de carga.`);
          break;
        }

        allResults.push(...pageResults);
        totalPagesProcessed++;

        logger.info(`Página ${currentPage}: ${pageResults.length} procesos extraídos (Total acumulado: ${allResults.length})`);

        // Verificar si hemos alcanzado el límite (solo si existe)
        if (maxProcesses && allResults.length >= maxProcesses) {
          logger.info(`Límite de ${maxProcesses} procesos alcanzado. Deteniendo extracción.`);
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

      return maxProcesses ? allResults.slice(0, maxProcesses) : allResults;

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
      logger.info(`Seleccionando Objeto de Contratación: ${valor}`);

      // Selector correcto basado en el diagnóstico
      const selector = 'select[id="tbBuscador:idFormBuscarProceso:j_idt201_input"]';

      const element = await this.page.$(selector);
      if (element) {
        logger.info(`Elemento select encontrado: ${selector}`);

        // Verificar que el elemento sea visible
        const isVisible = await element.isIntersectingViewport();
        logger.info(`¿Elemento visible? ${isVisible}`);

        if (!isVisible) {
          await element.scrollIntoView();
          await this.page.waitForTimeout(500);
        }

        // Mapear valores comunes a los valores del select
        const valorMap = {
          'bien': '62',
          'consultoria': '63',
          'consultoría': '63',
          'obra': '64',
          'servicio': '65',
          'Bien': '62',
          'Consultoría de Obra': '63',
          'Servicio': '65'
        };

        const valorSeleccion = valorMap[valor] || valor;
        logger.info(`Valor original: "${valor}", Valor mapeado: "${valorSeleccion}"`);

        // Seleccionar por valor usando evaluate
        const success = await this.page.evaluate((sel, val) => {
          const select = document.querySelector(sel);
          if (select && select.tagName === 'SELECT') {
            console.log(`Select encontrado en evaluate: ${select.id}`);
            const options = Array.from(select.options);
            console.log(`Opciones disponibles: ${options.map(o => `${o.value}: ${o.text}`).join(', ')}`);

            const targetOption = options.find(opt =>
              opt.text.toLowerCase().includes(val.toLowerCase()) ||
              opt.value === val
            );

            if (targetOption) {
              console.log(`Opción objetivo encontrada: "${targetOption.value}" - "${targetOption.text}"`);
              select.value = targetOption.value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
              console.log(`Valor seleccionado: ${select.value}`);
              return true;
            } else {
              console.log(`No se encontró opción para: "${val}"`);
              return false;
            }
          } else {
            console.log(`Select no encontrado con selector: ${sel}`);
            return false;
          }
        }, selector, valorSeleccion);

        if (success) {
          logger.info(`Objeto de Contratación seleccionado exitosamente: ${valor} (valor interno: ${valorSeleccion})`);
          await this.page.waitForTimeout(1000);
          return;
        } else {
          logger.warn(`La evaluación de selección falló para: ${valorSeleccion}`);
        }
      } else {
        logger.warn(`No se encontró el elemento select con selector: ${selector}`);
      }

      logger.warn(`No se pudo seleccionar Objeto de Contratación: ${valor}`);
    } catch (err) {
      logger.warn(`Error seleccionando Objeto de Contratación: ${err.message}`);
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
            // [8] VR/VE/Cuantía de contratación
            // [9] Moneda
            // [10] Versión SEACE
            // [11] Acciones (ignorar)
            
            const numero_orden = getCleanText(cells[0]);
            const nombre_entidad = getCleanText(cells[1]);           // Columna 1: Nombre entidad
            const fecha_publicacion = getCleanText(cells[2]);        // Columna 2: Fecha publicación
            const nomenclatura = getCleanText(cells[3]);             // Columna 3: Nomenclatura/Código
            const reiniciado_desde = getCleanText(cells[4]);         // Columna 4: Reiniciado desde
            const objeto_contratacion = getCleanText(cells[5]);      // Columna 5: Objeto contratación
            const descripcion_objeto = getCleanText(cells[6]);       // Columna 6: Descripción objeto
            const codigo_snip = getCleanText(cells[7]);              // Columna 7: Código SNIP
            const monto_referencial_text = getCleanText(cells[8]);   // Columna 8: VR/VE/Cuantía
            const moneda = getCleanText(cells[9]);                   // Columna 9: Moneda
            const version_seace = getCleanText(cells[10]);           // Columna 10: Versión SEACE

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
              codigo_cui: null,

              // Ubicación (no disponible en tabla SEACE)
              departamento: null,
              provincia: null,
              distrito: null,

              // Económicos - EXTRAER DEL CAMPO VR/VE
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
