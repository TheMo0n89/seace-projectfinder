/**
 * Toast - Sistema de notificaciones toast con animaciones
 * Soporte para múltiples tipos: success, error, info, warning
 */

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const Toast = ({ id, type = 'info', message, duration = 3000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: <CheckCircle className="text-green-500" size={20} />
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: <XCircle className="text-red-500" size={20} />
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: <AlertTriangle className="text-yellow-500" size={20} />
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: <Info className="text-blue-500" size={20} />
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className={`${styles.bg} ${styles.text} border rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-80 max-w-md animate-slide-in-right`}
    >
      {styles.icon}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="text-gray-400 hover:text-gray-600 transition"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;
