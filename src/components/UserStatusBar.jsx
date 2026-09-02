import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function UserStatusBar() {
  const { currentUser, isAdmin, isMember, logout, getAvatarGradient, getInitials } = useAuth();
  const { state } = useApp();
  const { clients } = state;

  if (!currentUser) return null;

  const assignedClientsCount = isMember
    ? clients.filter(c => (c.manager || '').trim().toLowerCase() === (currentUser.name || '').trim().toLowerCase()).length
    : clients.length;

  return (
    <div className="user-status-bar">
      <div className="user-status-info">
        <div
          className="user-status-avatar"
          style={{
            background: isAdmin
              ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)'
              : getAvatarGradient(currentUser.name)
          }}
        >
          {isAdmin ? '🛡️' : getInitials(currentUser.name)}
        </div>

        <div className="user-status-details">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="user-status-name">{currentUser.name}</span>
            <span className={`badge ${isAdmin ? 'badge-overdue' : 'badge-delivered'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
              {isAdmin ? 'Admin' : 'Manager'}
            </span>
          </div>
          <span className="user-status-role">
            {isAdmin
              ? `All ${clients.length} Clients • Full System Access`
              : `${assignedClientsCount} Assigned Client${assignedClientsCount === 1 ? '' : 's'}`}
          </span>
        </div>
      </div>

      <div className="user-status-actions">
        <button
          type="button"
          className="btn btn-secondary user-switch-btn"
          onClick={logout}
          title="Switch User or Logout"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Switch Account</span>
        </button>
      </div>
    </div>
  );
}
