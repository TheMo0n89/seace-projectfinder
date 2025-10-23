import React from 'react';
import { Link } from 'react-router-dom';
import { 
  RocketLaunchIcon, 
  ShieldCheckIcon, 
  ChartBarIcon,
  ArrowRightIcon,
  UserPlusIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export const Welcome = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header/Navbar para página de bienvenida */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <RocketLaunchIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  SEACE ProjectFinder
                </h1>
                <p className="text-sm text-gray-600">Transformando procesos públicos en oportunidades</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>Iniciar Sesión</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center space-x-2 border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
              >
                <UserPlusIcon className="h-5 w-5" />
                <span>Registrarse</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
              Descubre Oportunidades en
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Contratación Pública
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              SEACE ProjectFinder utiliza inteligencia artificial para analizar procesos de contratación pública 
              y identificar las mejores oportunidades de desarrollo de software para tu empresa.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <UserPlusIcon className="h-6 w-6 mr-2" />
                Comenzar Gratis
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white border-2 border-blue-600 rounded-xl hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6 mr-2" />
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir SEACE ProjectFinder?
            </h2>
            <p className="text-xl text-gray-600">
              Herramientas avanzadas para maximizar tus oportunidades de negocio
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <RocketLaunchIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Análisis Inteligente
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Nuestro sistema analiza automáticamente miles de procesos de contratación 
                utilizando IA para identificar oportunidades relevantes para tu negocio.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              <div className="bg-green-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheckIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Información Confiable
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Datos actualizados en tiempo real directamente desde SEACE, 
                garantizando información precisa y oportuna para tomar decisiones.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              <div className="bg-purple-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Dashboard Avanzado
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Visualiza tendencias, analiza oportunidades y obtén insights 
                valiosos con nuestro dashboard interactivo y fácil de usar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            ¿Listo para descubrir nuevas oportunidades?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Únete a cientos de empresas que ya utilizan SEACE ProjectFinder 
            para crecer su negocio en el sector público.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <UserPlusIcon className="h-6 w-6 mr-2" />
            Crear Cuenta Gratis
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <RocketLaunchIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">SEACE ProjectFinder</span>
            </div>
            <p className="text-gray-400">
              © 2025 SEACE ProjectFinder. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};