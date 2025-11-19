import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Chatbot } from './components/chatbot/Chatbot';

// Componentes de autenticación
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

// Componentes de logging (TEMPORALMENTE SIMPLIFICADOS)
import ErrorBoundary from './components/ErrorBoundary';
import logger from './services/logger';

// Páginas principales
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProcessDetail } from './pages/ProcessDetail';
import { Dashboard } from './pages/Dashboard';
import { Admin } from './pages/Admin';
import ETLAdmin from './pages/ETLAdmin';
import Analytics from './pages/Analytics';
import { About } from './pages/About';
import { NotFound } from './pages/NotFound';
import Login from './pages/Login';
import LogsDashboard from './pages/LogsDashboard';
import { Register } from './pages/Register';
import NotificationsPage from './pages/NotificationsPage';

// Componente para tracking de navegación
function NavigationTracker() {
  const location = useLocation();
  
  useEffect(() => {
    logger.navigation(document.referrer || 'direct', location.pathname);
  }, [location]);
  
  return null;
}

// Componente de rutas de la aplicación con autenticación
function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} 
      />
      <Route path="/about" element={<About />} />
      
      {/* Rutas protegidas - requieren autenticación */}
      <Route path="/" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      
      <Route path="/catalog" element={
        <ProtectedRoute>
          <Catalog />
        </ProtectedRoute>
      } />
      
      <Route path="/process/:id" element={
        <ProtectedRoute>
          <ProcessDetail />
        </ProtectedRoute>
      } />
      
      {/* <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } /> */}
      
      <Route path="/notifications" element={
        <ProtectedRoute>
          <NotificationsPage />
        </ProtectedRoute>
      } />
      
      {/* Rutas de administración - requieren permisos de admin */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin={true}>
          <Admin />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/etl" element={
        <ProtectedRoute requireAdmin={true}>
          <ETLAdmin />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/analytics" element={
        <ProtectedRoute requireAdmin={true}>
          <Analytics />
        </ProtectedRoute>
      } />
      
      <Route path="/logs" element={
        <ProtectedRoute requireAdmin={true}>
          <LogsDashboard />
        </ProtectedRoute>
      } />
      
      {/* Ruta de fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  useEffect(() => {
    // Log de inicio de la aplicación
    logger.info('Application started', {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
    
    // Log de performance inicial
    if (window.performance && window.performance.timing) {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      
      logger.info('Page load performance', {
        event_type: 'performance',
        page_load_time: pageLoadTime,
        dom_ready_time: perfData.domContentLoadedEventEnd - perfData.navigationStart,
        first_paint: perfData.responseStart - perfData.navigationStart
      });
    }
  }, []);

  return (
    <ErrorBoundary componentName="App" fallbackMessage="La aplicación ha encontrado un error crítico">
      <Router>
        <NavigationTracker />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
          <ErrorBoundary componentName="Navbar">
            <Navbar />
          </ErrorBoundary>
          
          <main className="flex-grow">
            <ErrorBoundary componentName="MainContent">
              <AppRoutes />
            </ErrorBoundary>
          </main>
          
          <ErrorBoundary componentName="Footer">
            <Footer />
          </ErrorBoundary>

          {/* Chatbot Flotante Global */}
          <div className="fixed bottom-8 right-8 z-50">
            {!isChatbotOpen ? (
              <button
                onClick={() => setIsChatbotOpen(true)}
                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110"
                title="Abrir Asistente IA"
              >
                <ChatBubbleLeftRightIcon className="w-6 h-6" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  Pregúntame sobre procesos SEACE
                  <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </button>
            ) : (
              <div className="animate-slide-up">
                <Chatbot onClose={() => setIsChatbotOpen(false)} />
              </div>
            )}
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
