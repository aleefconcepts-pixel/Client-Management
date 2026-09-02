import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function LoginScreen() {
  const { availableMembers, loginAsAdmin, loginAsMember, getAvatarGradient, getInitials } = useAuth();
  const { state } = useApp();
  const { clients, settings } = state;

  const [activeTab, setActiveTab] = useState('member'); // 'member' | 'admin'
  const [adminPasscode, setAdminPasscode] = useState('');
  const [searchMember, setSearchMember] = useState('');
  const [fallbackName, setFallbackName] = useState('');

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    loginAsAdmin(adminPasscode);
  };

  const handleFallbackSubmit = (e) => {
    e.preventDefault();
    if (fallbackName.trim()) {
      loginAsMember(fallbackName.trim());
    }
  };

  // Filter members by search term
  const filteredMembers = availableMembers.filter(m =>
    m.toLowerCase().includes(searchMember.toLowerCase().trim())
  );

  // Helper to count clients assigned to a manager
  const getAssignedCount = (memberName) => {
    return clients.filter(c => (c.manager || '').trim().toLowerCase() === memberName.toLowerCase()).length;
  };

  return (
    <div className="login-overlay">
      <div className="login-card-wrapper">
        {/* BRAND HEADER */}
        <div className="login-brand-header">
          <div className="login-logo-badge">AC</div>
          <h1 className="login-title">{settings.agencyName || 'Aleef Concepts'}</h1>
          <p className="login-subtitle">Client Deliverables & Agency Portal</p>
        </div>

        {/* ROLE SELECTION TABS */}
        <div className="login-role-tabs">
          <button
            type="button"
            className={`login-role-tab ${activeTab === 'member' ? 'active' : ''}`}
            onClick={() => setActiveTab('member')}
          >
            <div className="tab-icon-box member-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="tab-text-box">
              <span className="tab-title">Team Member</span>
              <span className="tab-desc">Account Managers</span>
            </div>
          </button>

          <button
            type="button"
            className={`login-role-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <div className="tab-icon-box admin-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div className="tab-text-box">
              <span className="tab-title">Admin Portal</span>
              <span className="tab-desc">Full Agency Access</span>
            </div>
          </button>
        </div>

        {/* TAB 1: TEAM MEMBER / MANAGER LOGIN */}
        {activeTab === 'member' && (
          <div className="login-tab-body">
            <div className="role-description-banner member-banner">
              <div className="banner-icon">👤</div>
              <div className="banner-text">
                <strong>Team Member Login:</strong> Select your name below to view your assigned clients, daily delivery tasks, monthly reports, and calendar.
              </div>
            </div>

            {/* MEMBER LIST SELECTION */}
            {availableMembers.length > 0 ? (
              <div className="member-roster-section">
                <div className="member-roster-header">
                  <span className="roster-label">
                    Select Your Name ({availableMembers.length} Members):
                  </span>
                  {availableMembers.length > 3 && (
                    <input
                      type="text"
                      placeholder="Search member..."
                      value={searchMember}
                      onChange={e => setSearchMember(e.target.value)}
                      className="member-search-input"
                    />
                  )}
                </div>

                <div className="member-cards-scroll">
                  {filteredMembers.length === 0 ? (
                    <div className="no-members-found">
                      No members match "{searchMember}".
                    </div>
                  ) : (
                    filteredMembers.map(memberName => {
                      const clientCount = getAssignedCount(memberName);
                      return (
                        <button
                          key={memberName}
                          type="button"
                          className="member-profile-card"
                          onClick={() => loginAsMember(memberName)}
                        >
                          <div
                            className="member-card-avatar"
                            style={{ background: getAvatarGradient(memberName) }}
                          >
                            {getInitials(memberName)}
                          </div>
                          <div className="member-card-details">
                            <span className="member-card-name">{memberName}</span>
                            <span className="member-card-badge">
                              {clientCount > 0
                                ? `${clientCount} assigned client${clientCount > 1 ? 's' : ''}`
                                : 'Assigned Deliverer'}
                            </span>
                          </div>
                          <div className="member-card-action">
                            <span>Enter</span>
                            <span className="arrow-icon">→</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="fallback-member-login">
                <span className="fallback-title">Enter your manager name to sign in:</span>
                <form onSubmit={handleFallbackSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input login-field"
                    placeholder="e.g. Sara K, Adarsh..."
                    value={fallbackName}
                    onChange={e => setFallbackName(e.target.value)}
                    required
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                    Continue →
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ADMIN LOGIN */}
        {activeTab === 'admin' && (
          <div className="login-tab-body">
            <div className="role-description-banner admin-banner">
              <div className="banner-icon">🛡️</div>
              <div className="banner-text">
                <strong>Administrator Access:</strong> Complete agency control, all clients management, global deliverables, and system settings.
              </div>
            </div>

            <form onSubmit={handleAdminSubmit} className="admin-form-container">
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="admin-passcode-input" className="admin-input-label">
                  Admin Passcode
                </label>
                <input
                  id="admin-passcode-input"
                  type="password"
                  className="form-input login-field"
                  placeholder="Enter passcode"
                  value={adminPasscode}
                  onChange={e => setAdminPasscode(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                className="admin-login-submit-btn"
              >
                <span>Unlock Admin Portal</span>
                <span style={{ fontSize: '1.1rem' }}>🛡️</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
