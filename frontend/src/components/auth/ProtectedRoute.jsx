import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { LoadingSpinner } from '../ui/Loading';
import { Alert } from '../ui/Alert';

export const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  requireAdmin = false, 
  requirePermission = null 
}) => {
  const { isAuthenticated, isAdmin, hasPermission, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Si requiere autenticación y no está autenticado
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si requiere admin y no es admin
  if (requireAdmin && !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert type="error">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Acceso Denegado</h3>
            <p className="text-gray-600">
              Se requieren privilegios de administrador para acceder a esta página.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Usuario actual: <span className="font-medium">{user?.username}</span> ({user?.role})
            </p>
          </div>
        </Alert>
      </div>
    );
  }

  // Si requiere un permiso específico y no lo tiene
  if (requirePermission && !hasPermission(requirePermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert type="error">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Permisos Insuficientes</h3>
            <p className="text-gray-600">
              No tienes permisos para acceder a esta funcionalidad.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Permiso requerido: <code className="bg-gray-100 px-1 rounded">{requirePermission}</code>
            </p>
          </div>
        </Alert>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;