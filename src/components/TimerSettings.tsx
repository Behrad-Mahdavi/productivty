import React, { useState } from 'react';
import { Settings, Save, RotateCcw, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';

export const TimerSettings: React.FC = () => {
  const { timerSettings, updateTimerSettings, addFocusSession } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [manualMinutes, setManualMinutes] = useState(0);
  
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
