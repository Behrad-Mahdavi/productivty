import React, { useState } from 'react';
import { X, User, Lock, Eye, EyeOff, Mail } from 'lucide-react';

interface AddUserModalProps {
  show: boolean;
  onClose: () => void;
  onAdd: (name: string, email: string, password: string) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ show, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'نام کاربر الزامی است';
    }

    if (!email.trim()) {
      newErrors.email = 'ایمیل الزامی است';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'فرمت ایمیل صحیح نیست';
    }

    if (!password) {
      newErrors.password = 'رمز عبور الزامی است';
    } else if (password.length < 6) {
      newErrors.password = 'رمز عبور باید حداقل 6 کاراکتر باشد';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'رمز عبور و تأیید آن مطابقت ندارند';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onAdd(name.trim(), email.trim(), password);
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setErrors({});
    }
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">ایجاد کاربر جدید</h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
            >
              <X size={18} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-medium">نام کاربر</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    placeholder="نام کاربر را وارد کنید"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label fw-medium">ایمیل</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="ایمیل خود را وارد کنید"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label fw-medium">رمز عبور</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="رمز عبور را وارد کنید"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label fw-medium">تأیید رمز عبور</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    placeholder="رمز عبور را مجدداً وارد کنید"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
              </div>
            </div>

            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleClose}
              >
                انصراف
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                ایجاد کاربر
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
