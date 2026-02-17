import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar as CalendarIcon, Library as LibraryIcon, LogOut } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const Navigation = ({ currentPage = 'dashboard' }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const navItems = [
    { id: 'dashboard', label: "Let's Read", icon: BookOpen, path: '/dashboard' },
    { id: 'library', label: 'Library', icon: LibraryIcon, path: '/library' },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon, path: '/calendar' },
  ];

  return (
    <>
      {/* Desktop Navigation - Hidden on Mobile */}
      <nav className="hidden md:block border-b border-[#E8E3D9] bg-white">
        <div className="max-w-[1200px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-[#2C2A27]" style={{ fontFamily: 'Playfair Display, serif' }}>
                Immersive
              </h1>
              <div className="flex space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      data-testid={`nav-${item.id}-btn`}
                      onClick={() => navigate(item.path)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-[#F8F6F1] text-[#A68A64] border-b-2 border-[#A68A64]'
                          : 'text-[#6A645C] active:bg-[#F8F6F1] active:text-[#2C2A27]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              data-testid="logout-btn"
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-[#6A645C] active:text-[#2C2A27] rounded-md active:bg-[#F8F6F1] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <div className="md:hidden border-b border-[#E8E3D9] bg-white px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#2C2A27]" style={{ fontFamily: 'Playfair Display, serif' }}>
          Immersive
        </h1>
        <button
          data-testid="logout-btn-mobile"
          onClick={handleLogout}
          className="p-2 text-[#6A645C] active:text-[#2C2A27] rounded-md active:bg-[#F8F6F1]"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E3D9] z-50">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                data-testid={`nav-${item.id}-btn-mobile`}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors min-w-[72px] ${
                  isActive
                    ? 'text-[#A68A64]'
                    : 'text-[#6A645C] active:bg-[#F8F6F1]'
                }`}
              >
                <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-[#A68A64]' : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navigation;
