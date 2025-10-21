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

function AppContent() {
  const { loadAppData } = useStore();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { isLoggedIn, currentUser } = useUser();

  useEffect(() => {
    if (isLoggedIn) {
      loadAppData();
    }
  }, [loadAppData, isLoggedIn]);

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