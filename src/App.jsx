import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import LoginScreen from './components/LoginScreen';
import UserStatusBar from './components/UserStatusBar';

// Pages
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Report from './pages/Report';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';

export default function App() {
  const { state, dispatch } = useApp();
  const { currentUser, isMember } = useAuth();
  const { activeNav } = state;
  const [mobileOpen, setMobileOpen] = useState(false);

  // Route guard: if member tries to access clients or settings, redirect to dashboard
  useEffect(() => {
    if (isMember && (activeNav === 'clients' || activeNav === 'settings')) {
      dispatch({ type: 'SET_NAV', payload: 'dashboard' });
    }
  }, [isMember, activeNav, dispatch]);

  // If user is not logged in, show Login Screen
  if (!currentUser) {
    return (
      <>
        <LoginScreen />
        <Toast />
      </>
    );
  }

  // Map activeNav identifier to actual page components
  const renderActivePage = () => {
    switch (activeNav) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        // Protected for Admin only
        return isMember ? <Dashboard /> : <Clients />;
      case 'report':
        return <Report />;
      case 'calendar':
        return <Calendar />;
      case 'settings':
        // Protected for Admin only
        return isMember ? <Dashboard /> : <Settings />;
      default:
        return <Dashboard />;
    }
  };

  // Human-readable title helper for mobile header
  const getPageTitle = () => {
    switch (activeNav) {
      case 'dashboard': return 'Dashboard';
      case 'clients': return 'Clients';
      case 'report': return 'Monthly Report';
      case 'calendar': return 'Calendar';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Sticky Header Bar */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="logo-monogram" style={{ width: '28px', height: '28px', fontSize: '0.9rem', borderRadius: '6px' }}>AC</div>
          <span style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.05rem' }}>{getPageTitle()}</span>
        </div>
        
        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle Menu"
        >
          {mobileOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>
      </header>

      {/* Side navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Mobile sidebar backdrop */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content display page */}
      <main className="main-content">
        <UserStatusBar />
        {renderActivePage()}
      </main>

      {/* Persistent global notifications */}
      <Toast />
    </div>
  );
}
