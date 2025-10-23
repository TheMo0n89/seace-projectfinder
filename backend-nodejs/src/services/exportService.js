/**
 * Servicio de exportación de datos a archivos TXT
 * Exporta datos extraídos del scraping antes de guardar en BD
 */
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

class ExportService {
  constructor() {
    this.exportDir = path.join(process.cwd(), 'logs', 'scraping-exports');
    this.ensureExportDirExists();
  }

  /**
   * Asegurar que el directorio de exportación existe
   */
  ensureExportDirExists() {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
      logger.info(`Directorio de exportación creado: ${this.exportDir}`);
    }
  }

  /**
   * Generar nombre de archivo con timestamp
   */
  generateFileName(prefix = 'scraping') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${prefix}_${timestamp}.txt`;
  }

  /**
   * Exportar procesos extraídos a archivo TXT
   * @param {Array} procesos - Array de procesos extraídos
   * @param {String} operationId - ID de la operación
   */
  async exportProcessesToTxt(procesos, operationId = null) {
    try {
      if (!Array.isArray(procesos) || procesos.length === 0) {
        logger.warn('No hay procesos para exportar');
        return null;
      }

      const fileName = this.generateFileName(operationId ? `scraping_${operationId}` : 'scraping');
      const filePath = path.join(this.exportDir, fileName);

      // Construir contenido del archivo
      let content = this.buildTxtContent(procesos, operationId);

      // Escribir archivo
      fs.writeFileSync(filePath, content, 'utf-8');
      
      logger.info(`Procesos exportados a TXT: ${filePath}`, {
        fileName,
        totalProcesos: procesos.length
      });

      return {
        success: true,
        fileName,
        filePath,
        totalProcesos: procesos.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error exportando procesos a TXT: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Construir contenido del archivo TXT
   */
  buildTxtContent(procesos, operationId = null) {
    const timestamp = new Date().toLocaleString('es-PE');
    
    let content = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                    REPORTE DE EXTRACCIÓN SEACE                                ║
║                                                                                ║
║  Fecha: ${timestamp}
║  Total de procesos: ${procesos.length}
`;

    if (operationId) {
      content += `║  ID Operación: ${operationId}\n`;
    }

    content += `╚════════════════════════════════════════════════════════════════════════════════╝

`;

    // Agregar procesos con formato
    procesos.forEach((proceso, index) => {
      content += `
─────────────────────────────────────────────────────────────────────────────────
PROCESO #${index + 1}
─────────────────────────────────────────────────────────────────────────────────`;

      // Datos disponibles del proceso
      const fields = {
        'ID Proceso': proceso.id_proceso,
        'Número Orden': proceso.numero_orden,
        'Entidad': proceso.nombre_entidad,
        'Objeto Contratación': proceso.objeto_contratacion,
        'Descripción': proceso.descripcion_objeto,
        'Fecha Publicación': proceso.fecha_publicacion,
        'Monto Referencial': proceso.monto_referencial ? `S/ ${parseFloat(proceso.monto_referencial).toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : 'N/A',
        'Moneda': proceso.moneda || 'PEN',
        'Departamento': proceso.departamento,
        'Provincia': proceso.provincia,
        'Distrito': proceso.distrito,
        'Estado': proceso.estado_proceso,
        'Reiniciado Desde': proceso.reiniciado_desde || 'No',
        'SNIP': proceso.snip || 'N/A',
        'CUI': proceso.cui || 'N/A',
        'Versión': proceso.version || 'N/A'
      };

      // Escribir campos
      Object.entries(fields).forEach(([label, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          content += `\n  ${label.padEnd(25)}: ${value}`;
        }
      });

      content += '\n';
    });

    // Resumen final
    content += `
╔════════════════════════════════════════════════════════════════════════════════╗
║                              RESUMEN FINAL                                     ║
╚════════════════════════════════════════════════════════════════════════════════╝

Total de Procesos Extraídos: ${procesos.length}

Distribución por Objeto de Contratación:
`;

    // Contar por objeto de contratación
    const porObjeto = {};
    procesos.forEach(p => {
      const obj = p.objeto_contratacion || 'No especificado';
      porObjeto[obj] = (porObjeto[obj] || 0) + 1;
    });

    Object.entries(porObjeto).forEach(([objeto, count]) => {
      const percentage = ((count / procesos.length) * 100).toFixed(1);
      content += `  • ${objeto}: ${count} procesos (${percentage}%)\n`;
    });

    // Montos totales
    const montoTotal = procesos.reduce((sum, p) => {
      const monto = parseFloat(p.monto_referencial) || 0;
      return sum + monto;
    }, 0);

    content += `\nMonto Total Referencial: S/ ${montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
    content += `\nMonto Promedio: S/ ${(montoTotal / procesos.length).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

    // Entidades principales
    const porEntidad = {};
    procesos.forEach(p => {
      const ent = p.nombre_entidad || 'No especificada';
      porEntidad[ent] = (porEntidad[ent] || 0) + 1;
    });

    const entidadesTop = Object.entries(porEntidad)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    content += `\n\nTop 5 Entidades:`;
    entidadesTop.forEach(([entidad, count], idx) => {
      content += `\n  ${idx + 1}. ${entidad}: ${count} procesos`;
    });

    content += `\n\n════════════════════════════════════════════════════════════════════════════════
Archivo generado automáticamente por SEACE ProjectFinder
════════════════════════════════════════════════════════════════════════════════
`;

    return content;
  }

  /**
   * Exportar procesos en formato JSON para análisis
   */
  async exportProcessesToJson(procesos, operationId = null) {
    try {
      if (!Array.isArray(procesos) || procesos.length === 0) {
        logger.warn('No hay procesos para exportar');
        return null;
      }

      const fileName = this.generateFileName(operationId ? `scraping_${operationId}_data` : 'scraping_data').replace('.txt', '.json');
      const filePath = path.join(this.exportDir, fileName);

      const jsonData = {
        metadata: {
          timestamp: new Date().toISOString(),
          operationId: operationId,
          totalProcesos: procesos.length
        },
        procesos: procesos
      };

      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');

      logger.info(`Procesos exportados a JSON: ${filePath}`, {
        fileName,
        totalProcesos: procesos.length
      });

      return {
        success: true,
        fileName,
        filePath,
        totalProcesos: procesos.length
      };
    } catch (error) {
      logger.error(`Error exportando procesos a JSON: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Exportar procesos en formato CSV
   */
  async exportProcessesToCsv(procesos, operationId = null) {
    try {
      if (!Array.isArray(procesos) || procesos.length === 0) {
        logger.warn('No hay procesos para exportar');
        return null;
      }

      const fileName = this.generateFileName(operationId ? `scraping_${operationId}_data` : 'scraping_data').replace('.txt', '.csv');
      const filePath = path.join(this.exportDir, fileName);

      // Headers CSV
      const headers = [
        'ID Proceso',
        'Número Orden',
        'Entidad',
        'Objeto Contratación',
        'Descripción',
        'Fecha Publicación',
        'Monto Referencial',
        'Moneda',
        'Departamento',
        'Provincia',
        'Distrito',
        'Estado',
        'SNIP',
        'CUI'
      ];

      let csvContent = headers.join(',') + '\n';

      procesos.forEach(proceso => {
        const row = [
          proceso.id_proceso,
          proceso.numero_orden,
          `"${proceso.nombre_entidad}"`,
          `"${proceso.objeto_contratacion}"`,
          `"${proceso.descripcion_objeto?.replace(/"/g, '""')}"`,
          proceso.fecha_publicacion,
          proceso.monto_referencial,
          proceso.moneda || 'PEN',
          proceso.departamento,
          proceso.provincia,
          proceso.distrito,
          proceso.estado_proceso,
          proceso.snip || '',
          proceso.cui || ''
        ];
        csvContent += row.join(',') + '\n';
      });

      fs.writeFileSync(filePath, csvContent, 'utf-8');

      logger.info(`Procesos exportados a CSV: ${filePath}`, {
        fileName,
        totalProcesos: procesos.length
      });

      return {
        success: true,
        fileName,
        filePath,
        totalProcesos: procesos.length
      };
    } catch (error) {
      logger.error(`Error exportando procesos a CSV: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Listar archivos de exportación
   */
  async listExportedFiles(filter = null) {
    try {
      const files = fs.readdirSync(this.exportDir);
      
      let filteredFiles = files;
      if (filter) {
        filteredFiles = files.filter(f => f.includes(filter));
      }

      const filesWithStats = filteredFiles.map(fileName => {
        const filePath = path.join(this.exportDir, fileName);
        const stats = fs.statSync(filePath);
        return {
          fileName,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      }).sort((a, b) => b.modifiedAt - a.modifiedAt);

      return filesWithStats;
    } catch (error) {
      logger.error(`Error listando archivos: ${error.message}`);
      return [];
    }
  }

  /**
   * Obtener contenido de un archivo de exportación
   */
  async getExportedFile(fileName) {
    try {
      const filePath = path.join(this.exportDir, fileName);
      
      // Validar que el archivo existe y está en el directorio permitido
      if (!filePath.startsWith(this.exportDir)) {
        throw new Error('Acceso denegado');
      }

      if (!fs.existsSync(filePath)) {
        throw new Error('Archivo no encontrado');
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      return {
        fileName,
        content,
        size: fs.statSync(filePath).size
      };
    } catch (error) {
      logger.error(`Error leyendo archivo: ${error.message}`);
      return null;
    }
  }
}

module.exports = new ExportService();
