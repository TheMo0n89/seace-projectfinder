import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  ChatBubbleLeftRightIcon, 
  ChartBarIcon,
  DocumentTextIcon,
  SparklesIcon,
  ArrowRightIcon,
  BellIcon,
  TrendingUpIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useAutoGenerateRecommendations } from '../hooks/useAutoGenerateRecommendations';
import ToastContainer from '../components/ui/ToastContainer';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toasts, removeToast, success, error: showError } = useToast();
  
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Auto-generación de recomendaciones al cargar Home (Sistema UI-Driven)
  // Usar directamente user?.profile_completed para evitar race conditions
  const { isGenerating } = useAutoGenerateRecommendations({
    enabled: isAuthenticated && user?.profile_completed,
    onSuccess: (data) => {
      if (data.generated_count > 0) {
        console.log(`[Home] Auto-generadas ${data.generated_count} nuevas recomendaciones`);
        // Recargar recomendaciones después de auto-generar
        loadRecommendations();
      }
    },
    onError: (error) => {
      console.error('[Home] Error en auto-generación:', error);
    }
  });

  useEffect(() => {
    if (isAuthenticated && user?.profile_completed) {
      loadRecommendations();
    }
  }, [isAuthenticated, user?.profile_completed]);

  const loadRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/users/me/recommendations?limit=6&only_unseen=false`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRecommendations(response.data.data.items || []);
    } catch (err) {
      console.error('Error cargando recomendaciones:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const trackRecommendationClick = async (recommendationId, procesoId) => {
    try {
      const token = localStorage.getItem('token');
      
      // Marcar como vista
      await axios.post(
        `${API_URL}/users/me/recommendations/seen`,
        { recommendation_ids: [recommendationId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Registrar click en analytics (opcional: agregar endpoint en backend)
      try {
        await axios.post(
          `${API_URL}/analytics/recommendation-click`,
          {
            recommendation_id: recommendationId,
            proceso_id: procesoId,
            timestamp: new Date().toISOString()
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (analyticsError) {
        // No bloquear navegación si analytics falla
        console.warn('Analytics tracking failed:', analyticsError);
      }

      // Navegar al proceso
      navigate(`/process/${procesoId}`);
    } catch (err) {
      console.error('Error tracking click:', err);
      showError('Error al procesar la recomendación');
    }
  };

  const formatScore = (score) => `${Math.round(score)}%`;
  
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

  return (
    <div className="min-h-full">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
              <span className="text-seace-blue">SEACE</span> ProjectFinder
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 animate-fade-in">
              Plataforma inteligente para el análisis, búsqueda y recomendaciones de 
              procesos de contratación del Sistema Electrónico de Contrataciones del Estado
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Button asChild size="lg">
                <Link to="/catalog" className="flex items-center">
                  <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                  Explorar Catálogo
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/catalog?chatbot=open" className="flex items-center">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                  Consultar IA
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Recomendaciones Personalizadas */}
      {isAuthenticated && user?.profile_completed && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <BellIcon className="w-8 h-8 text-indigo-600" />
                Recomendaciones Para Ti
              </h2>
              <p className="text-lg text-gray-600">
                Procesos seleccionados según tu perfil profesional
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/notifications">
                Ver Todas
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          {loadingRecommendations ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </Card>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec, index) => (
                <Card
                  key={rec.id}
                  hover
                  className={`cursor-pointer transition-all duration-300 hover:shadow-xl animate-scale-in ${
                    !rec.seen ? 'border-l-4 border-l-indigo-500' : ''
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => trackRecommendationClick(rec.id, rec.proceso.id)}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getScoreColor(rec.score)}`}>
                      {formatScore(rec.score)} match
                    </span>
                    {!rec.seen && (
                      <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full animate-pulse-soft">
                        Nuevo
                      </span>
                    )}
                  </div>

                  {/* Título */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-indigo-600 transition">
                    {rec.proceso.descripcion_objeto}
                  </h3>

                  {/* Número de Proceso */}
                  <p className="text-sm text-gray-600 mb-3">{rec.proceso.nomenclatura}</p>

                  {/* Información */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPinIcon className="w-4 h-4 text-gray-400" />
                      <span>{rec.proceso.departamento}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{formatMonto(rec.proceso.monto_referencial)}</span>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Región: {formatScore(rec.match_region)}</span>
                      <span>Tipo: {formatScore(rec.match_tipo_proyecto)}</span>
                      {rec.match_monto > 0 ? (
                        <span>Monto: {formatScore(rec.match_monto)}</span>
                      ) : rec.match_carrera > 0 ? (
                        <span>Carrera: {formatScore(rec.match_carrera)}</span>
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Aún no tienes recomendaciones
              </h3>
              <p className="text-gray-600 mb-6">
                Las recomendaciones se generan automáticamente según tu perfil
              </p>
              <Button asChild>
                <Link to="/notifications">
                  Ver Notificaciones
                </Link>
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Mensaje si perfil incompleto */}
      {isAuthenticated && !user?.profile_completed && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  <SparklesIcon className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  ¡Completa tu perfil para recibir recomendaciones!
                </h3>
                <p className="text-gray-700 mb-4">
                  Configura tus preferencias profesionales y recibe procesos de contratación 
                  personalizados según tu expertise, ubicación y áreas de interés.
                </p>
                <Button size="lg" onClick={() => {
                  // El ProfileModal se abre desde el Navbar al hacer click en el icono de usuario
                  success('Haz click en tu icono de perfil en la esquina superior derecha');
                }}>
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Configurar Ahora
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Características Principales
          </h2>
          <p className="text-lg text-gray-600">
            Herramientas avanzadas para el análisis de procesos de contratación pública
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Catálogo de Procesos */}
          <Card hover className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-seace-blue bg-opacity-10 rounded-full">
                <DocumentTextIcon className="w-8 h-8 text-seace-blue" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Catálogo de Procesos
            </h3>
            <p className="text-gray-600 mb-4">
              Explora y filtra miles de procesos de contratación del SEACE con 
              herramientas de búsqueda avanzadas.
            </p>
            <Button variant="ghost" asChild>
              <Link to="/catalog" className="flex items-center justify-center">
                Ver Catálogo
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </Card>

          {/* Asistente IA */}
          <Card hover className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-500 bg-opacity-10 rounded-full">
                <SparklesIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Asistente con IA
            </h3>
            <p className="text-gray-600 mb-4">
              Realiza consultas en lenguaje natural y obtén recomendaciones 
              inteligentes sobre procesos TI.
            </p>
            <Button variant="ghost" asChild>
              <Link to="/catalog?chatbot=open" className="flex items-center justify-center">
                Probar Asistente
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </Card>

          {/* Dashboard Analítico */}
          <Card hover className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-purple-500 bg-opacity-10 rounded-full">
                <ChartBarIcon className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Dashboard Analítico
            </h3>
            <p className="text-gray-600 mb-4">
              Visualiza estadísticas y tendencias de los procesos de contratación 
              con dashboards interactivos.
            </p>
            <Button variant="ghost" asChild>
              <Link to="/dashboard" className="flex items-center justify-center">
                Ver Dashboard
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </Card>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Datos del Sistema
            </h2>
            <p className="text-lg text-gray-600">
              Información actualizada sobre los procesos en la plataforma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-seace-blue mb-2">15,000+</div>
              <div className="text-gray-600">Procesos Analizados</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-seace-blue mb-2">2,500+</div>
              <div className="text-gray-600">Procesos TI</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-seace-blue mb-2">500+</div>
              <div className="text-gray-600">Entidades Públicas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-seace-blue mb-2">24/7</div>
              <div className="text-gray-600">Disponibilidad</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-seace-blue">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              ¿Listo para comenzar?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Explora los procesos de contratación pública con herramientas 
              de análisis avanzadas y recomendaciones de IA.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" asChild>
                <Link to="/catalog">
                  Comenzar Exploración
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="border-white text-white hover:bg-white hover:text-seace-blue">
                <Link to="/about">
                  Conocer Más
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
