import React, { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

export const UserSelector: React.FC = () => {
  const { currentUser, logout, users, switchUser } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!currentUser) return null;

  return (
    <div className="position-relative">
      <button
        className="btn btn-outline-primary d-flex align-items-center"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <User size={18} className="me-2" />
        {currentUser.name}
      </button>

      {showDropdown && (
        <div className="dropdown-menu show position-absolute end-0 mt-2" style={{ minWidth: '200px' }}>
          <div className="px-3 py-2 border-bottom">
            <div className="fw-bold">{currentUser.name}</div>
            <small className="text-muted">کاربر فعال</small>
          </div>
          
          {users.length > 1 && (
            <div className="px-3 py-2 border-bottom">
              <div className="fw-medium mb-2">تغییر کاربر:</div>
              {users
                .filter(user => user.id !== currentUser.id)
                .map(user => (
                  <button
                    key={user.id}
                    className="btn btn-sm btn-outline-secondary w-100 mb-1"
                    onClick={() => {
                      switchUser(user.id);
                      setShowDropdown(false);
                    }}
                  >
                    {user.name}
                  </button>
                ))}
            </div>
          )}
          
          <div className="px-3 py-2">
            <button
              className="btn btn-sm btn-outline-danger w-100"
              onClick={() => {
                logout();
                setShowDropdown(false);
              }}
            >
              <LogOut size={16} className="me-2" />
              خروج
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 1 }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};
