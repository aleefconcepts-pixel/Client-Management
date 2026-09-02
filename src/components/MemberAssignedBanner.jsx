import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function MemberAssignedBanner() {
  const { currentUser, isMember, getAvatarGradient, getInitials } = useAuth();
  const { state, dispatch } = useApp();
  const { clients, events, settings } = state;

  if (!isMember || !currentUser) return null;

  const memberName = (currentUser.name || '').trim().toLowerCase();
  const assignedClients = clients.filter(c => (c.manager || '').trim().toLowerCase() === memberName);
  const activeMonth = settings.currentMonth || new Date().toISOString().substring(0, 7);

  const handleFilterClient = (clientId) => {
    dispatch({ type: 'SET_CALENDAR_FILTER', payload: clientId });
    dispatch({ type: 'SET_NAV', payload: 'calendar' });
  };

  return (
    <div className="member-assigned-banner">
      <div className="member-banner-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            className="member-banner-avatar"
            style={{ background: getAvatarGradient(currentUser.name) }}
          >
            {getInitials(currentUser.name)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="member-banner-title">{currentUser.name}</h2>
              <span className="badge badge-delivered" style={{ fontSize: '11px', padding: '2px 8px' }}>
                Assigned Manager
              </span>
            </div>
            <p className="member-banner-subtitle">
              Your assigned clients and deliverables portfolio for {settings.agencyName || 'Aleef Concepts'}
            </p>
          </div>
        </div>

        <div className="member-banner-stat">
          <span className="member-stat-num">{assignedClients.length}</span>
          <span className="member-stat-label">Assigned Clients</span>
        </div>
      </div>

      {/* ASSIGNED CLIENTS CARDS / TAGS */}
      <div className="member-clients-container">
        <span className="member-clients-title">Your Managed Brands & Accounts:</span>
        {assignedClients.length === 0 ? (
          <div className="member-no-clients">
            <span>ℹ️ No client accounts currently assigned to <strong>{currentUser.name}</strong>. Deliverables scheduled for you directly will still appear below.</span>
          </div>
        ) : (
          <div className="member-clients-chips-grid">
            {assignedClients.map(client => {
              const clientEvents = (events || []).filter(
                e => e.client === client.id && e.date && e.date.substring(0, 7) === activeMonth
              );
              const total = clientEvents.length;
              const delivered = clientEvents.filter(e => e.status === 'delivered').length;

              return (
                <div
                  key={client.id}
                  className="member-client-chip"
                  onClick={() => handleFilterClient(client.id)}
                  title="Click to view this client in Calendar"
                >
                  <span
                    className="client-chip-dot"
                    style={{ background: client.color || 'var(--accent)' }}
                  />
                  <div className="client-chip-info">
                    <span className="client-chip-name">{client.name}</span>
                    <span className="client-chip-meta">{client.niche}</span>
                  </div>
                  <span className="client-chip-deliveries" title="Delivered / Total deliverables this month">
                    {delivered}/{total} ✓
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
