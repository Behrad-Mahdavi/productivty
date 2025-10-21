import React, { useState } from 'react';
import { Settings, Save, RotateCcw, Plus, Edit, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export const TimerSettings: React.FC = () => {
  const { timerSettings, updateTimerSettings, addFocusSession, focusSessions, updateFocusSession, deleteFocusSession } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [manualMinutes, setManualMinutes] = useState(0);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editMinutes, setEditMinutes] = useState(0);
  
  console.log('TimerSettings component rendered');
  const [settings, setSettings] = useState({
    workDuration: timerSettings.workDuration,
    shortBreakDuration: timerSettings.shortBreakDuration,
    longBreakDuration: timerSettings.longBreakDuration,
    cyclesBeforeLongBreak: timerSettings.cyclesBeforeLongBreak
  });

  const handleSave = async () => {
    await updateTimerSettings(settings);
    setIsOpen(false);
  };

  const handleReset = () => {
    setSettings({
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      cyclesBeforeLongBreak: 4
    });
  };

  const handleManualEntry = async () => {
    if (manualMinutes > 0) {
      await addFocusSession(manualMinutes);
      setManualMinutes(0);
    }
  };

  const handleEditSession = (sessionId: string, currentMinutes: number) => {
    setEditingSession(sessionId);
    setEditMinutes(currentMinutes);
  };

  const handleSaveEdit = async () => {
    if (editingSession && editMinutes > 0) {
      await updateFocusSession(editingSession, editMinutes);
      setEditingSession(null);
      setEditMinutes(0);
    }
  };

  const handleCancelEdit = () => {
    setEditingSession(null);
    setEditMinutes(0);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm('آیا مطمئن هستید که می‌خواهید این تمرین را حذف کنید؟')) {
      await deleteFocusSession(sessionId);
    }
  };

  return (
    <>
      <button
        className="btn btn-outline-secondary btn-sm"
        onClick={() => setIsOpen(true)}
        title="تنظیمات تایمر"
      >
        <Settings size={16} />
      </button>

      {isOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">تنظیمات تایمر</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Manual Entry Section */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h6 className="mb-0">ثبت دستی تمرین</h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-8">
                        <label className="form-label">دقیقه تمرکز</label>
                        <input
                          type="number"
                          className="form-control"
                          min="1"
                          max="480"
                          value={manualMinutes}
                          onChange={(e) => setManualMinutes(parseInt(e.target.value) || 0)}
                          placeholder="مثال: 30"
                        />
                      </div>
                      <div className="col-md-4 d-flex align-items-end">
                        <button
                          type="button"
                          className="btn btn-success w-100"
                          onClick={handleManualEntry}
                          disabled={manualMinutes <= 0}
                        >
                          <Plus size={16} className="me-1" />
                          اضافه کن
                        </button>
                      </div>
                    </div>
                    <small className="text-muted">
                      برای زمانی که تایمر رو فراموش کردید و می‌خواید دستی تمرین رو ثبت کنید
                    </small>
                  </div>
                </div>

                {/* Recent Sessions Section */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h6 className="mb-0">تمرین‌های اخیر</h6>
                  </div>
                  <div className="card-body">
                    {focusSessions.length === 0 ? (
                      <p className="text-muted text-center">هنوز تمرینی ثبت نشده</p>
                    ) : (
                      <div className="list-group">
                        {focusSessions.slice(-5).reverse().map((session) => (
                          <div key={session.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                              <div className="fw-medium">
                                {Math.round(session.durationSec / 60)} دقیقه تمرکز
                              </div>
                              <small className="text-muted">
                                {new Date(session.startTime).toLocaleDateString('fa-IR')} - 
                                {new Date(session.startTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                              </small>
                            </div>
                            <div className="d-flex gap-2">
                              {editingSession === session.id ? (
                                <div className="d-flex gap-2">
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    style={{ width: '80px' }}
                                    min="1"
                                    max="480"
                                    value={editMinutes}
                                    onChange={(e) => setEditMinutes(parseInt(e.target.value) || 0)}
                                  />
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={handleSaveEdit}
                                    disabled={editMinutes <= 0}
                                  >
                                    <Save size={14} />
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={handleCancelEdit}
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => handleEditSession(session.id, Math.round(session.durationSec / 60))}
                                    title="ویرایش"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => handleDeleteSession(session.id)}
                                    title="حذف"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timer Settings Section */}
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">مدت تمرکز (دقیقه)</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="60"
                      value={settings.workDuration}
                      onChange={(e) => setSettings({
                        ...settings,
                        workDuration: parseInt(e.target.value) || 25
                      })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">استراحت کوتاه (دقیقه)</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="30"
                      value={settings.shortBreakDuration}
                      onChange={(e) => setSettings({
                        ...settings,
                        shortBreakDuration: parseInt(e.target.value) || 5
                      })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">استراحت طولانی (دقیقه)</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="60"
                      value={settings.longBreakDuration}
                      onChange={(e) => setSettings({
                        ...settings,
                        longBreakDuration: parseInt(e.target.value) || 15
                      })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">تعداد سیکل قبل از استراحت طولانی</label>
                    <input
                      type="number"
                      className="form-control"
                      min="2"
                      max="10"
                      value={settings.cyclesBeforeLongBreak}
                      onChange={(e) => setSettings({
                        ...settings,
                        cyclesBeforeLongBreak: parseInt(e.target.value) || 4
                      })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleReset}
                >
                  <RotateCcw size={16} className="me-1" />
                  بازنشانی
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                >
                  <Save size={16} className="me-1" />
                  ذخیره
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
