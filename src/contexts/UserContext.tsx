import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface UserContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (name: string, email: string, password: string) => Promise<string>;
  switchUser: (userId: string) => void;
  isLoggedIn: boolean;
  loading: boolean;
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
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('Auth state changed:', firebaseUser?.uid);
      if (firebaseUser) {
        // Load user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User data loaded:', userData);
          setCurrentUser({
            id: firebaseUser.uid,
            name: userData.name,
            passwordHash: userData.passwordHash,
            createdAt: userData.createdAt
          });
        } else {
          console.log('User document not found');
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load all users from Firestore
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList: User[] = [];
        usersSnapshot.forEach((doc) => {
          const data = doc.data();
          usersList.push({
            id: doc.id,
            name: data.name,
            passwordHash: data.passwordHash,
            createdAt: data.createdAt
          });
        });
        setUsers(usersList);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    // Load users when component mounts
    loadUsers();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const addUser = async (name: string, email: string, password: string): Promise<string> => {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      
      // Create user document in Firestore
      const passwordHash = await sha256(password);
      const userData = {
        name,
        passwordHash,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', userId), userData);

      // Update local state
      const newUser: User = {
        id: userId,
        name,
        passwordHash,
        createdAt: userData.createdAt
      };

      setUsers(prev => [...prev, newUser]);
      return userId;
    } catch (error) {
      console.error('Add user error:', error);
      throw error;
    }
  };

  const switchUser = () => {
    // This will be handled by Firebase Auth state changes
    // The user needs to sign in with their credentials
    console.log('Switch user functionality needs to be implemented with proper authentication');
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
      isLoggedIn,
      loading
    }}>
      {children}
    </UserContext.Provider>
  );
};