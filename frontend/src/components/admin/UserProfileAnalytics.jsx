/**
 * Componente de Analytics de Perfil de Usuario
 * Muestra métricas detalladas de un usuario específico
 */
import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Treemap
} from 'recharts';
import { 
  UserCircleIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  CursorArrowRaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import analyticsAPI from '../../services/analyticsService';
import { LoadingSpinner } from '../ui/Loading';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

// Componente InfoPanel para mostrar explicaciones
const InfoPanel = ({ title, children }) => (
  <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
    <div className="flex items-start">
      <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
      <div>
        {title && <h4 className="text-sm font-semibold text-blue-900 mb-1">{title}</h4>}
        <div className="text-sm text-blue-800">{children}</div>
      </div>
    </div>
  </div>
);

const UserProfileAnalytics = ({ userId, userName, userEmail, userRole, lastLogin, createdAt }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserStats();
    }
  }, [userId]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const data = await analyticsAPI.getUserStats(userId);
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Error cargando user stats:', err);
      setError(err.response?.data?.message || 'Error al cargar estadísticas del usuario');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">⚠️ {error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay datos disponibles</p>
      </div>
    );
  }

  const { completitudPerfil, embudoConversion, nubeIntereses, historialInteracciones, statsRecomendaciones } = stats;

  // Colores
  const COLORS_COMPLETITUD = ['#10b981', '#e5e7eb'];
  const COLORS_INTERESES = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  // Datos para gráfico de completitud
  const completitudData = [
    { name: 'Completado', value: completitudPerfil.porcentaje },
    { name: 'Pendiente', value: 100 - completitudPerfil.porcentaje }
  ];

  // Datos para embudo de conversión
  const embudoData = [
    { etapa: 'Enviadas', cantidad: embudoConversion.enviadas, porcentaje: 100 },
    { 
      etapa: 'Vistas', 
      cantidad: embudoConversion.vistas, 
      porcentaje: embudoConversion.enviadas > 0 
        ? ((embudoConversion.vistas / embudoConversion.enviadas) * 100).toFixed(1) 
        : 0 
    },
    { 
      etapa: 'Clicks', 
      cantidad: embudoConversion.clicks, 
      porcentaje: embudoConversion.enviadas > 0 
        ? ((embudoConversion.clicks / embudoConversion.enviadas) * 100).toFixed(1) 
        : 0 
    }
  ];

  // Mapeo de acciones a íconos
  const getActionIcon = (accion) => {
    switch (accion.toLowerCase()) {
      case 'click':
        return <CursorArrowRaysIcon className="w-4 h-4 text-blue-500" />;
      case 'chatbot':
        return <ChatBubbleLeftIcon className="w-4 h-4 text-purple-500" />;
      case 'login':
        return <UserCircleIcon className="w-4 h-4 text-green-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  // Formato de fecha
  const formatFecha = (fecha) => {
    const date = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    if (date.toDateString() === hoy.toDateString()) {
      return `Hoy, ${date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === ayer.toDateString()) {
      return `Ayer, ${date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('es-PE', { 
        day: '2-digit', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // Calcular tiempo desde último login
  const getTimeSinceLastLogin = () => {
    if (!lastLogin) return 'Nunca';
    const now = new Date();
    const login = new Date(lastLogin);
    const diffMs = now - login;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  };

  // Calcular score de afinidad (promedio de scores de recomendaciones)
  const getAffinityScore = () => {
    if (!stats || !stats.statsRecomendaciones) return 'N/A';
    const avgScore = stats.statsRecomendaciones.scorePromedio;
    if (!avgScore || avgScore === 0) return 'N/A';
    return `${(avgScore / 10).toFixed(1)}/10`;
  };

  return (
    <div className="space-y-6">
      {/* Header del usuario */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white/20 p-4 rounded-full mr-4">
              <UserCircleIcon className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{userName}</h2>
              <p className="text-blue-100 flex items-center">
                <EnvelopeIcon className="w-4 h-4 mr-2" />
                {userEmail}
              </p>
              <p className="text-blue-100 text-sm mt-1">
                Rol: {userRole === 'admin' ? 'Administrador' : 'Usuario'} · 
                Miembro desde {createdAt ? new Date(createdAt).toLocaleDateString('es-PE', { month: 'short', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-blue-100">Último Acceso</p>
            <p className="text-lg font-semibold">{getTimeSinceLastLogin()}</p>
          </div>
          <div>
            <p className="text-sm text-blue-100">Score Afinidad</p>
            <p className="text-lg font-semibold">{getAffinityScore()}</p>
          </div>
        </div>
      </div>

      {/* Grid de métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completitud del Perfil */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Completitud del Perfil</h3>
            <p className="text-sm text-gray-500">Datos necesarios para recomendar</p>
          </CardHeader>
          <CardBody>
            <div className="relative flex items-center justify-center mb-6">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={completitudData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {completitudData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_COMPLETITUD[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-4xl font-bold text-gray-900">{completitudPerfil.porcentaje}%</p>
                <p className="text-sm text-gray-500">Completado</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{completitudPerfil.campos.datosPersonales ? '✅' : '⚠️'} Datos Personales</span>
                <span className={`text-sm font-medium ${completitudPerfil.campos.datosPersonales ? 'text-green-600' : 'text-yellow-600'}`}>
                  {completitudPerfil.campos.datosPersonales ? 'Completado' : 'Pendiente'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{completitudPerfil.campos.rubrosInteres ? '✅' : '⚠️'} Rubros de Interés</span>
                <span className={`text-sm font-medium ${completitudPerfil.campos.rubrosInteres ? 'text-green-600' : 'text-yellow-600'}`}>
                  {completitudPerfil.campos.rubrosInteres ? 'Completado' : 'Pendiente'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{completitudPerfil.campos.rangoMontos ? '✅' : '⚠️'} Rango de Montos</span>
                <span className={`text-sm font-medium ${completitudPerfil.campos.rangoMontos ? 'text-green-600' : 'text-yellow-600'}`}>
                  {completitudPerfil.campos.rangoMontos ? 'Completado' : 'Pendiente'}
                </span>
              </div>
            </div>
            <InfoPanel title="¿Cómo se calcula?">
              <p>Este gráfico muestra qué tan completo está el perfil del usuario. Los datos se obtienen de:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li><strong>Datos Personales:</strong> Tabla <code>users</code> - campos como nombre, email, carrera y especialidad.</li>
                <li><strong>Rubros de Interés:</strong> Tabla <code>preferencias</code> - rubros que el usuario ha seleccionado como favoritos.</li>
                <li><strong>Rango de Montos:</strong> Tabla <code>preferencias</code> - montos mínimo y máximo de interés.</li>
              </ul>
              <p className="mt-2"><strong>Importancia:</strong> Un perfil completo permite generar recomendaciones más precisas y personalizadas.</p>
            </InfoPanel>
          </CardBody>
        </Card>

        {/* Embudo de Conversión Personal */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Embudo de Conversión Personal</h3>
            <p className="text-sm text-gray-500">Efectividad de las recomendaciones</p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={embudoData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="etapa" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Insight:</strong> El usuario ve el 30% de las recomendaciones, pero solo hace click en el 8%. 
                Sugerimos ajustar el filtro de "Región".
              </p>
            </div>
            <InfoPanel title="¿Cómo se calcula?">
              <p>Muestra la efectividad de las recomendaciones a través de un embudo con tres etapas:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li><strong>Enviadas:</strong> Total de recomendaciones generadas para el usuario (tabla <code>user_recommendations</code>).</li>
                <li><strong>Vistas:</strong> Recomendaciones que el usuario ha visualizado (campo <code>seen = true</code>).</li>
                <li><strong>Clicks:</strong> Procesos que el usuario ha abierto desde recomendaciones (tabla <code>user_interactions</code> con tipo <code>'click'</code>).</li>
              </ul>
              <p className="mt-2"><strong>Importancia:</strong> Identifica puntos de abandono y ayuda a mejorar la relevancia de las recomendaciones.</p>
            </InfoPanel>
          </CardBody>
        </Card>
      </div>

      {/* Nube de Intereses */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Nube de Intereses</h3>
          <p className="text-sm text-gray-500">Detectados por IA</p>
        </CardHeader>
        <CardBody>
          {nubeIntereses.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {nubeIntereses.map((item, index) => {
                // Calcular tamaño basado en frecuencia
                const maxFrecuencia = Math.max(...nubeIntereses.map(i => i.frecuencia));
                const size = 12 + (item.frecuencia / maxFrecuencia) * 12; // 12-24px
                const color = COLORS_INTERESES[index % COLORS_INTERESES.length];
                
                return (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-full font-medium"
                    style={{
                      fontSize: `${size}px`,
                      backgroundColor: `${color}20`,
                      color: color
                    }}
                  >
                    {item.interes}
                    {item.monto && item.monto > 0 ? (
                      <span className="ml-1 text-xs">
                        S/ {item.monto >= 1000000 
                          ? `${(item.monto / 1000000).toFixed(2)}M` 
                          : item.monto >= 1000 
                          ? `${(item.monto / 1000).toFixed(2)}K` 
                          : item.monto.toFixed(2)}
                      </span>
                    ) : (
                      <span className="ml-1 text-xs">({item.frecuencia} {item.frecuencia === 1 ? 'vez' : 'veces'})</span>
                    )}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay datos de intereses disponibles</p>
          )}
          <InfoPanel title="¿Cómo se calcula?">
            <p>Detecta los rubros y categorías de mayor interés del usuario mediante análisis de sus interacciones:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li><strong>Fuente de datos:</strong> Tabla <code>user_interactions</code> - clicks en procesos y consultas del chatbot.</li>
              <li><strong>Detección por IA:</strong> Se analiza el rubro, objeto de contratación y palabras clave de los procesos con los que interactúa.</li>
              <li><strong>Tamaño:</strong> El tamaño de cada etiqueta refleja la frecuencia de interacción.</li>
              <li><strong>Monto:</strong> Se muestra el monto total acumulado de procesos en ese rubro.</li>
            </ul>
            <p className="mt-2"><strong>Importancia:</strong> Permite entender los intereses reales del usuario más allá de sus preferencias declaradas.</p>
          </InfoPanel>
        </CardBody>
      </Card>

      {/* Historial de Interacciones */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Historial de Interacciones</h3>
          <p className="text-sm text-gray-500">Últimas acciones registradas</p>
        </CardHeader>
        <CardBody>
          {historialInteracciones.length > 0 ? (
            <div className="space-y-3">
              {historialInteracciones.map((interaccion, index) => (
                <div key={index} className="flex items-start border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex-shrink-0 mr-3 mt-1">
                    {getActionIcon(interaccion.accion)}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-gray-900">{interaccion.accion}</p>
                    <p className="text-sm text-gray-600 mt-1">{interaccion.detalle}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatFecha(interaccion.fecha)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay interacciones registradas</p>
          )}
          <InfoPanel title="¿Cómo se registran las interacciones?">
            <p>Todas las acciones del usuario en la plataforma se registran automáticamente en tiempo real:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li><strong>Login:</strong> Se registra cada vez que el usuario inicia sesión.</li>
              <li><strong>Click:</strong> Cuando el usuario hace clic en un proceso para ver detalles (endpoint <code>/procesos/:id</code>).</li>
              <li><strong>Chatbot:</strong> Cada consulta realizada al chatbot con su pregunta y respuesta.</li>
              <li><strong>Recomendaciones:</strong> Visualización y ocultamiento de recomendaciones.</li>
            </ul>
            <p className="mt-2"><strong>Tabla:</strong> <code>user_interactions</code> con campos <code>user_id</code>, <code>tipo_interaccion</code>, <code>proceso_id</code>, <code>metadatos</code> y <code>timestamp</code>.</p>
            <p className="mt-2"><strong>Importancia:</strong> Permite rastrear el comportamiento del usuario y mejorar el sistema de recomendaciones.</p>
          </InfoPanel>
        </CardBody>
      </Card>

      {/* GRÁFICOS AVANZADOS */}
      
      {/* Grid de gráficos avanzados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Radar - Métricas Multidimensionales */}
        {stats.radarMetrics && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Perfil Multidimensional</h3>
              <p className="text-sm text-gray-500">Análisis 360° del usuario</p>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  { metrica: 'Actividad', valor: stats.radarMetrics.actividadGeneral, fullMark: 100 },
                  { metrica: 'Chatbot', valor: stats.radarMetrics.usoChatbot, fullMark: 100 },
                  { metrica: 'Clicks', valor: stats.radarMetrics.clicksRecomendaciones, fullMark: 100 },
                  { metrica: 'Perfil', valor: stats.radarMetrics.completitudPerfil, fullMark: 100 },
                  { metrica: 'Diversidad', valor: stats.radarMetrics.diversificacionIntereses, fullMark: 100 }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metrica" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Score" dataKey="valor" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                  <span>Actividad: {stats.radarMetrics.actividadGeneral.toFixed(0)}%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                  <span>Chatbot: {stats.radarMetrics.usoChatbot.toFixed(0)}%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                  <span>Clicks: {stats.radarMetrics.clicksRecomendaciones.toFixed(0)}%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                  <span>Diversidad: {stats.radarMetrics.diversificacionIntereses.toFixed(0)}%</span>
                </div>
              </div>
              <InfoPanel title="¿Qué mide cada dimensión?">
                <ul className="space-y-2 list-disc list-inside">
                  <li><strong>Actividad General (0-100):</strong> Interacciones en el último día. 20 interacciones/día = 100%.</li>
                  <li><strong>Uso Chatbot (0-100):</strong> Consultas al chatbot en el último día. 10 consultas/día = 100%.</li>
                  <li><strong>Clicks Recomendaciones (0-100):</strong> Clicks en procesos en el último día. 10 clicks/día = 100%.</li>
                  <li><strong>Completitud Perfil (0-100):</strong> 4 campos: Nombre completo, Email, Rubros de interés, Rango de montos.</li>
                  <li><strong>Diversificación (0-100):</strong> Variedad de rubros/categorías con los que interactúa.</li>
                </ul>
                <p className="mt-2"><strong>Nota:</strong> Las métricas se actualizan en tiempo real basándose en la actividad del último día para mostrar engagement actual.</p>
              </InfoPanel>
            </CardBody>
          </Card>
        )}

        {/* Gauge Chart - Salud del Usuario */}
        {stats.healthScore && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Salud del Usuario</h3>
              <p className="text-sm text-gray-500">Nivel de engagement general</p>
            </CardHeader>
            <CardBody>
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Score', value: stats.healthScore.score },
                        { name: 'Restante', value: 100 - stats.healthScore.score }
                      ]}
                      cx="50%"
                      cy="50%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill={stats.healthScore.color} />
                      <Cell fill="#e5e7eb" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center -mt-8">
                  <p className="text-4xl font-bold" style={{ color: stats.healthScore.color }}>
                    {stats.healthScore.score}%
                  </p>
                  <p className="text-lg font-semibold text-gray-700 mt-2">
                    {stats.healthScore.nivel}
                  </p>
                </div>
                <div className="mt-6 w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Actividad (40%):</span>
                    <span className="font-medium">{stats.healthScore.desglose.actividad.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Perfil (30%):</span>
                    <span className="font-medium">{stats.healthScore.desglose.completitudPerfil.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Engagement (30%):</span>
                    <span className="font-medium">{stats.healthScore.desglose.engagement.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              <InfoPanel title="¿Cómo se calcula el Health Score?">
                <p>Es un indicador compuesto que refleja el nivel de compromiso del usuario con la plataforma:</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li><strong>Actividad (40%):</strong> Interacciones recientes vs. inactividad.</li>
                  <li><strong>Perfil (30%):</strong> Completitud de datos personales y preferencias.</li>
                  <li><strong>Engagement (30%):</strong> Tasa de clicks en recomendaciones y uso del chatbot.</li>
                </ul>
                <p className="mt-2"><strong>Clasificación:</strong></p>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  <li>🟢 <strong>Activo (70-100%):</strong> Usuario muy comprometido.</li>
                  <li>🟡 <strong>Moderado (40-69%):</strong> Uso regular pero mejorable.</li>
                  <li>🔴 <strong>Inactivo (0-39%):</strong> Riesgo de abandono.</li>
                </ul>
                <p className="mt-2"><strong>Fuente:</strong> Agregación de métricas de <code>user_interactions</code>, <code>user_recommendations</code> y <code>users</code>.</p>
              </InfoPanel>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Heatmap de Actividad */}
      {stats.activityHeatmap && stats.activityHeatmap.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Patrón de Actividad</h3>
            <p className="text-sm text-gray-500">Días y horas de mayor uso (últimos 90 días)</p>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Tabla heatmap */}
                <div className="flex flex-col gap-1">
                  {/* Header con días */}
                  <div className="flex gap-1">
                    <div className="w-12"></div>
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia, idx) => (
                      <div key={idx} className="flex-1 text-center text-xs font-semibold text-gray-600">
                        {dia}
                      </div>
                    ))}
                  </div>
                  
                  {/* Filas por hora */}
                  {[...Array(24)].map((_, hora) => {
                    const maxIntensidad = Math.max(...stats.activityHeatmap.map(h => h.intensidad), 1);
                    
                    return (
                      <div key={hora} className="flex gap-1">
                        <div className="w-12 text-xs text-gray-500 flex items-center justify-end pr-2">
                          {hora}h
                        </div>
                        {[0, 1, 2, 3, 4, 5, 6].map(dia => {
                          const cell = stats.activityHeatmap.find(
                            h => h.diaSemana === dia && h.hora === hora
                          );
                          const intensidad = cell ? cell.intensidad : 0;
                          const opacity = intensidad > 0 ? (intensidad / maxIntensidad) * 0.8 + 0.2 : 0;
                          
                          return (
                            <div
                              key={`${dia}-${hora}`}
                              className="flex-1 h-6 rounded cursor-pointer hover:ring-2 hover:ring-blue-400"
                              style={{
                                backgroundColor: intensidad > 0 ? '#3b82f6' : '#f3f4f6',
                                opacity: opacity
                              }}
                              title={`${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][dia]} ${hora}:00 - ${intensidad} interacciones`}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center mt-4 text-xs text-gray-500">
                  <span className="mr-2">Menos</span>
                  <div className="flex gap-1">
                    {[0.2, 0.4, 0.6, 0.8, 1].map((opacity, idx) => (
                      <div
                        key={idx}
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: '#3b82f6', opacity }}
                      />
                    ))}
                  </div>
                  <span className="ml-2">Más</span>
                </div>
              </div>
            </div>
            <InfoPanel title="¿Cómo interpretar el Heatmap?">
              <p>Muestra los patrones de uso del usuario a lo largo de la semana y el día:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li><strong>Eje horizontal:</strong> Días de la semana (Domingo a Sábado).</li>
                <li><strong>Eje vertical:</strong> Horas del día (0-23h).</li>
                <li><strong>Color:</strong> Intensidad de actividad - más oscuro = más interacciones.</li>
              </ul>
              <p className="mt-2"><strong>Cálculo:</strong> Se agrupan las interacciones de los últimos 90 días por día de la semana y hora.</p>
              <p className="mt-2"><strong>Fuente:</strong> <code>SELECT EXTRACT(DOW FROM timestamp) as dia, EXTRACT(HOUR FROM timestamp) as hora, COUNT(*) FROM user_interactions</code>.</p>
              <p className="mt-2"><strong>Uso:</strong> Identifica los mejores momentos para enviar notificaciones o programar acciones de engagement.</p>
            </InfoPanel>
          </CardBody>
        </Card>
      )}

      {/* Treemap de Montos */}
      {stats.montoTreemap && stats.montoTreemap.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Distribución de Montos por Rubro</h3>
            <p className="text-sm text-gray-500">Visualización jerárquica de oportunidades</p>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {stats.montoTreemap.map((rubro, idx) => {
                const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#f43f5e'];
                const color = colors[idx % colors.length];
                const porcentaje = ((rubro.montoTotal / stats.montoTreemap.reduce((sum, r) => sum + r.montoTotal, 0)) * 100).toFixed(1);
                
                return (
                  <div key={idx} className="border rounded-lg overflow-hidden">
                    <div 
                      className="p-4 text-white cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: color }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-lg">{rubro.rubro}</h4>
                          <p className="text-sm opacity-90">
                            {rubro.subcategorias.length} subcategoría{rubro.subcategorias.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            S/ {rubro.montoTotal >= 1000000 
                              ? `${(rubro.montoTotal / 1000000).toFixed(2)}M` 
                              : rubro.montoTotal >= 1000 
                              ? `${(rubro.montoTotal / 1000).toFixed(2)}K` 
                              : rubro.montoTotal.toFixed(2)}
                          </p>
                          <p className="text-sm opacity-90">{porcentaje}% del total</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {rubro.subcategorias.map((sub, subIdx) => (
                          <details 
                            key={subIdx}
                            className="bg-white rounded border hover:shadow-md transition-shadow"
                          >
                            <summary className="p-3 cursor-pointer hover:bg-gray-50">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 pr-2">
                                  <p className="font-medium text-sm text-gray-900">{sub.nombre}</p>
                                  <p className="text-xs text-gray-500 mt-1">{sub.cantidad} proceso{sub.cantidad !== 1 ? 's' : ''}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-gray-900">
                                    S/ {sub.monto >= 1000000 
                                      ? `${(sub.monto / 1000000).toFixed(2)}M` 
                                      : sub.monto >= 1000 
                                      ? `${(sub.monto / 1000).toFixed(2)}K` 
                                      : sub.monto.toFixed(2)}
                                  </p>
                                  <div 
                                    className="mt-1 h-1 rounded-full"
                                    style={{ 
                                      backgroundColor: color,
                                      width: `${((sub.monto / rubro.montoTotal) * 100)}%`,
                                      minWidth: '10%'
                                    }}
                                  />
                                </div>
                              </div>
                            </summary>
                            {sub.procesos && sub.procesos.length > 0 && (
                              <div className="px-3 pb-3 border-t pt-2 space-y-2">
                                {sub.procesos.map((proceso, pIdx) => (
                                  <div key={pIdx} className="text-xs bg-gray-50 p-2 rounded">
                                    <p className="font-medium text-gray-800">{proceso.nombre_entidad}</p>
                                    <p className="text-gray-600 mt-1">{proceso.objeto_contratacion}</p>
                                    <p className="text-gray-900 font-semibold mt-1">
                                      S/ {proceso.monto >= 1000000 
                                        ? `${(proceso.monto / 1000000).toFixed(2)}M` 
                                        : proceso.monto >= 1000 
                                        ? `${(proceso.monto / 1000).toFixed(2)}K` 
                                        : proceso.monto.toFixed(2)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </details>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <InfoPanel title="¿Qué representa esta visualización?">
              <p>Muestra la distribución de montos de procesos por rubro y tipo, considerando tanto recomendaciones como interacciones:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li><strong>Fuente de datos:</strong> Procesos de recomendaciones (<code>user_recommendations</code>) e interacciones (<code>user_interactions</code>).</li>
                <li><strong>Rubros principales:</strong> Agrupación por rubro del proceso (Obra, Bien, Servicio, etc.).</li>
                <li><strong>Subcategorías:</strong> Tipos de proceso dentro de cada rubro (LP, ADS, AMC, etc.).</li>
                <li><strong>Procesos detallados:</strong> Haz clic en cada subcategoría para ver los procesos específicos considerados.</li>
                <li><strong>Montos:</strong> Se muestran en formato M (millones), K (miles) o valor exacto según corresponda.</li>
              </ul>
              <p className="mt-2"><strong>Uso:</strong> Identifica qué rubros y tipos de proceso concentran las mayores oportunidades de negocio relevantes para el usuario.</p>
            </InfoPanel>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default UserProfileAnalytics;
