import React, { useState } from 'react';
import { Users, Lock, Plus, Mail } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { AddUserModal } from './AddUserModal';

export const LoginOrSwitchUser: React.FC = () => {
  const { login, addUser, isLoggedIn, loading } = useUser();
  const [showAddUser, setShowAddUser] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError('لطفاً ایمیل و رمز عبور را وارد کنید');
      return;
    }

    try {
      const success = await login(email, password);
      if (!success) {
        setLoginError('ایمیل یا رمز عبور اشتباه است');
      }
    } catch (error) {
      setLoginError('خطا در ورود');
    }
  };

  const handleAddUser = async (name: string, email: string, password: string) => {
    try {
      await addUser(name, email, password);
      setShowAddUser(false);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <p className="mt-3 text-muted">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

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
                  <h3 className="fw-bold text-dark">ورود به سیستم</h3>
                  <p className="text-muted">برای ادامه، وارد حساب کاربری خود شوید</p>
                </div>

                {loginError && (
                  <div className="alert alert-danger" role="alert">
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">ایمیل</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        placeholder="ایمیل خود را وارد کنید"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">رمز عبور</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <Lock size={16} />
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        placeholder="رمز عبور خود را وارد کنید"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 mb-3"
                    disabled={!email || !password}
                  >
                    ورود
                  </button>
                </form>

                <div className="text-center">
                  <p className="text-muted mb-3">حساب کاربری ندارید؟</p>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => setShowAddUser(true)}
                  >
                    <Plus className="me-2" size={18} />
                    ایجاد حساب جدید
                  </button>
                </div>
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