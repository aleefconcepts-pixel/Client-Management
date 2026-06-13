import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function Toast() {
  const { state, dispatch } = useApp();
  const toast = state.toast;

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_TOAST' });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  if (!toast) return null;

  return (
    <div className="toast-container">
      <div className={`toast ${toast.type || 'success'}`}>
        <span>{toast.message}</span>
        <button 
          className="btn-icon" 
          onClick={() => dispatch({ type: 'CLEAR_TOAST' })}
          style={{ padding: '2px', color: 'inherit' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}
