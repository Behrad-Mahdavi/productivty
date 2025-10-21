import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/TasksPage';
import { CoursesPage } from './pages/CoursesPage';
import { ReflectionPage } from './pages/ReflectionPage';
import { StatsPage } from './pages/StatsPage';

function App() {
  const { loadAppData } = useStore();
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

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
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
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

export default App;