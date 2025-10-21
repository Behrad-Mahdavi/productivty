import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';
import { UserProvider, useUser } from './contexts/UserContext';
import { Layout } from './components/Layout';
import { LoginOrSwitchUser } from './components/LoginOrSwitchUser';
import { UserSelector } from './components/UserSelector';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/TasksPage';
import { CoursesPage } from './pages/CoursesPage';
import { ReflectionPage } from './pages/ReflectionPage';
import { StatsPage } from './pages/StatsPage';
import { GamificationPage } from './pages/GamificationPage';
import { UsersPage } from './pages/UsersPage';

function AppContent() {
  const { loadAppData, setCurrentUserId, setupRealtimeSync, cleanupRealtimeSync } = useStore();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { isLoggedIn, loading, currentUser } = useUser();

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      console.log('User logged in, setting up sync for:', currentUser.id);
      setCurrentUserId(currentUser.id);
      loadAppData(currentUser.id);
      setupRealtimeSync(currentUser.id);
    } else {
      console.log('User logged out, cleaning up sync');
      setCurrentUserId(null);
      cleanupRealtimeSync();
    }
  }, [loadAppData, isLoggedIn, currentUser, setCurrentUserId, setupRealtimeSync, cleanupRealtimeSync]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <p className="mt-3 text-muted">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginOrSwitchUser />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <TasksPage />;
      case 'courses':
        return <CoursesPage />;
      case 'reflection':
        return <ReflectionPage />;
      case 'stats':
        return <StatsPage />;
      case 'gamification':
        return <GamificationPage />;
      case 'users':
        return <UsersPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout 
      currentPage={currentPage} 
      onPageChange={setCurrentPage}
      userSelector={<UserSelector />}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;