/**
 * NotificationBell - Campana de notificaciones con badge y dropdown
 * 
 * Características:
 * - Muestra badge con número de recomendaciones no vistas
 * - Dropdown con las últimas 5 recomendaciones
 * - Enlace a página completa de notificaciones
 * - Marca como vistas al hacer click
 * - Auto-refresh cada 60 segundos
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, ExternalLink, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Cargar estadísticas al montar y cada 60 segundos
  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cargar recomendaciones al abrir el dropdown
  useEffect(() => {
    if (isOpen) {
      loadRecommendations();
    }
  }, [isOpen]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/users/me/recommendations/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUnseenCount(response.data.data.unseen);
    } catch (err) {
      console.error('Error cargando estadísticas de notificaciones:', err);
    }
  };

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/users/me/recommendations?only_unseen=true&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRecommendations(response.data.data.items || []);
    } catch (err) {
      console.error('Error cargando recomendaciones:', err);
    } finally {
      setLoading(false);
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
      setRecommendations(recommendations.filter(r => r.id !== recommendationId));
      setUnseenCount(Math.max(0, unseenCount - 1));
    } catch (err) {
      console.error('Error marcando recomendación como vista:', err);
    }
  };

  const markAllAsSeen = async () => {
    try {
      const token = localStorage.getItem('token');
      const ids = recommendations.map(r => r.id);
      
      if (ids.length === 0) return;

      await axios.post(
        `${API_URL}/users/me/recommendations/seen`,
        { recommendation_ids: ids },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Actualizar estado local
      setRecommendations([]);
      setUnseenCount(Math.max(0, unseenCount - ids.length));
    } catch (err) {
      console.error('Error marcando todas como vistas:', err);
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
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
        aria-label="Notificaciones"
      >
        <Bell size={24} />
        {unseenCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unseenCount > 9 ? '9+' : unseenCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              Recomendaciones
              {unseenCount > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({unseenCount} nuevas)
                </span>
              )}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-gray-500">
                Cargando recomendaciones...
              </div>
            ) : recommendations.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-2 text-gray-300" />
                <p className="font-medium">No hay recomendaciones nuevas</p>
                <p className="text-sm mt-1">Te notificaremos cuando haya nuevos procesos para ti</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-100">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="px-4 py-3 hover:bg-gray-50 transition group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <Link
                            to={`/procesos/${rec.proceso.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-indigo-600 line-clamp-2"
                            onClick={() => markAsSeen(rec.id)}
                          >
                            {rec.proceso.descripcion_objeto}
                          </Link>
                        </div>
                        <button
                          onClick={() => markAsSeen(rec.id)}
                          className="ml-2 text-gray-400 hover:text-green-600 transition opacity-0 group-hover:opacity-100"
                          title="Marcar como vista"
                        >
                          <CheckCircle size={18} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <span className="truncate">{rec.proceso.nomenclatura}</span>
                        <span className={`px-2 py-0.5 rounded-full font-medium ${getScoreColor(rec.score)}`}>
                          {formatScore(rec.score)} match
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{rec.proceso.departamento}</span>
                        <span className="text-gray-700 font-medium">
                          {formatMonto(rec.proceso.monto_referencial)}
                        </span>
                      </div>

                      {rec.recommendation_type && (
                        <div className="mt-2">
                          <span className="inline-block text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                            {rec.recommendation_type}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between">
                  <button
                    onClick={markAllAsSeen}
                    className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition"
                  >
                    Marcar todas como vistas
                  </button>
                  <Link
                    to="/notifications"
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    onClick={() => setIsOpen(false)}
                  >
                    Ver todas
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
