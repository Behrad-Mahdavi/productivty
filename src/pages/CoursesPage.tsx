import React, { useState, useEffect, useMemo } from 'react';
import { Plus, BookOpen, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { DateDisplay } from '../components/DateDisplay';
import { PersianDatePicker } from '../components/PersianDatePicker';
import { formatPersianDate } from '../utils/dateUtils';

export const CoursesPage: React.FC = () => {
  const { courses, addCourse, deleteCourse, addAssignment, updateAssignment } = useStore();
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [newCourse, setNewCourse] = useState({ name: '', code: '', instructor: '' });
  const [newAssignment, setNewAssignment] = useState({ 
    title: '', 
    description: '', 
    dueDate: new Date().toISOString().split('T')[0],
    courseId: ''
  });

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCourse.name.trim()) {
      addCourse({
        name: newCourse.name.trim(),
        code: newCourse.code.trim(),
        instructor: newCourse.instructor.trim(),
        assignments: []
      });
      setNewCourse({ name: '', code: '', instructor: '' });
      setShowCourseForm(false);
    }
  };

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAssignment.title.trim() && newAssignment.courseId) {
      addAssignment(newAssignment.courseId, {
        title: newAssignment.title.trim(),
        description: newAssignment.description.trim(),
        dueDate: newAssignment.dueDate,
        done: false
      });
      setNewAssignment({ 
        title: '', 
        description: '', 
        dueDate: new Date().toISOString().split('T')[0],
        courseId: ''
      });
      setShowAssignmentForm(false);
    }
  };

  // ✅ بهبود مدیریت dropdown - جلوگیری از تداخل با عملیات داخلی
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // اگر کلیک روی dropdown یا دکمه dropdown نبوده، dropdown را ببند
      if (openDropdown && !target.closest('.dropdown')) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      // ✅ تاخیر کوتاه برای جلوگیری از تداخل با onClick handlers
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openDropdown]);

  // ✅ رفع باگ منطقی تاریخ - مقایسه فقط بر اساس روز، نه ساعت
  const isOverdue = (dueDate: string) => {
    const today = new Date();
    // تاریخ امروز را به ۰۰:۰۰:۰۰ تبدیل کن تا فقط روزها مقایسه شوند
    today.setHours(0, 0, 0, 0); 
    
    // تاریخ سررسید (که ۰۰:۰۰:۰۰ است)
    const due = new Date(dueDate);

    // اگر تاریخ سررسید کوچکتر از تاریخ امروز (در ۰۰:۰۰:۰۰) باشد، گذشته است
    return due < today;
  };

  // ✅ بهینه‌سازی عملکرد با useMemo - محاسبات سنگین فقط در صورت تغییر courses
  const assignmentStats = useMemo(() => {
    const allAssignments = courses.flatMap(course => 
      course.assignments.map(assignment => ({
        ...assignment,
        courseName: course.name,
        courseCode: course.code
      }))
    );
    
    const overdue = allAssignments.filter(a => isOverdue(a.dueDate) && !a.done).length;
    const totalRemaining = allAssignments.filter(a => !a.done).length;
    const totalDone = allAssignments.filter(a => a.done).length;
    
    const upcomingAssignments = allAssignments
      .filter(assignment => !assignment.done)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
    
    return { overdue, totalRemaining, totalDone, upcomingAssignments };
  }, [courses]);

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h2 className="mb-1">مدیریت دروس</h2>
              <p className="text-muted mb-0">پیگیری تکالیف و پروژه‌های دانشگاهی</p>
            </div>
            <DateDisplay variant="compact" showTime={true} />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <BookOpen size={24} className="me-3" />
                <div>
                  <h4 className="mb-0">{courses.length}</h4>
                  <small>تعداد دروس</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <AlertTriangle size={24} className="me-3" />
                <div>
                  <h4 className="mb-0">
                    {assignmentStats.overdue}
                  </h4>
                  <small>تکالیف گذشته</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <Calendar size={24} className="me-3" />
                <div>
                  <h4 className="mb-0">
                    {assignmentStats.totalRemaining}
                  </h4>
                  <small>تکالیف باقی‌مانده</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <CheckCircle size={24} className="me-3" />
                <div>
                  <h4 className="mb-0">
                    {assignmentStats.totalDone}
                  </h4>
                  <small>تکالیف انجام‌شده</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Assignments */}
      {assignmentStats.upcomingAssignments.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">تکالیف نزدیک</h5>
          </div>
          <div className="card-body">
            <div className="row">
              {assignmentStats.upcomingAssignments.map((assignment, index) => (
                <div key={index} className="col-md-6 col-lg-4 mb-3">
                  <div className={`card h-100 ${isOverdue(assignment.dueDate) ? 'border-danger' : 'border-warning'}`}>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="card-title mb-0">{assignment.title}</h6>
                        <span className={`badge ${isOverdue(assignment.dueDate) ? 'bg-danger' : 'bg-warning'}`}>
                          {isOverdue(assignment.dueDate) ? 'گذشته' : 'نزدیک'}
                        </span>
                      </div>
                      <p className="card-text small text-muted mb-2">{assignment.courseName} ({assignment.courseCode})</p>
                      {assignment.description && (
                        <p className="card-text small text-muted mb-2">{assignment.description}</p>
                      )}
                      <div className="d-flex align-items-center text-muted small">
                        <Calendar size={14} className="me-1" />
                        <span>{formatPersianDate(assignment.dueDate, 'compact')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Courses List */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">لیست دروس</h5>
          <button
            className="btn btn-primary"
            onClick={() => setShowCourseForm(true)}
          >
            <Plus size={16} className="me-1" />
            افزودن درس
          </button>
        </div>
        
        <div className="card-body">
          {courses.length === 0 ? (
            <div className="text-center py-5">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <BookOpen size={48} className="text-muted mb-3" />
                  <h5 className="text-muted mb-2">هنوز درسی اضافه نکرده‌اید</h5>
                  <p className="text-muted mb-4">برای شروع، اولین درس خود را اضافه کنید</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowCourseForm(true)}
                  >
                    <Plus size={16} className="me-1" />
                    افزودن درس
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="row">
              {courses.map((course) => (
                <div key={course.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h6 className="card-title mb-1">{course.name}</h6>
                          <p className="card-text small text-muted mb-0">{course.code}</p>
                          <p className="card-text small text-muted">{course.instructor}</p>
                        </div>
                        <div className="dropdown">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === course.id ? null : course.id);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            ⋮
                          </button>
                          {openDropdown === course.id && (
                            <ul className="dropdown-menu show" style={{ zIndex: 9999, position: 'absolute', right: 0, top: '100%' }}>
                              <li>
                                <button
                                  className="dropdown-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setNewAssignment(prev => ({ ...prev, courseId: course.id }));
                                    setShowAssignmentForm(true);
                                    setOpenDropdown(null);
                                  }}
                                >
                                  افزودن تکلیف
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item text-danger"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteCourse(course.id);
                                    setOpenDropdown(null);
                                  }}
                                >
                                  حذف درس
                                </button>
                              </li>
                            </ul>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small className="text-muted">تکالیف</small>
                          <small className="text-muted">
                            {course.assignments.filter(a => a.done).length} / {course.assignments.length}
                          </small>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: course.assignments.length > 0 
                                ? `${(course.assignments.filter(a => a.done).length / course.assignments.length) * 100}%`
                                : '0%'
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      {course.assignments.length > 0 && (
                        <div className="assignment-list">
                          {course.assignments.slice(0, 3).map((assignment) => (
                            <div key={assignment.id} className="mb-2">
                              <div className="d-flex align-items-center justify-content-between mb-1">
                                <div className="d-flex align-items-center">
                                  <input
                                    type="checkbox"
                                    className="form-check-input me-2"
                                    checked={assignment.done}
                                    onChange={() => updateAssignment(course.id, assignment.id, { done: !assignment.done })}
                                  />
                                  <span className={`small ${assignment.done ? 'text-decoration-line-through text-muted' : ''}`}>
                                    {assignment.title}
                                  </span>
                                </div>
                                <small className={`text-muted ${isOverdue(assignment.dueDate) && !assignment.done ? 'text-danger' : ''}`}>
                                  {formatPersianDate(assignment.dueDate, 'short')}
                                </small>
                              </div>
                              {assignment.description && (
                                <div className="ms-4">
                                  <small className="text-muted">{assignment.description}</small>
                                </div>
                              )}
                            </div>
                          ))}
                          {course.assignments.length > 3 && (
                            <small className="text-muted">
                              و {course.assignments.length - 3} تکلیف دیگر...
                            </small>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Course Form Modal */}
      {showCourseForm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">افزودن درس جدید</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCourseForm(false)}
                ></button>
              </div>
              
              <form onSubmit={handleAddCourse}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">نام درس</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newCourse.name}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="نام درس را وارد کنید..."
                      autoFocus
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">کد درس</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newCourse.code}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="مثال: CS101"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">نام استاد</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newCourse.instructor}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, instructor: e.target.value }))}
                      placeholder="نام استاد را وارد کنید..."
                    />
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCourseForm(false)}
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    <Plus size={16} className="me-1" />
                    افزودن درس
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Form Modal */}
      {showAssignmentForm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">افزودن تکلیف جدید</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAssignmentForm(false)}
                ></button>
              </div>
              
              <form onSubmit={handleAddAssignment}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">درس</label>
                    <select
                      className="form-select"
                      value={newAssignment.courseId}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, courseId: e.target.value }))}
                      disabled={newAssignment.courseId !== ''} // ✅ قفل کردن اگر از کارت درس آمده
                      required
                    >
                      {newAssignment.courseId === '' && (
                        <option value="">انتخاب کنید...</option>
                      )}
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.name} ({course.code})
                        </option>
                      ))}
                    </select>
                    {newAssignment.courseId !== '' && (
                      <div className="form-text text-muted">
                        <small>این تکلیف مختص درس انتخاب‌شده است</small>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">عنوان تکلیف</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="عنوان تکلیف را وارد کنید..."
                      autoFocus
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">توضیحات</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="توضیحات تکلیف (اختیاری)..."
                    />
                  </div>
                  
                  <div className="mb-3">
                    <PersianDatePicker
                      value={newAssignment.dueDate}
                      onChange={(date) => setNewAssignment(prev => ({ ...prev, dueDate: date }))}
                      label="تاریخ تحویل"
                    />
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAssignmentForm(false)}
                  >
                    انصراف
                  </button>
                  {newAssignment.courseId !== '' && (
                    <button
                      type="button"
                      className="btn btn-outline-warning me-2"
                      onClick={() => setNewAssignment(prev => ({ ...prev, courseId: '' }))}
                    >
                      تغییر درس
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    <Plus size={16} className="me-1" />
                    افزودن تکلیف
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
