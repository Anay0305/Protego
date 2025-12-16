import { Shield, LogOut } from 'lucide-react';

interface HeaderProps {
  userName?: string;
  onLogout: () => void;
}

export default function Header({ userName, onLogout }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">Protego</h1>
            <p className="text-xs text-gray-500 hidden sm:block">Welcome, {userName}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition active:scale-95"
        >
          <LogOut size={18} className="sm:w-5 sm:h-5" />
          <span className="hidden sm:inline text-sm">Logout</span>
        </button>
      </div>
    </header>
  );
}
