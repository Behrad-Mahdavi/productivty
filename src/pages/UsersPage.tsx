import React from 'react';
import { UserManager } from '../components/UserManager';

export const UsersPage: React.FC = () => {
  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="text-center mb-4">
            <h1 className="h2 mb-2 fw-bold text-dark">👥 مدیریت کاربران</h1>
            <p className="text-muted mb-4">کاربران جدید اضافه کنید و سیستم رقابتی بسازید</p>
          </div>
          
          <UserManager />
        </div>
      </div>
    </div>
  );
};
