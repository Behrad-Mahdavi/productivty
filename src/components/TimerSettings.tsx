import React, { useState } from 'react';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';

export const TimerSettings: React.FC = () => {
  const { timerSettings, updateTimerSettings } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  
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
