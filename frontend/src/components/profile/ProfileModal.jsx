/**
 * ProfileModal - Modal para editar perfil de usuario simplificado (5 campos)
 * 
 * Campos del formulario:
 * 1. Carrera o especialidad (select con input personalizado)
 * 2. Regiones de interés (multiselect)
 * 3. Rango de monto (sliders min/max)
 * 4. Tipos de proyecto (dinámico según carrera, con botón Agregar)
 * 5. Frecuencia de notificaciones (select)
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Info, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Opciones predefinidas
const CARRERAS = [
  'Ingeniería de Sistemas',
  'Ingeniería de Software',
  'Ciencias de la Computación',
  'Ingeniería Informática',
  'Ingeniería Electrónica',
  'Ingeniería Industrial',
  'Administración',
  'Contabilidad',
  'Arquitectura',
  'Ingeniería Civil',
  'Otra'
];

const REGIONES = [
  'Lima', 'Arequipa', 'Cusco', 'La Libertad', 'Piura', 'Lambayeque', 
  'Junín', 'Puno', 'Cajamarca', 'Ica', 'Ancash', 'Huánuco', 'Loreto',
  'San Martín', 'Ucayali', 'Ayacucho', 'Apurímac', 'Huancavelica',
  'Pasco', 'Tumbes', 'Tacna', 'Moquegua', 'Amazonas', 'Madre de Dios'
];

// Tipos de proyecto dinámicos según carrera
const TIPOS_PROYECTO_POR_CARRERA = {
  'Ingeniería de Sistemas': [
    'Desarrollo de Software', 'Infraestructura TI', 'Seguridad Informática', 
    'Integración de Sistemas', 'Consultoría TI', 'Soporte Técnico'
  ],
  'Ingeniería de Software': [
    'Desarrollo Web', 'Desarrollo Móvil', 'DevOps', 'Testing QA', 
    'Arquitectura de Software', 'Mantenimiento de Software'
  ],
  'Ciencias de la Computación': [
    'Machine Learning', 'IA', 'Data Science', 'Investigación', 
    'Algoritmos', 'Big Data'
  ],
  'Ingeniería Informática': [
    'Redes', 'Base de Datos', 'Cloud Computing', 'Virtualización', 
    'Backup y Recuperación', 'Seguridad de Red'
  ],
  'Ingeniería Electrónica': [
    'Sistemas Embebidos', 'IoT', 'Automatización', 'Telecomunicaciones', 
    'Hardware', 'Control Industrial'
  ],
  'Ingeniería Industrial': [
    'ERP', 'Gestión de Procesos', 'Optimización', 'Logística', 
    'Supply Chain', 'Business Intelligence'
  ],
  'Administración': [
    'Gestión de Proyectos', 'CRM', 'Administración de TI', 
    'Planificación Estratégica', 'Recursos Humanos', 'Finanzas'
  ],
  'Contabilidad': [
    'Sistemas Contables', 'Auditoría de Sistemas', 'Facturación Electrónica', 
    'Reporting Financiero', 'Tributación Digital', 'Compliance'
  ],
  'Arquitectura': [
    'Diseño CAD', 'BIM', 'Modelado 3D', 'Renders', 
    'Planificación Urbana', 'Gestión de Obra'
  ],
  'Ingeniería Civil': [
    'Gestión de Proyectos Civiles', 'Software de Construcción', 'AutoCAD Civil', 
    'Topografía Digital', 'Control de Obra', 'Presupuestos'
  ],
  'Otra': [
    'Consultoría', 'Capacitación', 'Investigación', 'Otros'
  ]
};

const FRECUENCIAS_NOTIFICACION = [
  { value: 'diaria', label: 'Diaria' },
  { value: 'cada_3_dias', label: 'Cada 3 días' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensual', label: 'Mensual' }
];

const ProfileModal = ({ isOpen, onClose, onProfileUpdated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    carrera: '',
    regiones_interes: [],
    monto_min: 0,
    monto_max: 1000000,
    tipos_proyecto: [],
    notification_frequency: 'semanal'
  });

  // Estado para campo personalizado de carrera
  const [customCarrera, setCustomCarrera] = useState('');
  const [showCustomCarrera, setShowCustomCarrera] = useState(false);

  // Estado para agregar nuevo tipo de proyecto
  const [newTipoProyecto, setNewTipoProyecto] = useState('');
  const [showAddTipo, setShowAddTipo] = useState(false);

  // Obtener tipos de proyecto según carrera
  const getTiposProyectoDisponibles = () => {
    const carreraActual = showCustomCarrera ? 'Otra' : formData.carrera;
    return TIPOS_PROYECTO_POR_CARRERA[carreraActual] || TIPOS_PROYECTO_POR_CARRERA['Otra'];
  };

  // Cargar perfil actual al abrir el modal
  useEffect(() => {
    if (isOpen && user) {
      loadProfile();
    }
  }, [isOpen, user]);

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/me/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { profile } = response.data.data;
      setFormData({
        carrera: profile.carrera || '',
        regiones_interes: profile.regiones_interes || [],
        monto_min: profile.monto_min || 0,
        monto_max: profile.monto_max || 1000000,
        tipos_proyecto: profile.tipos_proyecto || [],
        notification_frequency: profile.notification_frequency || 'semanal'
      });

      // Verificar si la carrera es personalizada
      if (profile.carrera && !CARRERAS.includes(profile.carrera)) {
        setCustomCarrera(profile.carrera);
        setShowCustomCarrera(true);
      }

    } catch (err) {
      console.error('Error cargando perfil:', err);
      setError('Error al cargar el perfil');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validaciones
      if (!formData.carrera && !customCarrera) {
        setError('La carrera o especialidad es requerida');
        setLoading(false);
        return;
      }

      if (formData.regiones_interes.length === 0) {
        setError('Selecciona al menos una región de interés');
        setLoading(false);
        return;
      }

      if (formData.tipos_proyecto.length === 0) {
        setError('Agrega al menos un tipo de proyecto');
        setLoading(false);
        return;
      }

      // Preparar datos para enviar
      const dataToSend = {
        ...formData,
        carrera: showCustomCarrera ? customCarrera : formData.carrera
      };

      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_URL}/users/me/profile`,
        dataToSend,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(true);
      setTimeout(() => {
        if (onProfileUpdated) onProfileUpdated(response.data.data);
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Error actualizando perfil:', err);
      setError(err.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleCarreraChange = (value) => {
    if (value === 'Otra') {
      setShowCustomCarrera(true);
      setFormData({ ...formData, carrera: '' });
    } else {
      setShowCustomCarrera(false);
      setCustomCarrera('');
      setFormData({ ...formData, carrera: value });
    }
  };

  const toggleRegion = (region) => {
    const newRegiones = formData.regiones_interes.includes(region)
      ? formData.regiones_interes.filter(r => r !== region)
      : [...formData.regiones_interes, region];
    setFormData({ ...formData, regiones_interes: newRegiones });
  };

  const toggleAllRegiones = () => {
    if (formData.regiones_interes.length === REGIONES.length) {
      // Si todas están seleccionadas, deseleccionar todas
      setFormData({ ...formData, regiones_interes: [] });
    } else {
      // Si no todas están seleccionadas, seleccionar todas
      setFormData({ ...formData, regiones_interes: [...REGIONES] });
    }
  };

  const addTipoProyecto = () => {
    if (newTipoProyecto.trim() && !formData.tipos_proyecto.includes(newTipoProyecto.trim())) {
      setFormData({
        ...formData,
        tipos_proyecto: [...formData.tipos_proyecto, newTipoProyecto.trim()]
      });
      setNewTipoProyecto('');
      setShowAddTipo(false);
    }
  };

  const removeTipoProyecto = (tipo) => {
    setFormData({
      ...formData,
      tipos_proyecto: formData.tipos_proyecto.filter(t => t !== tipo)
    });
  };

  const addTipoProyectoPredef = (tipo) => {
    if (!formData.tipos_proyecto.includes(tipo)) {
      setFormData({
        ...formData,
        tipos_proyecto: [...formData.tipos_proyecto, tipo]
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Editar Perfil Profesional</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Alertas */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <Info size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <Info size={20} />
              <span>¡Perfil actualizado exitosamente!</span>
            </div>
          )}

          {loadingProfile ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-indigo-600" size={48} />
            </div>
          ) : (
            <>
              {/* 1. Carrera o Especialidad */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  1. Carrera o Especialidad <span className="text-red-500">*</span>
                </label>
                <select
                  value={showCustomCarrera ? 'Otra' : formData.carrera}
                  onChange={(e) => handleCarreraChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="">Selecciona una carrera</option>
                  {CARRERAS.map(carrera => (
                    <option key={carrera} value={carrera}>{carrera}</option>
                  ))}
                </select>
                {showCustomCarrera && (
                  <input
                    type="text"
                    value={customCarrera}
                    onChange={(e) => setCustomCarrera(e.target.value)}
                    placeholder="Especifica tu carrera"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mt-2"
                    disabled={loading}
                  />
                )}
              </div>

              {/* 2. Regiones de Interés */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    2. Regiones de Interés <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">({formData.regiones_interes.length} seleccionadas)</span>
                  </label>
                  <button
                    type="button"
                    onClick={toggleAllRegiones}
                    className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition-colors font-medium"
                    disabled={loading}
                  >
                    {formData.regiones_interes.length === REGIONES.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                  </button>
                </div>
                <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-2">
                    {REGIONES.map(region => (
                      <label key={region} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.regiones_interes.includes(region)}
                          onChange={() => toggleRegion(region)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          disabled={loading}
                        />
                        <span className="text-sm text-gray-700">{region}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Rango de Monto */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  3. Rango de Monto de Proyectos (S/)
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Monto Mínimo: S/ {formData.monto_min.toLocaleString()}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1000000"
                      step="10000"
                      value={formData.monto_min}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        monto_min: parseInt(e.target.value),
                        monto_max: Math.max(parseInt(e.target.value), formData.monto_max)
                      })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Monto Máximo: S/ {formData.monto_max.toLocaleString()}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="5000000"
                      step="50000"
                      value={formData.monto_max}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        monto_max: parseInt(e.target.value),
                        monto_min: Math.min(formData.monto_min, parseInt(e.target.value))
                      })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* 4. Tipos de Proyecto (Dinámico según carrera) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    4. Tipos de Proyecto de Interés <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">({formData.tipos_proyecto.length} agregados)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddTipo(!showAddTipo)}
                    className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                    disabled={loading || !formData.carrera}
                  >
                    <Plus size={16} />
                    Agregar
                  </button>
                </div>

                {!formData.carrera && (
                  <p className="text-sm text-amber-600">
                    Selecciona primero una carrera para ver los tipos de proyecto disponibles
                  </p>
                )}

                {/* Input para agregar tipo personalizado */}
                {showAddTipo && formData.carrera && (
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 space-y-2">
                    <p className="text-xs text-gray-600 font-medium">Tipos de proyecto sugeridos:</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {getTiposProyectoDisponibles().map(tipo => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => addTipoProyectoPredef(tipo)}
                          className="px-3 py-1 bg-white border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition text-sm"
                          disabled={loading || formData.tipos_proyecto.includes(tipo)}
                        >
                          {formData.tipos_proyecto.includes(tipo) ? '✓ ' : '+ '}{tipo}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                      <input
                        type="text"
                        value={newTipoProyecto}
                        onChange={(e) => setNewTipoProyecto(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTipoProyecto())}
                        placeholder="O escribe un tipo personalizado..."
                        className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={addTipoProyecto}
                        className="px-4 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                        disabled={loading || !newTipoProyecto.trim()}
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de tipos agregados */}
                <div className="border border-gray-300 rounded-lg p-4 min-h-[60px]">
                  {formData.tipos_proyecto.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">
                      No hay tipos de proyecto agregados. Usa el botón "Agregar" para añadir.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.tipos_proyecto.map((tipo, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg"
                        >
                          <span className="text-sm">{tipo}</span>
                          <button
                            type="button"
                            onClick={() => removeTipoProyecto(tipo)}
                            className="text-indigo-600 hover:text-indigo-900 transition"
                            disabled={loading}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Frecuencia de Notificaciones */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  5. Frecuencia de Notificaciones
                </label>
                <select
                  value={formData.notification_frequency}
                  onChange={(e) => setFormData({ ...formData, notification_frequency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={loading}
                >
                  {FRECUENCIAS_NOTIFICACION.map(freq => (
                    <option key={freq.value} value={freq.value}>{freq.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || loadingProfile}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Guardando...
              </>
            ) : (
              <>
                <Save size={20} />
                Guardar Perfil
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
