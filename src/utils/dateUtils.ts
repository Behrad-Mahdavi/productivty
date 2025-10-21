import moment from 'moment-jalaali';

// Persian date utilities
export const formatPersianDate = (date: string | Date, format: 'full' | 'compact' | 'short' = 'full'): string => {
  const jalaaliDate = moment(date);
  
  switch (format) {
    case 'full':
      return jalaaliDate.format('dddd، jD jMMMM jYYYY');
    case 'compact':
      return jalaaliDate.format('jYYYY/jMM/jDD');
    case 'short':
      return jalaaliDate.format('jMM/jDD');
    default:
      return jalaaliDate.format('dddd، jD jMMMM jYYYY');
  }
};

export const getPersianDayName = (date: string | Date): string => {
  const dayNames = {
    0: 'یکشنبه',
    1: 'دوشنبه', 
    2: 'سه‌شنبه',
    3: 'چهارشنبه',
    4: 'پنج‌شنبه',
    5: 'جمعه',
    6: 'شنبه'
  };
  
  const dayIndex = moment(date).day();
  return dayNames[dayIndex as keyof typeof dayNames] || '';
};

export const getPersianMonthName = (date: string | Date): string => {
  return moment(date).format('jMMMM');
};

export const getPersianYear = (date: string | Date): string => {
  return moment(date).format('jYYYY');
};

export const getTodayPersian = (): string => {
  return moment().format('jYYYY/jMM/jDD');
};

export const getTodayPersianFull = (): string => {
  return moment().format('dddd، jD jMMMM jYYYY');
};

// Convert Gregorian to Jalali for display
export const toPersianDate = (date: string | Date): string => {
  return moment(date).format('jYYYY/jMM/jDD');
};

// Get relative time in Persian
export const getPersianRelativeTime = (date: string | Date): string => {
  return moment(date).fromNow();
};

// Check if date is today
export const isToday = (date: string | Date): boolean => {
  return moment(date).isSame(moment(), 'day');
};

// Check if date is yesterday
export const isYesterday = (date: string | Date): boolean => {
  return moment(date).isSame(moment().subtract(1, 'day'), 'day');
};

// Get week day name in Persian
export const getPersianWeekDay = (date: string | Date): string => {
  const dayNames = {
    0: 'یکشنبه',
    1: 'دوشنبه', 
    2: 'سه‌شنبه',
    3: 'چهارشنبه',
    4: 'پنج‌شنبه',
    5: 'جمعه',
    6: 'شنبه'
  };
  
  const dayIndex = moment(date).day();
  return dayNames[dayIndex as keyof typeof dayNames] || '';
};
