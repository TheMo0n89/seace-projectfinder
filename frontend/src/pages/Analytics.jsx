/**
 * Página de Analytics Dashboard
 * Muestra métricas y gráficos del sistema SEACE
 */
import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  ChartBarIcon, 
  UsersIcon, 
  CurrencyDollarIcon,
  ServerStackIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import analyticsAPI from '../services/analyticsService';
import { LoadingSpinner } from '../components/ui/Loading';
import { Card, CardHeader, CardBody } from '../components/ui/Card';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await analyticsAPI.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Error cargando analytics:', err);
      setError(err.response?.data?.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">⚠️ {error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <p className="text-gray-500">No hay datos disponibles</p>
      </div>
    );
  }

  const { kpis, tendencias, topRegiones, estadoETL, actividadChatbot } = stats;

  // Colores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b']; // verde, rojo, amarillo

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SEACE Analytics</h1>
        <p className="text-gray-600">Panel de métricas y estadísticas del sistema</p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Procesos Activos */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Procesos Activos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {kpis.procesosActivos.total.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  {kpis.procesosActivos.tendencia === 'up' ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${kpis.procesosActivos.tendencia === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {kpis.procesosActivos.variacion > 0 ? '+' : ''}{kpis.procesosActivos.variacion}% vs mes anterior
                  </span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <ChartBarIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Monto Total */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monto Total (S/)</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {kpis.montoTotal.total}
                </p>
                <div className="flex items-center mt-2">
                  {kpis.montoTotal.tendencia === 'up' ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${kpis.montoTotal.tendencia === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {kpis.montoTotal.variacion > 0 ? '+' : ''}{kpis.montoTotal.variacion}% vs mes anterior
                  </span>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Usuarios Activos */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {kpis.usuariosActivos.total}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  +{kpis.usuariosActivos.nuevosEstaSemana} nuevos esta semana
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <UsersIcon className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Salud ETL */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Salud ETL</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {kpis.saludETL.porcentaje}%
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {kpis.saludETL.estado}
                </p>
              </div>
              <div className={`p-3 rounded-full ${kpis.saludETL.porcentaje >= 90 ? 'bg-green-100' : 'bg-red-100'}`}>
                <ServerStackIcon className={`w-8 h-8 ${kpis.saludETL.porcentaje >= 90 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Gráficos Row 1 - Tendencia */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Tendencia de Oportunidades</h3>
            <p className="text-sm text-gray-500">Relación entre cantidad de procesos y monto total (Millones S/)</p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tendencias}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="monto" 
                  stroke="#3b82f6" 
                  name="Monto (S/)" 
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="procesos" 
                  stroke="#10b981" 
                  name="Procesos" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Gráficos Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Regiones */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Top Regiones</h3>
            <p className="text-sm text-gray-500">Departamentos con más actividad</p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topRegiones} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="nombre" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Estado de Carga de Datos (ETL) */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Estado de Carga de Datos (ETL)</h3>
            <p className="text-sm text-gray-500">Últimas 24 horas</p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Exitosos', value: estadoETL.exitosos },
                    { name: 'Fallidos', value: estadoETL.fallidos },
                    { name: 'Pendientes', value: estadoETL.pendientes }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {PIE_COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xl font-bold text-green-600">{estadoETL.exitosos}</p>
                <p className="text-xs text-gray-500">Exitosos</p>
              </div>
              <div>
                <p className="text-xl font-bold text-red-600">{estadoETL.fallidos}</p>
                <p className="text-xs text-gray-500">Fallidos</p>
              </div>
              <div>
                <p className="text-xl font-bold text-yellow-600">{estadoETL.pendientes}</p>
                <p className="text-xs text-gray-500">Pendientes</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Actividad Chatbot AI */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Actividad Chatbot AI</h3>
            <p className="text-sm text-gray-500">Interacciones recientes</p>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col items-center justify-center h-64">
              <div className="bg-indigo-100 p-6 rounded-full mb-4">
                <ChatBubbleLeftRightIcon className="w-12 h-12 text-indigo-600" />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Consultas</p>
                <p className="text-xs text-gray-500">Últimas 24h</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {actividadChatbot.totalConsultas}
                </p>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">Tiempo Respuesta</p>
                <p className="text-xs text-gray-500">Promedio</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {actividadChatbot.tiempoRespuesta}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
