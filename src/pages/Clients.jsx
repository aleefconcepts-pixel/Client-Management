import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import { sanitizeTextInput } from '../utils/security';

export default function Clients() {
  const { state, dispatch, showToast } = useApp();
  const { clients, events, settings } = state;

  useEffect(() => {
    document.title = `${settings.agencyName || 'Aleef Concepts'} — Clients`;
  }, [settings.agencyName]);

  // Modal open states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('Fashion');
  const [manager, setManager] = useState('');
  const [color, setColor] = useState('#00E5A0');
  const [notes, setNotes] = useState('');

  // Open modal for Adding Client
  const handleAddClick = () => {
    setEditingClient(null);
    setName('');
    setNiche('Fashion');
    setManager('');
    setColor('#00E5A0');
    setNotes('');
    setModalOpen(true);
  };

  // Open modal for Editing Client
  const handleEditClick = (client) => {
    setEditingClient(client);
    setName(client.name || '');
    setNiche(client.niche || 'Fashion');
    setManager(client.manager || '');
    setColor(client.color || '#00E5A0');
    setNotes(client.notes || '');
    setModalOpen(true);
  };

  // Handle Client Deletion
  const handleDeleteClick = (id, clientName) => {
    if (window.confirm(`Are you sure you want to delete ${clientName}? This will also un-link all its events.`)) {
      dispatch({ type: 'DELETE_CLIENT', payload: id });
      showToast(`${clientName} has been deleted.`, 'success');
    }
  };

  // Submit Client Form
  const handleFormSubmit = (e) => {
    e.preventDefault();

    const sanitizedName = sanitizeTextInput(name);
    if (!sanitizedName) {
      showToast('Client Name is required.', 'error');
      return;
    }

    const clientData = {
      name: sanitizedName,
      niche,
      manager: sanitizeTextInput(manager),
      color,
      notes: sanitizeTextInput(notes),
      deliverables: []
    };

    if (editingClient) {
      // Edit Client
      dispatch({
        type: 'UPDATE_CLIENT',
        payload: { ...editingClient, ...clientData }
      });
      showToast('Client updated successfully ✓', 'success');
    } else {
      // Add Client
      dispatch({
        type: 'ADD_CLIENT',
        payload: { id: `c-${Date.now()}`, ...clientData }
      });
      showToast('Client added successfully ✓', 'success');
    }

    setModalOpen(false);
  };

  const handleClientClickForCalendar = (clientId) => {
    dispatch({ type: 'SET_CALENDAR_FILTER', payload: clientId });
    dispatch({ type: 'SET_NAV', payload: 'calendar' });
  };

  return (
    <div className="page-container">
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="title-large" style={{ margin: 0 }}>Clients</h1>
        <button className="btn btn-primary" onClick={handleAddClick}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Client
        </button>
      </div>

      {/* EMPTY STATE */}
      {clients.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <p className="empty-state-text">No clients yet.</p>
          <button className="btn btn-primary" onClick={handleAddClick}>
            + Add Client
          </button>
        </div>
      ) : (
        /* CLIENTS LIST TABLE */
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Niche</th>
                <th>Manager</th>
                <th>Progress</th>
                <th>Deliverables</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => {
                const activeMonth = settings.currentMonth || new Date().toISOString().substring(0, 7);
                const clientEvents = (events || []).filter(e => e.client === client.id && e.date && e.date.substring(0, 7) === activeMonth);

                const totalD = clientEvents.length;
                const deliveredD = clientEvents.filter(d => d.status === 'delivered').length;
                const progressPct = totalD > 0 ? (deliveredD / totalD) * 100 : 0;

                // Group deliverables count by status for pill display
                const counts = { delivered: 0, pending: 0, 'in-progress': 0, overdue: 0 };
                clientEvents.forEach(e => {
                  const status = e.status || 'pending';
                  if (counts[status] !== undefined) counts[status]++;
                });

                return (
                  <tr key={client.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: client.color || 'var(--accent)' }} />
                        <strong 
                          style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => handleClientClickForCalendar(client.id)}
                          title="Click to view this client's calendar events"
                        >
                          {client.name}
                        </strong>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{client.niche}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{client.manager || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar-track">
                          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{Math.round(progressPct)}%</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginRight: '4px' }}>
                          {deliveredD}/{totalD}
                        </span>
                        {counts.delivered > 0 && <span className="badge badge-delivered">{counts.delivered} delivered</span>}
                        {counts.pending > 0 && <span className="badge badge-pending">{counts.pending} pending</span>}
                        {counts.inProgress > 0 && <span className="badge badge-in-progress">{counts.inProgress} in progress</span>}
                        {counts.overdue > 0 && <span className="badge badge-overdue">{counts.overdue} overdue</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button className="btn-icon" onClick={() => handleEditClick(client)} title="Edit Client">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button className="btn-icon delete" onClick={() => handleDeleteClick(client.id, client.name)} title="Delete Client">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD/EDIT MODAL FORM */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingClient ? 'Edit Client' : 'Add Client'}>
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label htmlFor="client-name">Client Name *</label>
            <input
              id="client-name"
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Zara Home MENA"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="client-niche">Niche</label>
              <select
                id="client-niche"
                className="form-select"
                value={niche}
                onChange={e => setNiche(e.target.value)}
              >
                <option value="Fashion">Fashion</option>
                <option value="F&B">F&B</option>
                <option value="Tech">Tech</option>
                <option value="SaaS">SaaS</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="client-manager">Account Manager</label>
              <input
                id="client-manager"
                type="text"
                className="form-input"
                value={manager}
                onChange={e => setManager(e.target.value)}
                placeholder="e.g. Sara K"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Brand Color</label>
            <div className="color-picker-wrapper">
              <input
                type="color"
                className="color-picker-input"
                value={color}
                onChange={e => setColor(e.target.value)}
              />
              <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{color}</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="client-notes">Notes</label>
            <textarea
              id="client-notes"
              className="form-textarea"
              rows="3"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Campaign notes, brand guidelines..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingClient ? 'Save Changes' : 'Create Client'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
