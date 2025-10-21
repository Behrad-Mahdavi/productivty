import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';

interface UserContextType {
  currentUser: User | null;
  users: User[];
  login: (userId: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (name: string, password: string) => Promise<string>;
  switchUser: (userId: string) => void;
  isLoggedIn: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Simple SHA-256 implementation
const sha256 = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Load users and current user on mount
  useEffect(() => {
    const loadUsers = () => {
      const usersData = localStorage.getItem('ppj_users');
      if (usersData) {
        setUsers(JSON.parse(usersData));
      }
    };

    const loadCurrentUser = () => {
      const currentUserId = localStorage.getItem('ppj_currentUser');
      if (currentUserId) {
        const usersData = localStorage.getItem('ppj_users');
        if (usersData) {
          const allUsers = JSON.parse(usersData);
          const user = allUsers.find((u: User) => u.id === currentUserId);
          if (user) {
            setCurrentUser(user);
          }
        }
      }
    };

    loadUsers();
    loadCurrentUser();
  }, []);

  const login = async (userId: string, password: string): Promise<boolean> => {
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    try {
      const hash = await sha256(password);
      if (hash === user.passwordHash) {
        setCurrentUser(user);
        localStorage.setItem('ppj_currentUser', userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ppj_currentUser');
  };

  const addUser = async (name: string, password: string): Promise<string> => {
    const userId = `user_${Date.now()}`;
    const passwordHash = await sha256(password);
    
    const newUser: User = {
      id: userId,
      name,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('ppj_users', JSON.stringify(updatedUsers));

    return userId;
  };

  const switchUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('ppj_currentUser', userId);
    }
  };

  const isLoggedIn = currentUser !== null;

  return (
    <UserContext.Provider value={{
      currentUser,
      users,
      login,
      logout,
      addUser,
      switchUser,
      isLoggedIn
    }}>
      {children}
    </UserContext.Provider>
  );
};
