import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import moment from 'moment-jalaali';

interface PersianDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
}

export const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
  value,
  onChange,
  label = 'تاریخ'
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  
  // تبدیل تاریخ میلادی به شمسی برای نمایش
  const displayDate = moment(value).format('jYYYY/jMM/jDD');
  

  // بستن dropdown با کلیک خارج از آن
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  return (
    <div className="persian-date-picker" ref={pickerRef}>
      <label className="form-label">{label}</label>
      <div className="input-group">
        <span className="input-group-text">
          <Calendar size={16} />
        </span>
        <input
          type="text"
          className="form-control"
          value={displayDate}
          readOnly
          onClick={() => setShowPicker(!showPicker)}
          placeholder="تاریخ را انتخاب کنید..."
        />
      </div>
      
      {showPicker && (
        <div className="dropdown-menu show position-absolute top-100 start-0 w-100 bg-white border rounded shadow-lg p-3 mt-1" style={{ zIndex: 9999 }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">انتخاب تاریخ</h6>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowPicker(false)}
            ></button>
          </div>
          
          <div className="row g-2">
            <div className="col-4">
              <label className="form-label small">سال</label>
              <select
                className="form-select form-select-sm"
                value={moment(value).jYear()}
                onChange={(e) => {
                  const newDate = moment(value).jYear(parseInt(e.target.value)).format('YYYY-MM-DD');
                  onChange(newDate);
                }}
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const year = moment().jYear() - 5 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div className="col-4">
              <label className="form-label small">ماه</label>
              <select
                className="form-select form-select-sm"
                value={moment(value).jMonth() + 1}
                onChange={(e) => {
                  const newDate = moment(value).jMonth(parseInt(e.target.value) - 1).format('YYYY-MM-DD');
                  onChange(newDate);
                }}
              >
                {[
                  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
                  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
                ].map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-4">
              <label className="form-label small">روز</label>
              <select
                className="form-select form-select-sm"
                value={moment(value).jDate()}
                onChange={(e) => {
                  const newDate = moment(value).jDate(parseInt(e.target.value)).format('YYYY-MM-DD');
                  onChange(newDate);
                }}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="d-flex gap-2 mt-3">
            <button
              type="button"
              className="btn btn-primary btn-sm flex-fill"
              onClick={() => setShowPicker(false)}
            >
              تایید
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm flex-fill"
              onClick={() => {
                onChange(new Date().toISOString().split('T')[0]);
                setShowPicker(false);
              }}
            >
              امروز
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
