import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { formatPersianDate, getPersianYear } from '../utils/dateUtils';

interface DateDisplayProps {
  date?: Date;
  showTime?: boolean;
  variant?: 'default' | 'card' | 'compact';
}

export const DateDisplay: React.FC<DateDisplayProps> = ({ 
  date = new Date(), 
  showTime = false,
  variant = 'default'
}) => {
  // استفاده از utility functions برای نمایش تاریخ شمسی
  const fullDate = formatPersianDate(date, 'full');
  const compactDate = formatPersianDate(date, 'compact');
  const year = getPersianYear(date);
  const time = new Date(date).toLocaleTimeString('fa-IR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  if (variant === 'card') {
    return (
      <div className="card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="card-body text-white text-center p-3">
          <div className="d-flex align-items-center justify-content-center mb-2">
            <Calendar size={20} className="me-2" />
            <span className="fw-bold">{fullDate.split('،')[0]}</span>
          </div>
          <div className="h4 mb-1 fw-bold">{fullDate.split('،')[1]?.trim()}</div>
          <div className="small opacity-75">{year}</div>
          {showTime && (
            <div className="d-flex align-items-center justify-content-center mt-2 pt-2 border-top border-white border-opacity-25">
              <Clock size={14} className="me-1" />
              <span className="small">{time}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="d-flex align-items-center text-muted">
        <Calendar size={16} className="me-2" />
        <span className="fw-medium">
          {compactDate}
        </span>
        {showTime && (
          <>
            <Clock size={14} className="ms-3 me-1" />
            <span className="small">{time}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="d-flex align-items-center justify-content-center mb-2">
        <Calendar size={20} className="me-2 text-primary" />
        <span className="h5 mb-0 fw-bold text-dark">{fullDate.split('،')[0]}</span>
      </div>
      <div className="h3 mb-1 fw-bold text-primary">{fullDate.split('،')[1]?.trim()}</div>
      <div className="text-muted">{year}</div>
      {showTime && (
        <div className="d-flex align-items-center justify-content-center mt-2">
          <Clock size={16} className="me-2 text-muted" />
          <span className="text-muted">{time}</span>
        </div>
      )}
    </div>
  );
};