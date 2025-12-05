import { Link, useLocation } from 'react-router-dom';
import { Shield, Home, Bell, Settings, BarChart3 } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

function Navbar() {
  const location = useLocation();
  const { user, isWalking } = useUserStore();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/alerts', label: 'Alerts', icon: Bell },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Protego</span>
          </Link>

          {/* Status Indicator */}
          {isWalking && (
            <div className="hidden md:flex items-center gap-2 bg-success-100 text-success-700 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-sm">Walk Mode Active</span>
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden md:inline font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Info */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="font-medium text-primary-700">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span>{user?.name}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
