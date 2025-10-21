import React, { useState, useEffect } from 'react';
import { Save, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';

interface ReflectionFormProps {
  onClose: () => void;
  date?: string;
}

export const ReflectionForm: React.FC<ReflectionFormProps> = ({ onClose, date }) => {
  const { addReflection, getReflection, getFocusMinutesToday } = useStore();
  const [good, setGood] = useState('');
  const [distraction, setDistraction] = useState('');
  const [improve, setImprove] = useState('');
  
  const reflectionDate = date || new Date().toISOString().split('T')[0];
  const focusMinutes = getFocusMinutesToday();

  useEffect(() => {
    const existingReflection = getReflection(reflectionDate);
    if (existingReflection) {
      setGood(existingReflection.good);
      setDistraction(existingReflection.distraction);
      setImprove(existingReflection.improve);
    }
  }, [reflectionDate, getReflection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addReflection({
      date: reflectionDate,
      good: good.trim(),
      distraction: distraction.trim(),
      improve: improve.trim(),
      focusMinutes,
    });
    onClose();
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <div className="d-flex align-items-center">
              <Calendar className="text-success me-2" size={20} />
              <h5 className="modal-title mb-0">
                بازتاب روزانه - {new Date(reflectionDate).toLocaleDateString('fa-IR')}
              </h5>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Focus minutes display */}
              {focusMinutes > 0 && (
                <div className="alert alert-success">
                  <div className="d-flex align-items-center">
                    <Clock className="me-2" size={20} />
                    <div>
                      <strong>امروز {focusMinutes} دقیقه تمرکز داشتی!</strong> 🎯
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <label className="form-label fw-bold">
                  امروز از چی راضی بودی؟ ✨
                </label>
                <textarea
                  className="form-control"
                  value={good}
                  onChange={(e) => setGood(e.target.value)}
                  rows={3}
                  placeholder="چیزهایی که امروز خوب پیش رفت..."
                />
              </div>
              
              <div className="mb-4">
                <label className="form-label fw-bold">
                  چی تمرکزت رو گرفت؟ 😵‍💫
                </label>
                <textarea
                  className="form-control"
                  value={distraction}
                  onChange={(e) => setDistraction(e.target.value)}
                  rows={3}
                  placeholder="موانع و حواس‌پرتی‌ها..."
                />
              </div>
              
              <div className="mb-4">
                <label className="form-label fw-bold">
                  فردا چی قراره بهتر انجام بدی؟ 🚀
                </label>
                <textarea
                  className="form-control"
                  value={improve}
                  onChange={(e) => setImprove(e.target.value)}
                  rows={3}
                  placeholder="برنامه‌های بهبود..."
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                انصراف
              </button>
              <button
                type="submit"
                className="btn btn-success"
              >
                <Save size={16} className="me-1" />
                ذخیره بازتاب
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};