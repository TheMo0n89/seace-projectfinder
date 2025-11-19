/**
 * Servicio de API para Analytics
 */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const analyticsAPI = {
  /**
   * Obtener estadísticas del dashboard principal (Admin)
   */
  getDashboardStats: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/analytics/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },

  /**
   * Obtener estadísticas del usuario autenticado
   */
  getMyStats: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/analytics/users/me/stats`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },

  /**
   * Obtener estadísticas de un usuario específico
   */
  getUserStats: async (userId) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/analytics/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },

  /**
   * Registrar click en recomendación
   */
  trackClick: async (recommendationId, procesoId, sessionId = null) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/analytics/track/click`,
      {
        recommendation_id: recommendationId,
        proceso_id: procesoId,
        session_id: sessionId
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data.data;
  }
};

export default analyticsAPI;
