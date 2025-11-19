import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  ChartBarIcon,
  ChartPieIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  InformationCircleIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import NotificationBell from '../notifications/NotificationBell';
import ProfileModal from '../profile/ProfileModal';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, isAdmin } = useAuth();

  const publicNavigation = [
    { name: 'Acerca de', href: '/about', icon: InformationCircleIcon }
  ];

  const privateNavigation = [
    { name: 'Inicio', href: '/', icon: HomeIcon },
    { name: 'Catálogo', href: '/catalog', icon: MagnifyingGlassIcon },
    { name: 'Recomendaciones', href: '/notifications', icon: BellIcon }
  ];

  const adminNavigation = [
    { name: 'Admin', href: '/admin', icon: CogIcon },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartPieIcon }
  ];

  const navigation = isAuthenticated 
    ? [...privateNavigation, ...(isAdmin() ? adminNavigation : [])]
    : publicNavigation;

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/seace-icon.svg" 
                alt="SEACE ProjectFinder" 
                className="h-8 w-8"
              />
              <span className="text-xl font-bold text-seace-blue">
                SEACE ProjectFinder
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'bg-seace-blue text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-seace-blue'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Authentication Buttons */}
            <div className="flex items-center space-x-2 ml-4 border-l border-gray-200 pl-4">
              {isAuthenticated ? (
                <>
                  {/* Notification Bell */}
                  <NotificationBell />

                  {/* User Profile Button */}
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="Perfil"
                  >
                    <UserIcon className="w-6 h-6" />
                  </button>

                  {/* Username Display */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600 px-2">
                    <span>{user?.username}</span>
                    {user?.role && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {user.role}
                      </span>
                    )}
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>Salir</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-4 py-2 rounded-md text-sm font-medium text-white bg-seace-blue hover:bg-seace-blue-dark transition-colors duration-200"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-seace-blue"
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-2 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'bg-seace-blue text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-seace-blue'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Mobile Authentication */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="w-4 h-4" />
                      <span>{user?.username}</span>
                      {user?.role && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {user.role}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-white bg-seace-blue hover:bg-seace-blue-dark"
                >
                  <UserIcon className="w-5 h-5" />
                  <span>Iniciar Sesión</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isAuthenticated && (
        <ProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onProfileUpdated={() => {
            // Opcional: Recargar datos del usuario si es necesario
            console.log('Perfil actualizado');
          }}
        />
      )}
    </nav>
  );
};
