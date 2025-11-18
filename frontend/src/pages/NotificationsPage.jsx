/**
 * NotificationsPage - Página completa de recomendaciones personalizadas
 * 
 * Características:
 * - Lista paginada de todas las recomendaciones
 * - Filtros: todas, no vistas, vistas
 * - Ordenamiento por score, fecha
 * - Botón para generar nuevas recomendaciones
 * - Estadísticas de recomendaciones
 * - Marcado individual y masivo como visto
 */

import React, { useState, useEffect } from 'react';
import { 
  Bell, RefreshCw, Filter, CheckCircle, ExternalLink, 
  TrendingUp, Calendar, DollarSign, MapPin, Loader2, Info 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Pagination } from '../components/ui/Pagination';
import { Card } from '../components/ui/Card';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const NotificationsPage = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState({ total: 0, unseen: 0, seen: 0, average_score: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filtros y paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all'); // all, unseen, seen
  const [limit] = useState(20);

  useEffect(() => {
    loadRecommendations();
    loadStats();
  }, [currentPage, filter]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const params = {
        page: currentPage,
        limit: limit
      };

      if (filter === 'unseen') {
        params.only_unseen = true;
      } else if (filter === 'seen') {
        params.only_unseen = false;
      }

      const response = await axios.get(`${API_URL}/users/me/recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setRecommendations(response.data.data.items || []);
      setTotalPages(response.data.data.pages || 1);
    } catch (err) {
      console.error('Error cargando recomendaciones:', err);
      setError('Error al cargar las recomendaciones');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/me/recommendations/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.data);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  };

  const generateRecommendations = async (forceRegenerate = false) => {
    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${API_URL}/users/me/recommendations/generate`,
        { force_regenerate: forceRegenerate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`¡Se generaron ${response.data.data.generated_count} nuevas recomendaciones!`);
      loadRecommendations();
      loadStats();
    } catch (err) {
      console.error('Error generando recomendaciones:', err);
      setError(err.response?.data?.message || 'Error al generar recomendaciones');
    } finally {
      setGenerating(false);
    }
  };

  const markAsSeen = async (recommendationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/users/me/recommendations/seen`,
        { recommendation_ids: [recommendationId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Actualizar estado local
      setRecommendations(recommendations.map(rec =>
        rec.id === recommendationId ? { ...rec, seen: true } : rec
      ));
      setStats({ ...stats, unseen: Math.max(0, stats.unseen - 1), seen: stats.seen + 1 });
    } catch (err) {
      console.error('Error marcando recomendación como vista:', err);
    }
  };

  const markAllAsSeen = async () => {
    try {
      const token = localStorage.getItem('token');
      const unseenIds = recommendations.filter(r => !r.seen).map(r => r.id);
      
      if (unseenIds.length === 0) return;

      await axios.post(
        `${API_URL}/users/me/recommendations/seen`,
        { recommendation_ids: unseenIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Actualizar estado local
      setRecommendations(recommendations.map(rec => ({ ...rec, seen: true })));
      setStats({ 
        ...stats, 
        unseen: 0, 
        seen: stats.total 
      });
      setSuccess('Todas las recomendaciones marcadas como vistas');
    } catch (err) {
      console.error('Error marcando todas como vistas:', err);
      setError('Error al marcar las recomendaciones');
    }
  };

  const formatScore = (score) => {
    return `${Math.round(score)}%`;
  };

  const formatMonto = (monto) => {
    if (!monto) return 'N/A';
    return `S/ ${parseFloat(monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell size={32} className="text-indigo-600" />
            Recomendaciones Personalizadas
          </h1>
          <p className="text-gray-600 mt-2">
            Procesos de contratación que coinciden con tu perfil profesional
          </p>
        </div>

        {/* Alertas */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <Info size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <Info size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 font-medium">Total</p>
                <p className="text-2xl font-bold text-indigo-900">{stats.total}</p>
              </div>
              <Bell size={32} className="text-indigo-400" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Nuevas</p>
                <p className="text-2xl font-bold text-green-900">{stats.unseen}</p>
              </div>
              <TrendingUp size={32} className="text-green-400" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Vistas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.seen}</p>
              </div>
              <CheckCircle size={32} className="text-gray-400" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Match Promedio</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatScore(stats.average_score)}
                </p>
              </div>
              <TrendingUp size={32} className="text-purple-400" />
            </div>
          </Card>
        </div>

        {/* Filtros y acciones */}
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filtros */}
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-500" />
              <div className="flex gap-2">
                <button
                  onClick={() => { setFilter('all'); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todas ({stats.total})
                </button>
                <button
                  onClick={() => { setFilter('unseen'); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'unseen'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Nuevas ({stats.unseen})
                </button>
                <button
                  onClick={() => { setFilter('seen'); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'seen'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Vistas ({stats.seen})
                </button>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2">
              {stats.unseen > 0 && (
                <button
                  onClick={markAllAsSeen}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  Marcar todas como vistas
                </button>
              )}
              <button
                onClick={() => generateRecommendations(false)}
                disabled={generating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Generando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    Generar Nuevas
                  </>
                )}
              </button>
            </div>
          </div>
        </Card>

        {/* Lista de Recomendaciones */}
        {loading ? (
          <Card>
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-indigo-600" size={48} />
            </div>
          </Card>
        ) : recommendations.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Bell size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No hay recomendaciones
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'unseen' 
                  ? 'No tienes recomendaciones nuevas en este momento'
                  : 'Genera tus primeras recomendaciones personalizadas'}
              </p>
              <button
                onClick={() => generateRecommendations(false)}
                disabled={generating}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition inline-flex items-center gap-2"
              >
                <RefreshCw size={20} />
                Generar Recomendaciones
              </button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <Card
                key={rec.id}
                className={`hover:shadow-lg transition ${
                  !rec.seen ? 'border-l-4 border-l-indigo-500 bg-indigo-50/30' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <Link
                          to={`/process/${rec.proceso.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition"
                          onClick={() => !rec.seen && markAsSeen(rec.id)}
                        >
                          {rec.proceso.descripcion_objeto}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">
                          {rec.proceso.nomenclatura}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {!rec.seen && (
                          <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full">
                            Nueva
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full font-semibold border ${getScoreColor(rec.score)}`}>
                          {formatScore(rec.score)} match
                        </span>
                      </div>
                    </div>

                    {/* Información del Proceso */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="text-gray-700">{rec.proceso.departamento}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign size={16} className="text-gray-400" />
                        <span className="text-gray-700 font-medium">
                          {formatMonto(rec.proceso.monto_referencial)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-gray-600">{formatDate(rec.created_at)}</span>
                      </div>
                      {rec.recommendation_type && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                            {rec.recommendation_type}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Score Breakdown */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-gray-600 mb-2">Desglose de coincidencia:</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Región:</span>
                          <span className="ml-1 font-semibold text-gray-900">
                            {formatScore(rec.match_region)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Tipo:</span>
                          <span className="ml-1 font-semibold text-gray-900">
                            {formatScore(rec.match_tipo_proyecto)}
                          </span>
                        </div>
                        <div>
                          {rec.match_monto > 0 ? (
                            <>
                              <span className="text-gray-600">Monto:</span>
                              <span className="ml-1 font-semibold text-gray-900">
                                {formatScore(rec.match_monto)}
                              </span>
                            </>
                          ) : rec.match_carrera > 0 ? (
                            <>
                              <span className="text-gray-600">Carrera:</span>
                              <span className="ml-1 font-semibold text-gray-900">
                                {formatScore(rec.match_carrera)}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-gray-600">-</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Estado del Proceso */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rec.proceso.estado_proceso === 'Publicado' || rec.proceso.estado_proceso === 'En Evaluación'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {rec.proceso.estado_proceso}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Link
                      to={`/process/${rec.proceso.id}`}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 text-sm"
                      onClick={() => !rec.seen && markAsSeen(rec.id)}
                    >
                      Ver Detalle
                      <ExternalLink size={16} />
                    </Link>
                    {!rec.seen && (
                      <button
                        onClick={() => markAsSeen(rec.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm"
                      >
                        <CheckCircle size={16} />
                        Marcar vista
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Paginación */}
        {!loading && totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
