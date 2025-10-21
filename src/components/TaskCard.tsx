import React from 'react';
import { Check, Clock, Play, Trash2 } from 'lucide-react';
import type { Task } from '../types';
import { useStore } from '../store/useStore';
import { formatPersianDate } from '../utils/dateUtils';

interface TaskCardProps {
  task: Task;
  onStartTimer?: (taskId: string) => void;
}

const categoryColors = {
  دانشگاه: 'badge-primary',
  پروژه: 'badge-success',
  شخصی: 'badge-info',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStartTimer }) => {
  const { toggleTask, deleteTask } = useStore();

  const handleToggle = () => {
    toggleTask(task.id);
  };

  const handleDelete = () => {
    deleteTask(task.id);
  };

  const handleStartTimer = () => {
    if (onStartTimer) {
      onStartTimer(task.id);
    }
  };

  return (
    <div className={`card task-card mb-3 fade-in ${task.done ? 'completed' : ''}`}>
      <div className="card-body">
        <div className="d-flex align-items-start">
          <button
            onClick={handleToggle}
            className={`btn btn-sm me-3 ${task.done ? 'btn-success' : 'btn-outline-secondary'}`}
            style={{ minWidth: '32px', height: '32px' }}
          >
            {task.done && <Check size={16} />}
          </button>
          
          <div className="flex-grow-1">
            <h5 className={`card-title mb-2 fw-bold ${task.done ? 'task-title' : ''}`}>
              {task.title}
            </h5>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className={`badge category-badge ${categoryColors[task.category]}`}>
                {task.category}
              </span>
              <small className="text-muted d-flex align-items-center">
                <Clock size={12} className="me-1" />
                {formatPersianDate(task.date, 'compact')}
              </small>
            </div>
          </div>
          
          <div className="d-flex gap-2">
            {!task.done && onStartTimer && (
              <button
                onClick={handleStartTimer}
                className="btn btn-outline-success btn-sm"
                title="شروع تایمر تمرکز"
              >
                <Play size={16} />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="btn btn-outline-danger btn-sm"
              title="حذف"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};