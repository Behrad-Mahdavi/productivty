import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';
import { UserProvider, useUser } from './contexts/UserContext';
import { Layout } from './components/Layout';
import { LoginOrSwitchUser } from './components/LoginOrSwitchUser';
import { UserSelector } from './components/UserSelector';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard }))  );
const TasksPage = lazy(() => import('./pages/TasksPage').then(module => ({ default: module.TasksPage })));
const CoursesPage = lazy(() => import('./pages/CoursesPage').then(module => ({ default: module.CoursesPage })));
const ReflectionPage = lazy(() => import('./pages/ReflectionPage').then(module => ({ default: module.ReflectionPage })));
const StatsPage = lazy(() => import('./pages/StatsPage').then(module => ({ default: module.StatsPage })));
const GamificationPage = lazy(() => import('./pages/GamificationPage').then(module => ({ default: module.GamificationPage })));

function AppContent() {
  const { loadAppData, setCurrentUserId, setupRealtimeSync, cleanupRealtimeSync, loadGamificationData } = useStore();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { isLoggedIn, loading, currentUser } = useUser();

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      console.log('User logged in, setting up sync for:', currentUser.id);
      setCurrentUserId(currentUser.id);
      loadAppData(currentUser.id);
      setupRealtimeSync(currentUser.id);
      loadGamificationData(currentUser.id);
    } else {
      console.log('User logged out, cleaning up sync');
      setCurrentUserId(null);
      cleanupRealtimeSync();
    }
  }, [loadAppData, isLoggedIn, currentUser, setCurrentUserId, setupRealtimeSync, cleanupRealtimeSync, loadGamificationData]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">...در حال بارگذاری</span>
          </div>
          <p className="mt-3 text-muted">...در حال بارگذاری</p>
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
      default:
        return <Dashboard />;
    }
  };

  const LoadingSpinner = () => (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">در حال بارگذاری...</span>
      </div>
    </div>
  );

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
          <Suspense fallback={<LoadingSpinner />}>
            {renderPage()}
          </Suspense>
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