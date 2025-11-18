import { useState, useEffect, createContext, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configurar token en el cliente API al inicializar
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verificar si el token es válido
      getCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const getCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      // La respuesta del backend puede ser: { success: true, data: user } o directamente user
      const userData = response.data.data || response.data;
      setUser(userData);
    } catch (error) {
      console.error('Token inválido:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password
      });

      // La respuesta del backend es: { success: true, data: { access_token, user } }
      const { access_token, user: userData } = response.data.data || response.data;
      
      // Guardar token
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      
      // Configurar header de autorización
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Disparar evento personalizado para que otros componentes sepan del login exitoso
      // Esto permite que useAutoGenerateRecommendations se ejecute automáticamente
      window.dispatchEvent(new CustomEvent('user-logged-in', { detail: userData }));
      
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.detail || 'Error al iniciar sesión';
      throw new Error(message);
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      // Después del registro exitoso, hacer login automático
      if (response.data.username) {
        return await login(userData.username, userData.password);
      }
      
      return { success: true, user: response.data };
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al registrarse';
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.put('/auth/change-password', null, {
        params: {
          current_password: currentPassword,
          new_password: newPassword
        }
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al cambiar contraseña';
      return { success: false, error: message };
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    
    if (user.role === 'admin') return true;
    
    // Permisos para invitados
    const guestPermissions = [
      'view_processes',
      'use_chatbot',
      'view_dashboard',
      'view_recommendations'
    ];
    
    return user.role === 'guest' && guestPermissions.includes(permission);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    changePassword,
    isAdmin,
    hasPermission,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};