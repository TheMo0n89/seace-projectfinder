/**
 * ToastContainer - Contenedor para manejar múltiples toasts
 */

import React from 'react';
import Toast from './Toast';

const ToastContainer = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={onClose}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
