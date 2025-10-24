import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { PersianDatePicker } from './PersianDatePicker';

interface TaskFormProps {
  onClose: () => void;
  defaultDate?: string; // ✅ اضافه کردن prop برای تاریخ پیش‌فرض
}

export const TaskForm: React.FC<TaskFormProps> = ({ onClose, defaultDate }) => {
  const { addTask } = useStore();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'دانشگاه' | 'پروژه' | 'شخصی'>('دانشگاه');
  // ✅ استفاده از defaultDate یا تاریخ امروز به عنوان پیش‌فرض
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addTask({
        title: title.trim(),
        category,
        date,
        done: false,
      });
      onClose();
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">افزودن کار جدید</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">عنوان کار</label>
                <input
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="عنوان کار را وارد کنید..."
                  autoFocus
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label">دسته‌بندی</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                >
                  <option value="دانشگاه">دانشگاه</option>
                  <option value="پروژه">پروژه</option>
                  <option value="شخصی">شخصی</option>
                </select>
              </div>
              
              <div className="mb-3">
                <PersianDatePicker
                  value={date}
                  onChange={setDate}
                  label="تاریخ"
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
                <Plus size={16} className="me-1" />
                افزودن
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};