import React, { useState } from 'react';
import { Users, Lock, Plus, User } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { AddUserModal } from './AddUserModal';

export const LoginOrSwitchUser: React.FC = () => {
  const { users, login, addUser, isLoggedIn } = useUser();
  const [showAddUser, setShowAddUser] = useState(false);
  const [passwords, setPasswords] = useState<{ [key: string]: string }>({});
  const [loginError, setLoginError] = useState<string | null>(null);

  const handlePasswordChange = (userId: string, password: string) => {
    setPasswords(prev => ({ ...prev, [userId]: password }));
    setLoginError(null);
  };

  const handleLogin = async (userId: string) => {
    const password = passwords[userId];
    if (!password) {
      setLoginError('لطفاً رمز عبور را وارد کنید');
      return;
    }

    try {
      const success = await login(userId, password);
      if (!success) {
        setLoginError('رمز عبور اشتباه است');
      }
    } catch (error) {
      setLoginError('خطا در ورود');
    }
  };

  const handleAddUser = async (name: string, password: string) => {
    try {
      await addUser(name, password);
      setShowAddUser(false);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  if (isLoggedIn) {
    return null; // Don't show login screen if already logged in
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                    <Users className="text-white" size={28} />
                  </div>
                  <h3 className="fw-bold text-dark">انتخاب کاربر</h3>
                  <p className="text-muted">برای ادامه، کاربر خود را انتخاب کنید</p>
                </div>

                {loginError && (
                  <div className="alert alert-danger" role="alert">
                    {loginError}
                  </div>
                )}

                {users.length === 0 ? (
                  <div className="text-center py-4">
                    <User className="text-muted mb-3" size={48} />
                    <h5 className="text-muted">هیچ کاربری وجود ندارد</h5>
                    <p className="text-muted">برای شروع، کاربر جدید ایجاد کنید</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowAddUser(true)}
                    >
                      <Plus className="me-2" size={18} />
                      ایجاد کاربر جدید
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div key={user.id} className="border rounded p-3 mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                            <User size={20} className="text-primary" />
                          </div>
                          <div>
                            <h6 className="mb-0 fw-bold">{user.name}</h6>
                            <small className="text-muted">کاربر</small>
                          </div>
                        </div>
                        
                        <div className="input-group">
                          <span className="input-group-text">
                            <Lock size={16} />
                          </span>
                          <input
                            type="password"
                            className="form-control"
                            placeholder="رمز عبور"
                            value={passwords[user.id] || ''}
                            onChange={(e) => handlePasswordChange(user.id, e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleLogin(user.id)}
                          />
                          <button
                            className="btn btn-primary"
                            onClick={() => handleLogin(user.id)}
                            disabled={!passwords[user.id]}
                          >
                            ورود
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="text-center mt-4">
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => setShowAddUser(true)}
                      >
                        <Plus className="me-2" size={18} />
                        افزودن کاربر جدید
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddUserModal 
        show={showAddUser}
        onClose={() => setShowAddUser(false)}
        onAdd={handleAddUser}
      />
    </div>
  );
};
