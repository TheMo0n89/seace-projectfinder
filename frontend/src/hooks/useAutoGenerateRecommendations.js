/**
 * useAutoGenerateRecommendations - Hook para auto-generar recomendaciones
 * 
 * Este hook implementa el sistema UI-driven de generación automática:
 * - Verifica si han pasado suficientes días desde la última generación
 * - Respeta la frecuencia de notificación configurada por el usuario
 * - Se ejecuta automáticamente al login y al cargar páginas relevantes
 * - No requiere configuración de cron en el sistema operativo
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Locks globales para prevenir llamadas simultáneas
let isCheckingGlobal = false;
let lastCheckGlobal = null;

/**
 * Calcula si debe generar recomendaciones según la frecuencia
 * @param {string} frequency - Frecuencia de notificación (diaria, cada_3_dias, semanal, mensual)
 * @param {Date} lastGenerated - Fecha de última generación de recomendaciones
 * @returns {boolean}
 */
function shouldGenerateRecommendations(frequency, lastGenerated) {
  if (!lastGenerated) return true;

  const now = new Date();
  const lastGeneratedDate = new Date(lastGenerated);
  const daysSinceLastGeneration = Math.floor((now - lastGeneratedDate) / (1000 * 60 * 60 * 24));

  switch (frequency) {
    case 'diaria':
      return daysSinceLastGeneration >= 1;
    case 'cada_3_dias':
      return daysSinceLastGeneration >= 3;
    case 'semanal':
      return daysSinceLastGeneration >= 7;
    case 'mensual':
      return daysSinceLastGeneration >= 30;
    default:
      return false;
  }
}

/**
 * Hook para auto-generar recomendaciones basado en la frecuencia del usuario
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.enabled - Si está habilitado el auto-generate (default: true)
 * @param {Function} options.onSuccess - Callback cuando se generan recomendaciones exitosamente
 * @param {Function} options.onError - Callback cuando hay un error
 * @returns {Object} Estado y funciones del hook
 */
export const useAutoGenerateRecommendations = ({ 
  enabled = true, 
  onSuccess = null,
  onError = null 
} = {}) => {
  const { user, isAuthenticated } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const [shouldGenerate, setShouldGenerate] = useState(false);

  /**
   * Verifica si necesita generar recomendaciones
   */
  const checkAndGenerate = useCallback(async () => {
    // No hacer nada si no está habilitado, no autenticado o perfil incompleto
    if (!enabled || !isAuthenticated || !user?.profile_completed) {
      return;
    }

    // Lock global: prevenir múltiples llamadas simultáneas
    if (isCheckingGlobal) {
      console.log('[Auto-Generate] Ya hay una verificación en curso, omitiendo...');
      return;
    }

    // Debounce: no verificar si se verificó hace menos de 3 segundos
    const now = new Date();
    if (lastCheckGlobal && (now - lastCheckGlobal) < 3000) {
      console.log('[Auto-Generate] Verificación reciente (hace menos de 3s), omitiendo...');
      return;
    }

    try {
      isCheckingGlobal = true;
      lastCheckGlobal = now;
      setIsGenerating(true);

      // Obtener la frecuencia del usuario y sus recomendaciones actuales
      const [profileResponse, recommendationsResponse] = await Promise.all([
        axios.get(`${API_URL}/users/me/profile`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API_URL}/users/me/recommendations`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const frequency = profileResponse.data.data?.profile?.notification_frequency || 'semanal';
      const recommendations = recommendationsResponse.data.data?.recommendations || [];

      // Encontrar la última fecha de generación
      let lastGenerated = null;
      if (recommendations.length > 0) {
        // Ordenar por created_at descendente y tomar la primera
        const sorted = [...recommendations].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        lastGenerated = sorted[0].created_at;
      }

      // Verificar si debe generar
      const shouldGen = shouldGenerateRecommendations(frequency, lastGenerated);
      setShouldGenerate(shouldGen);

      if (shouldGen) {
        console.log(`[Auto-Generate] Generando recomendaciones automáticas (frecuencia: ${frequency}, última: ${lastGenerated})`);
        
        // Generar recomendaciones en background (sin forzar)
        const generateResponse = await axios.post(
          `${API_URL}/users/me/recommendations/generate`,
          { force_regenerate: false, limit: 20 },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );

        const count = generateResponse.data.data?.generated_count || generateResponse.data.data?.recommendations_generated || 0;
        console.log(`[Auto-Generate] ✓ ${count} recomendaciones generadas`);
        
        // Mostrar warnings si hay campos opcionales sin completar
        if (generateResponse.data.data?.warnings && generateResponse.data.data.warnings.length > 0) {
          console.warn('[Auto-Generate] Sugerencias para mejorar el perfil:', generateResponse.data.data.warnings);
        }
        
        if (onSuccess && count > 0) {
          onSuccess(generateResponse.data.data);
        }
      } else {
        console.log(`[Auto-Generate] No es necesario generar automáticamente (frecuencia: ${frequency}, última: ${lastGenerated})`);
      }

      setLastCheck(new Date());

    } catch (error) {
      console.error('[Auto-Generate] Error:', error);
      
      // Si el error es 404 (no hay perfil), no es un error crítico
      if (error.response?.status !== 404) {
        if (onError) {
          onError(error);
        }
      }
    } finally {
      setIsGenerating(false);
      isCheckingGlobal = false;
    }
  }, [enabled, isAuthenticated, user, onSuccess, onError]);

  /**
   * Forzar verificación y generación
   */
  const forceCheck = useCallback(() => {
    checkAndGenerate();
  }, [checkAndGenerate]);

  /**
   * Efecto para escuchar evento de login
   */
  useEffect(() => {
    const handleLogin = (event) => {
      console.log('[Auto-Generate] Login detectado, verificando recomendaciones...');
      // Pequeño delay para que el estado del usuario se actualice
      setTimeout(() => checkAndGenerate(), 500);
    };

    window.addEventListener('user-logged-in', handleLogin);
    return () => window.removeEventListener('user-logged-in', handleLogin);
  }, [checkAndGenerate]);

  /**
   * Efecto principal: verificar al montar el componente
   */
  useEffect(() => {
    if (enabled && isAuthenticated && user?.profile_completed) {
      // Verificar solo si no se ha verificado en los últimos 5 minutos
      const now = new Date();
      if (!lastCheck || (now - lastCheck) > 5 * 60 * 1000) {
        checkAndGenerate();
      }
    }
  }, [enabled, isAuthenticated, user?.profile_completed, checkAndGenerate, lastCheck]);

  return {
    isGenerating,
    shouldGenerate,
    lastCheck,
    checkAndGenerate: forceCheck
  };
};

export default useAutoGenerateRecommendations;
