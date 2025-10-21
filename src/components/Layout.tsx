import React, { useState } from 'react';
import { 
  Home, 
  CheckSquare, 
  BookOpen, 
  Brain, 
  BarChart3, 
  Menu, 
  X,
  Clock,
  Trophy,
  Users
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  userSelector?: React.ReactNode;
}

const navigation = [
  { id: 'dashboard', label: 'داشبورد', icon: Home },
  { id: 'tasks', label: 'کارها', icon: CheckSquare },
  { id: 'courses', label: 'دروس', icon: BookOpen },
  { id: 'reflection', label: 'بازتاب', icon: Brain },
  { id: 'stats', label: 'آمار', icon: BarChart3 },
  { id: 'gamification', label: 'رقابت', icon: Trophy },
  { id: 'users', label: 'کاربران', icon: Users },
];

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange, userSelector }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-vh-100 bg-light">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none" 
          style={{ zIndex: 1040 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Mobile sidebar */}
      <div 
        className={`position-fixed top-0 start-0 h-100 bg-white shadow-lg d-lg-none ${
          sidebarOpen ? 'show' : ''
        }`}
        style={{ 
          width: '280px', 
          zIndex: 1050, 
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', 
          transition: 'transform 0.3s ease' 
        }}
      >
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          <div className="d-flex align-items-center">
            <Clock className="text-success me-2" size={24} />
            <h5 className="mb-0 fw-bold">مجله بهره‌وری</h5>
          </div>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="p-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-100 btn text-start mb-2 d-flex align-items-center ${
                  currentPage === item.id
                    ? 'btn-success text-white'
                    : 'btn-outline-secondary'
                }`}
              >
                <Icon size={20} className="me-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="d-none d-lg-block position-fixed top-0 start-0 h-100 bg-white shadow" style={{ width: '280px', zIndex: 1000 }}>
        <div className="d-flex align-items-center p-3 border-bottom">
          <Clock className="text-success me-2" size={24} />
          <h5 className="mb-0 fw-bold">مجله بهره‌وری</h5>
        </div>
        
        <nav className="p-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-100 btn text-start mb-2 d-flex align-items-center ${
                  currentPage === item.id
                    ? 'btn-success text-white'
                    : 'btn-outline-secondary'
                }`}
              >
                <Icon size={20} className="me-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="ms-lg-5" style={{ marginLeft: '280px' }}>
        {/* Mobile header */}
        <div className="d-lg-none d-flex align-items-center justify-content-between p-3 bg-white shadow-sm">
          <button
            className="btn btn-outline-secondary"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <h5 className="mb-0 fw-bold">مجله بهره‌وری</h5>
          {userSelector && (
            <div className="d-flex align-items-center">
              {userSelector}
            </div>
          )}
        </div>

        {/* Desktop header */}
        <div className="d-none d-lg-block bg-white shadow-sm border-bottom p-3">
          <div className="d-flex align-items-center justify-content-between">
            <h4 className="mb-0 fw-bold text-dark">
              {navigation.find(item => item.id === currentPage)?.label || 'داشبورد'}
            </h4>
            {userSelector && (
              <div className="d-flex align-items-center">
                {userSelector}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
};