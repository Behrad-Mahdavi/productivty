import React, { useState } from 'react';
import { Calendar, Clock, Heart, AlertTriangle, Target, Plus, Edit, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { DateDisplay } from '../components/DateDisplay';
import { PersianDatePicker } from '../components/PersianDatePicker';
import moment from 'moment-jalaali';

export const ReflectionPage: React.FC = () => {
  const { reflections, addReflection, deleteReflection, getFocusMinutesToday } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [editingReflection, setEditingReflection] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    good: '',
    distraction: '',
    improve: ''
  });

  const currentReflection = reflections.find(r => r.date === selectedDate);
  const focusMinutes = getFocusMinutesToday();

  const handleAddReflection = () => {
    setFormData({
      good: currentReflection?.good || '',
      distraction: currentReflection?.distraction || '',
      improve: currentReflection?.improve || ''
    });
    setEditingReflection(selectedDate);
    setShowForm(true);
  };

  const handleEditReflection = (date: string) => {
    const reflection = reflections.find(r => r.date === date);
    if (reflection) {
      setFormData({
        good: reflection.good,
        distraction: reflection.distraction,
        improve: reflection.improve
      });
      setEditingReflection(date);
      setShowForm(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.good.trim() || formData.distraction.trim() || formData.improve.trim()) {
      addReflection({
        date: selectedDate,
        good: formData.good.trim(),
        distraction: formData.distraction.trim(),
        improve: formData.improve.trim(),
        focusMinutes: selectedDate === new Date().toISOString().split('T')[0] ? focusMinutes : currentReflection?.focusMinutes
      });
    }
    setShowForm(false);
    setEditingReflection(null);
    setFormData({ good: '', distraction: '', improve: '' });
  };

  const handleDelete = (date: string) => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید این بازتاب را حذف کنید؟')) {
      deleteReflection(date);
    }
  };

  const sortedReflections = [...reflections].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-1 fw-bold text-dark">بازتاب روزانه</h1>
              <p className="text-muted mb-0">ثبت و مرور بازتاب‌های روزانه</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleAddReflection}
            >
              <Plus size={18} className="me-2" />
              بازتاب جدید
            </button>
          </div>

          {/* Date Selection */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="card-title mb-3">انتخاب تاریخ</h6>
                  <PersianDatePicker
                    value={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    placeholder="تاریخ را انتخاب کنید"
                  />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <DateDisplay 
                    date={new Date(selectedDate)} 
                    variant="card" 
                    showTime={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Current Reflection */}
          {currentReflection ? (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <Calendar className="text-primary me-2" size={20} />
                    <h6 className="mb-0">بازتاب {moment(selectedDate).format('jYYYY/jMM/jDD')}</h6>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleEditReflection(selectedDate)}
                    >
                      <Edit size={16} className="me-1" />
                      ویرایش
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(selectedDate)}
                    >
                      <Trash2 size={16} className="me-1" />
                      حذف
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {currentReflection.focusMinutes && currentReflection.focusMinutes > 0 && (
                  <div className="alert alert-success mb-3">
                    <div className="d-flex align-items-center">
                      <Clock className="me-2" size={20} />
                      <div>
                        <strong>زمان تمرکز: {currentReflection.focusMinutes} دقیقه</strong> 🎯
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <div className="d-flex align-items-start">
                      <Heart className="text-success me-2 mt-1" size={18} />
                      <div>
                        <h6 className="text-success mb-2">چیزهای خوب</h6>
                        <p className="text-muted mb-0">{currentReflection.good}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-4 mb-3">
                    <div className="d-flex align-items-start">
                      <AlertTriangle className="text-warning me-2 mt-1" size={18} />
                      <div>
                        <h6 className="text-warning mb-2">حواس‌پرتی‌ها</h6>
                        <p className="text-muted mb-0">{currentReflection.distraction}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-4 mb-3">
                    <div className="d-flex align-items-start">
                      <Target className="text-primary me-2 mt-1" size={18} />
                      <div>
                        <h6 className="text-primary mb-2">بهبودها</h6>
                        <p className="text-muted mb-0">{currentReflection.improve}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body text-center py-5">
                <Calendar className="text-muted mb-3" size={48} />
                <h5 className="text-muted mb-2">هیچ بازتابی برای این تاریخ ثبت نشده</h5>
                <p className="text-muted mb-3">برای شروع بازتاب روزانه، دکمه "بازتاب جدید" را کلیک کنید</p>
                <button
                  className="btn btn-primary"
                  onClick={handleAddReflection}
                >
                  <Plus size={18} className="me-2" />
                  شروع بازتاب
                </button>
              </div>
            </div>
          )}

          {/* Reflection History */}
          {sortedReflections.length > 0 && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-light">
                <h6 className="mb-0">تاریخچه بازتاب‌ها</h6>
              </div>
              <div className="card-body p-0">
                <div className="list-group list-group-flush">
                  {sortedReflections.map((reflection) => (
                    <div key={reflection.date} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-2">
                            <Calendar className="text-primary me-2" size={16} />
                            <h6 className="mb-0">{moment(reflection.date).format('dddd، jD jMMMM jYYYY')}</h6>
                            {reflection.focusMinutes && reflection.focusMinutes > 0 && (
                              <span className="badge bg-success ms-2">
                                <Clock size={12} className="me-1" />
                                {reflection.focusMinutes} دقیقه
                              </span>
                            )}
                          </div>
                          <div className="row">
                            <div className="col-md-4">
                              <small className="text-success fw-bold">خوب:</small>
                              <p className="small text-muted mb-1">{reflection.good}</p>
                            </div>
                            <div className="col-md-4">
                              <small className="text-warning fw-bold">حواس‌پرتی:</small>
                              <p className="small text-muted mb-1">{reflection.distraction}</p>
                            </div>
                            <div className="col-md-4">
                              <small className="text-primary fw-bold">بهبود:</small>
                              <p className="small text-muted mb-1">{reflection.improve}</p>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              setSelectedDate(reflection.date);
                              handleEditReflection(reflection.date);
                            }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(reflection.date)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reflection Form Modal */}
      {showForm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <div className="d-flex align-items-center">
                  <Calendar className="text-success me-2" size={20} />
                  <h5 className="modal-title mb-0">
                    {editingReflection === selectedDate ? 'ویرایش بازتاب' : 'بازتاب جدید'} - {moment(selectedDate).format('jYYYY/jMM/jDD')}
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowForm(false);
                    setEditingReflection(null);
                    setFormData({ good: '', distraction: '', improve: '' });
                  }}
                ></button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {/* Focus minutes display */}
                  {selectedDate === new Date().toISOString().split('T')[0] && focusMinutes > 0 && (
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
                      value={formData.good}
                      onChange={(e) => setFormData(prev => ({ ...prev, good: e.target.value }))}
                      rows={3}
                      placeholder="چیزهایی که امروز خوب پیش رفت..."
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="form-label fw-bold">
                      چی تمرکزت رو گرفت؟ ⚠️
                    </label>
                    <textarea
                      className="form-control"
                      value={formData.distraction}
                      onChange={(e) => setFormData(prev => ({ ...prev, distraction: e.target.value }))}
                      rows={3}
                      placeholder="چیزهایی که حواس‌ت رو پرت کرد..."
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="form-label fw-bold">
                      فردا چی قراره بهتر انجام بدی؟ 🎯
                    </label>
                    <textarea
                      className="form-control"
                      value={formData.improve}
                      onChange={(e) => setFormData(prev => ({ ...prev, improve: e.target.value }))}
                      rows={3}
                      placeholder="چیزهایی که می‌خواهی بهبود بدی..."
                    />
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowForm(false);
                      setEditingReflection(null);
                      setFormData({ good: '', distraction: '', improve: '' });
                    }}
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                  >
                    {editingReflection === selectedDate ? 'بروزرسانی بازتاب' : 'ذخیره بازتاب'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
