import React from 'react';
import logger from '../services/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      eventId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el state para mostrar la UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log del error
    const eventId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.componentError(
      this.props.componentName || 'Unknown Component',
      error,
      errorInfo
    );

    // Guardar detalles del error en el state
    this.setState({
      error,
      errorInfo,
      eventId
    });

    // Log adicional para el contexto
    logger.error('React Error Boundary triggered', {
      event_type: 'error_boundary',
      component_name: this.props.componentName,
      error_message: error.message,
      error_stack: error.stack,
      component_stack: errorInfo.componentStack,
      event_id: eventId,
      props: this.props.errorContext || {}
    });
  }

  handleRetry = () => {
    logger.userAction('error_boundary_retry', {
      event_id: this.state.eventId,
      component: this.props.componentName
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    });
  };

  handleReload = () => {
    logger.userAction('error_boundary_reload', {
      event_id: this.state.eventId,
      component: this.props.componentName
    });

    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // UI personalizada de error
      return (
        <div className="error-boundary-container p-6 border border-red-300 rounded-lg bg-red-50">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <svg 
                className="h-6 w-6 text-red-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.866-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-800 mb-2">
                ⚠️ Oops! Algo salió mal
              </h3>
              
              <p className="text-red-700 mb-4">
                {this.props.fallbackMessage || 
                  'Ha ocurrido un error inesperado en este componente. Nuestro equipo ha sido notificado automáticamente.'
                }
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-4">
                  <summary className="text-sm font-medium text-red-800 cursor-pointer hover:text-red-900">
                    🐛 Detalles del Error (Desarrollo)
                  </summary>
                  <div className="mt-2 p-3 bg-red-100 rounded border text-xs">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Event ID:</strong> <code>{this.state.eventId}</code>
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  🔄 Intentar de nuevo
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  ↻ Recargar página
                </button>

                {this.props.onError && (
                  <button
                    onClick={() => this.props.onError(this.state.error, this.state.errorInfo)}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    📞 Reportar problema
                  </button>
                )}
              </div>

              {this.state.eventId && (
                <p className="text-xs text-red-600 mt-3">
                  ID del evento: <code>{this.state.eventId}</code> 
                  (incluye este ID si contactas con soporte)
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;