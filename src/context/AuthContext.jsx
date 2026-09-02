/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { extractAvailableMembers } from '../utils/memberHelpers';

const AuthContext = createContext();

const AUTH_STORAGE_KEY = 'agency_auth_session';
const DEFAULT_ADMIN_PIN = 'admin123';

// Deterministic Avatar Color generator
export const getAvatarGradient = (name = '') => {
  const gradients = [
    'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
    'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
    'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

export const getInitials = (name = '') => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const AuthProvider = ({ children }) => {
  const { state, showToast } = useApp();
  const { clients, events } = state;

  // Initialize currentUser from localStorage for persistence on page refresh
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading auth session from localStorage:', e);
    }
    return null; // null means show login screen
  });

  // Extract all known team members / managers dynamically from clients & events
  const [availableMembers, setAvailableMembers] = useState([]);

  useEffect(() => {
    const members = extractAvailableMembers(clients, events);
    setAvailableMembers(members);
  }, [clients, events]);

  // Persist session changes to localStorage
  const persistSession = (user) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  // Login as Admin
  const loginAsAdmin = (passcode = '') => {
    // Admin passcode check (default: admin123)
    if (passcode.trim() !== DEFAULT_ADMIN_PIN) {
      showToast('Incorrect Admin passcode. Try: admin123', 'error');
      return false;
    }

    const adminUser = {
      role: 'admin',
      name: 'Administrator',
      title: 'Agency Admin'
    };
    persistSession(adminUser);
    showToast('Logged in as Administrator ✓', 'success');
    return true;
  };

  // Login as Team Member / Manager
  const loginAsMember = (memberName = '') => {
    const trimmed = (memberName || '').trim();
    if (!trimmed) {
      showToast('Please select or enter a member name', 'error');
      return false;
    }

    const memberUser = {
      role: 'member',
      name: trimmed,
      title: 'Account Manager'
    };
    persistSession(memberUser);
    showToast(`Logged in as ${trimmed} ✓`, 'success');
    return true;
  };

  // Logout
  const logout = () => {
    persistSession(null);
    showToast('Logged out successfully', 'success');
  };

  const isAdmin = currentUser?.role === 'admin';
  const isMember = currentUser?.role === 'member';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        isMember,
        availableMembers,
        loginAsAdmin,
        loginAsMember,
        logout,
        getAvatarGradient,
        getInitials
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
