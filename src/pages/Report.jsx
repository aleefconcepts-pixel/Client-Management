import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import HealthGauge from '../components/charts/HealthGauge';

export default function Report() {
  const { state, dispatch } = useApp();
  const { clients, events, settings } = state;

  // Local report month state, initialized from settings
  const [reportMonth, setReportMonth] = useState(settings.currentMonth || new Date().toISOString().substring(0, 7));
  
  // Client/Company filter state
  const [filterClient, setFilterClient] = useState('All');

  // Sorting state
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    document.title = `${settings.agencyName || 'Aleef Concepts'} — Monthly Report`;
    if (settings.currentMonth) {
      setReportMonth(settings.currentMonth);
    }
  }, [settings]);

  // Helper to format month picker value to "Month Name YYYY"
  const getFormattedMonthName = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Sync month picker back to global settings when changed
  const handleMonthChange = (e) => {
    const newMonth = e.target.value;
    setReportMonth(newMonth);
    dispatch({ type: 'UPDATE_SETTINGS', payload: { currentMonth: newMonth } });
  };

  // Filter clients based on selection
  const activeClients = filterClient === 'All'
    ? clients
    : clients.filter(c => c.id === filterClient);

  // Get calendar events for the selected month
  const monthEvents = (events || []).filter(e => e.date && e.date.substring(0, 7) === reportMonth);

  // Filter events based on company selection
  const filteredEvents = filterClient === 'All'
    ? monthEvents
    : monthEvents.filter(e => e.client === filterClient);

  // Compute aggregated totals from filteredEvents
  const totalDeliverables = filteredEvents.length;
  const delivered = filteredEvents.filter(d => d.status === 'delivered').length;
  const pending = filteredEvents.filter(d => d.status === 'pending').length;
  const inProgress = filteredEvents.filter(d => d.status === 'in-progress').length;
  const overdue = filteredEvents.filter(d => d.status === 'overdue').length;

  // Group filteredEvents by Content Type dynamically
  const contentTypeData = {};
  filteredEvents.forEach(e => {
    const type = e.contentType || 'General';
    if (!contentTypeData[type]) {
      contentTypeData[type] = { total: 0, delivered: 0 };
    }
    contentTypeData[type].total++;
    if (e.status === 'delivered') {
      contentTypeData[type].delivered++;
    }
  });

  const getContentTypeColor = (type) => {
    if (type === 'Reel') return '#EF4444'; // Red
    if (type === 'Poster') return '#3B82F6'; // Blue
    if (type === 'Carousel') return '#10B981'; // Green
    if (type === 'General') return '#6B7280'; // Gray
    if (type === 'TikTok') return '#EC4899'; // Pink
    if (type === 'Newsletter') return '#8B5CF6'; // Purple
    return 'var(--accent)'; // Default theme red/accent
  };

  // Sorting implementation
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (column) => {
    if (sortColumn !== column) return ' ↕';
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const getClientValueForSort = (client, col) => {
    const clientEvents = monthEvents.filter(e => e.client === client.id);
    switch (col) {
      case 'name':
        return client.name.toLowerCase();
      case 'manager':
        return (client.manager || '').toLowerCase();
      case 'delivered':
        return clientEvents.filter(e => e.status === 'delivered').length;
      case 'pending':
        return clientEvents.filter(e => e.status === 'pending').length;
      case 'inprogress':
        return clientEvents.filter(e => e.status === 'in-progress').length;
      case 'overdue':
        return clientEvents.filter(e => e.status === 'overdue').length;
      case 'health':
        const tot = clientEvents.length;
        const del = clientEvents.filter(e => e.status === 'delivered').length;
        return tot > 0 ? (del / tot) * 100 : 100;
      default:
        return 0;
    }
  };

  const sortedClients = [...activeClients].sort((a, b) => {
    const valA = getClientValueForSort(a, sortColumn);
    const valB = getClientValueForSort(b, sortColumn);

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="page-container">
      {/* HEADER WITH MONTH PICKER & CLIENT FILTER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <h1 className="title-large" style={{ margin: 0 }}>Monthly Report</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="report-month-picker" style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>MONTH:</label>
            <input
              id="report-month-picker"
              type="month"
              className="form-input"
              style={{ width: '150px', padding: '0.4rem 0.6rem' }}
              value={reportMonth}
              onChange={handleMonthChange}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="report-client-filter" style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMPANY:</label>
            <select
              id="report-client-filter"
              className="form-select"
              style={{ width: '180px', padding: '0.4rem 0.6rem' }}
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
            >
              <option value="All">All Companies</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* HEALTH GAUGE IN TOP CENTER */}
      <div className="card" style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '600px', width: '100%', margin: '0 auto 2.5rem auto' }}>
        <HealthGauge delivered={delivered} total={totalDeliverables} />
      </div>

      {/* SUMMARY GRID CARDS */}
      <div className="summary-grid">
        <div className="card summary-card">
          <span className="label">Filtered Clients</span>
          <span className="number">{activeClients.length}</span>
        </div>
        <div className="card summary-card">
          <span className="label">Total Deliverables</span>
          <span className="number">{totalDeliverables}</span>
        </div>
        <div className="card summary-card">
          <span className="label" style={{ color: 'var(--teal)' }}>Delivered</span>
          <span className="number" style={{ color: 'var(--teal)' }}>{delivered}</span>
        </div>
        <div className="card summary-card">
          <span className="label" style={{ color: 'var(--warning)' }}>Pending</span>
          <span className="number" style={{ color: 'var(--warning)' }}>{pending}</span>
        </div>
        <div className="card summary-card">
          <span className="label" style={{ color: 'var(--accent)' }}>In Progress</span>
          <span className="number" style={{ color: 'var(--accent)' }}>{inProgress}</span>
        </div>
        <div className="card summary-card">
          <span className="label" style={{ color: 'var(--danger)' }}>Overdue</span>
          <span className="number" style={{ color: 'var(--danger)' }}>{overdue}</span>
        </div>
      </div>

      {/* CONTENT TYPE ANALYSIS SECTION */}
      <h2 style={{ fontSize: '1.25rem', marginTop: '2.5rem', marginBottom: '1rem', fontFamily: 'Space Grotesk' }}>Content Type Delivery Breakdown</h2>
      {Object.keys(contentTypeData).length === 0 ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No content items scheduled for this month.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {Object.keys(contentTypeData).map(type => {
            const data = contentTypeData[type];
            const pct = data.total > 0 ? (data.delivered / data.total) * 100 : 100;
            const color = getContentTypeColor(type);
            return (
              <div className="card" key={type} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                  <strong style={{ fontSize: '14px', color: 'var(--text)' }}>{type}</strong>
                  <span className="badge" style={{ marginLeft: 'auto', background: `${color}15`, color: color, border: `1px solid ${color}30` }}>
                    {Math.round(pct)}%
                  </span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)', fontFamily: 'Space Grotesk' }}>
                  {data.delivered} <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text-muted)' }}>Delivered</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {data.delivered} of {data.total} completed
                </div>
                <div className="progress-bar-track" style={{ width: '100%', marginTop: '6px' }}>
                  <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CLIENT-WISE BREAKDOWN SECTION */}
      <h2 style={{ fontSize: '1.25rem', marginTop: '2.5rem', marginBottom: '1rem', fontFamily: 'Space Grotesk' }}>Client-Wise Content Type Breakdown</h2>
      {activeClients.length === 0 ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No clients available.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {activeClients.map(client => {
            const clientEvents = monthEvents.filter(e => e.client === client.id);
            if (clientEvents.length === 0) {
              return (
                <div className="card" key={client.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.75 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: client.color || 'var(--accent)' }} />
                    <strong style={{ color: 'var(--text)' }}>{client.name}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No content scheduled for this month.
                  </div>
                </div>
              );
            }

            // Group by content type for this client
            const clientTypeCounts = {};
            clientEvents.forEach(e => {
              const type = e.contentType || 'General';
              if (!clientTypeCounts[type]) {
                clientTypeCounts[type] = { total: 0, delivered: 0 };
              }
              clientTypeCounts[type].total++;
              if (e.status === 'delivered') {
                clientTypeCounts[type].delivered++;
              }
            });

            const totalEvents = clientEvents.length;
            const totalDelivered = clientEvents.filter(e => e.status === 'delivered').length;
            const overallPct = Math.round((totalDelivered / totalEvents) * 100);

            return (
              <div className="card" key={client.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: `4px solid ${client.color || 'var(--accent)'}` }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text)', fontFamily: 'Space Grotesk' }}>{client.name}</h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mgr: {client.manager || '—'} • {client.niche}</span>
                  </div>
                  <span className="badge badge-delivered" style={{ fontSize: '12px', padding: '0.25rem 0.5rem' }}>
                    {totalDelivered}/{totalEvents} ({overallPct}%)
                  </span>
                </div>

                {/* Progress Bar of client's total */}
                <div className="progress-bar-track" style={{ width: '100%', height: '6px' }}>
                  <div className="progress-bar-fill" style={{ width: `${overallPct}%`, background: client.color || 'var(--accent)' }} />
                </div>

                {/* Content Type Breakdown list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                  {Object.keys(clientTypeCounts).map(type => {
                    const data = clientTypeCounts[type];
                    const pct = Math.round((data.delivered / data.total) * 100);
                    const color = getContentTypeColor(type);
                    return (
                      <div key={type} style={{ fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text)' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
                            {type}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                            {data.delivered} of {data.total} delivered ({pct}%)
                          </span>
                        </div>
                        <div className="progress-bar-track" style={{ width: '100%', height: '4px' }}>
                          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Content Items List */}
                <div style={{ marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                    Scheduled Content Items
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {clientEvents.map(event => {
                      const eventColor = getContentTypeColor(event.contentType);
                      return (
                        <div key={event.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--surface-2)', borderRadius: '4px', fontSize: '11px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '70%' }}>
                            <span style={{ fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={event.title}>
                              {event.title}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              Type: <strong style={{ color: eventColor }}>{event.contentType || 'General'}</strong> • Date: {event.date}
                            </span>
                          </div>
                          <span className={`badge ${event.status === 'in-progress' ? 'badge-in-progress' : `badge-${event.status || 'pending'}`}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                            {event.status || 'pending'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PER-CLIENT TABLE */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontFamily: 'Space Grotesk' }}>Client Health Details</h2>
      
      {activeClients.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">No clients available to generate details.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('name')}>
                  Client{getSortIndicator('name')}
                </th>
                <th className="sortable" onClick={() => handleSort('manager')}>
                  Manager{getSortIndicator('manager')}
                </th>
                <th className="sortable" onClick={() => handleSort('delivered')} style={{ textAlign: 'center' }}>
                  ✓ Del{getSortIndicator('delivered')}
                </th>
                <th className="sortable" onClick={() => handleSort('pending')} style={{ textAlign: 'center' }}>
                  ⏳ Pending{getSortIndicator('pending')}
                </th>
                <th className="sortable" onClick={() => handleSort('inprogress')} style={{ textAlign: 'center' }}>
                  🔄 In Progress{getSortIndicator('inprogress')}
                </th>
                <th className="sortable" onClick={() => handleSort('overdue')} style={{ textAlign: 'center' }}>
                  ❌ Overdue{getSortIndicator('overdue')}
                </th>
                <th className="sortable" onClick={() => handleSort('health')} style={{ textAlign: 'right' }}>
                  Health %{getSortIndicator('health')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedClients.map(client => {
                const clientEvents = monthEvents.filter(e => e.client === client.id);
                const tot = clientEvents.length;
                const del = clientEvents.filter(e => e.status === 'delivered').length;
                const pend = clientEvents.filter(e => e.status === 'pending').length;
                const prog = clientEvents.filter(e => e.status === 'in-progress').length;
                const over = clientEvents.filter(e => e.status === 'overdue').length;
                const healthPct = tot > 0 ? Math.round((del / tot) * 100) : 100;

                // Color coding badge classes for client health
                let healthClass = 'badge-delivered'; // Default teal > 70%
                if (healthPct < 40) {
                  healthClass = 'badge-overdue'; // Danger < 40%
                } else if (healthPct <= 70) {
                  healthClass = 'badge-pending'; // Warning 40-70%
                }

                return (
                  <tr key={client.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: client.color || 'var(--accent)' }} />
                        <strong style={{ color: 'var(--text)' }}>{client.name}</strong>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{client.manager || '—'}</td>
                    <td style={{ textAlign: 'center', color: 'var(--teal)', fontWeight: 600 }}>{del}</td>
                    <td style={{ textAlign: 'center', color: 'var(--warning)', fontWeight: 600 }}>{pend}</td>
                    <td style={{ textAlign: 'center', color: 'var(--accent)', fontWeight: 600 }}>{prog}</td>
                    <td style={{ textAlign: 'center', color: 'var(--danger)', fontWeight: 600 }}>{over}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge ${healthClass}`} style={{ fontSize: '13px', padding: '0.25rem 0.6rem' }}>
                        {healthPct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* FOOTER NOTE */}
      <footer style={{ marginTop: '2.5rem', textAlign: 'center' }}>
        <p className="text-muted" style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
          Report generated for {getFormattedMonthName(reportMonth)}. Data reflects current delivery status.
        </p>
      </footer>
    </div>
  );
}
