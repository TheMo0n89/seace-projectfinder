import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

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
import { About } from './pages/About';
import { NotFound } from './pages/NotFound';
import Login from './pages/Login';
import LogsDashboard from './pages/LogsDashboard';
import { Register } from './pages/Register';

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
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
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
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
