import React, { useState } from 'react';
import { Users, UserPlus } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

interface UserManagerProps {
  onUserAdded?: () => void;
}

export const UserManager: React.FC<UserManagerProps> = ({ onUserAdded }) => {
  const { addUser } = useUser();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) return;

    setLoading(true);
    try {
      await addUser(newUserName, newUserEmail, newUserPassword);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setShowAddForm(false);
      onUserAdded?.();
    } catch (error) {
      console.error('Error adding user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-light">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <Users className="text-primary me-2" size={24} />
            <h6 className="mb-0">مدیریت کاربران</h6>
          </div>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <UserPlus size={16} className="me-1" />
            {showAddForm ? 'لغو' : 'افزودن کاربر'}
          </button>
        </div>
      </div>
      
      <div className="card-body">
        {showAddForm && (
          <form onSubmit={handleAddUser} className="mb-4">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">نام کاربر</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="نام کاربر جدید"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">ایمیل</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">رمز عبور</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="رمز عبور"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="mt-3">
              <button
                type="submit"
                className="btn btn-primary me-2"
                disabled={loading}
              >
                {loading ? 'در حال افزودن...' : 'افزودن کاربر'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowAddForm(false)}
              >
                لغو
              </button>
            </div>
          </form>
        )}
        
        <div className="alert alert-info">
          <h6 className="alert-heading">💡 راهنمای استفاده</h6>
          <p className="mb-2">برای ایجاد سیستم رقابتی:</p>
          <ul className="mb-0">
            <li>کاربران جدید اضافه کنید</li>
            <li>هر کاربر با ایمیل و رمز خودش وارد می‌شود</li>
            <li>داده‌های همه کاربران در جدول رتبه‌بندی نمایش داده می‌شود</li>
            <li>هر کاربر می‌تواند بین پروفایل‌ها جابجا شود</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
