import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import html2canvas from 'html2canvas';
import { sanitizeCSVCell, sanitizeTextInput } from '../utils/security';
import { getFilteredClients, getFilteredEvents } from '../utils/memberHelpers';

export default function Calendar() {
  const { state, dispatch, showToast } = useApp();
  const { currentUser, isAdmin, isMember } = useAuth();
  const { clients, events, settings } = state;

  // Scope clients & events based on logged-in role
  const scopedClients = getFilteredClients(clients, currentUser);
  const scopedEvents = getFilteredEvents(events, clients, currentUser);

  useEffect(() => {
    const rolePrefix = isMember ? `${currentUser?.name} | ` : '';
    document.title = `${rolePrefix}${settings.agencyName || 'Aleef Concepts'} — Calendar`;
  }, [settings.agencyName, isMember, currentUser]);

  // Calendar view states
  const [viewMonth, setViewMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'list'

  // Modal states
  const [dayDetailsModalOpen, setDayDetailsModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);

  // Form states
  const [eventTitle, setEventTitle] = useState('');
  const [eventClient, setEventClient] = useState('');
  const [eventDeliveredBy, setEventDeliveredBy] = useState('');
  const [eventColor, setEventColor] = useState('#00E5A0');
  const [eventContentType, setEventContentType] = useState('General');
  const [customContentType, setCustomContentType] = useState('');
  const [eventStatus, setEventStatus] = useState('pending');

  // Known team members/deliverers
  const knownDeliverers = Array.from(new Set([
    ...clients.map(c => c.manager).filter(Boolean),
    ...events.map(e => e.deliveredBy).filter(Boolean)
  ])).sort();

  // Export states
  const [exportClientId, setExportClientId] = useState('');
  const [exportPeriod, setExportPeriod] = useState('current');

  // Apply Client filter if set in AppContext state from scopedEvents
  const filteredEvents = state.calendarFilterClient 
    ? scopedEvents.filter(e => e.client === state.calendarFilterClient)
    : scopedEvents;

  // Navigate months
  const handlePrevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  // Format YYYY-MM-DD
  const formatDateString = (d) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  };

  // Check if date is today
  const isToday = (d) => {
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  // Calendar cells generation (42 cells to fill grid)
  const getGridCells = () => {
    const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const startWeekday = firstDay.getDay(); // 0-6 (Sun-Sat)
    
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 0).getDate();
    
    const cells = [];

    // Previous month padding
    for (let i = startWeekday - 1; i >= 0; i--) {
      const dayVal = daysInPrevMonth - i;
      const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, dayVal);
      cells.push({ date, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i);
      cells.push({ date, isCurrentMonth: true });
    }

    // Next month padding to fill 42 cells (6 rows)
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, i);
      cells.push({ date, isCurrentMonth: false });
    }

    return cells;
  };

  // Auto-fill color and manager when client is selected in form
  const handleClientChange = (clientId) => {
    setEventClient(clientId);
    if (clientId) {
      const client = clients.find(c => c.id === clientId);
      if (client && !eventDeliveredBy && client.manager) {
        setEventDeliveredBy(client.manager);
      }
      if (eventContentType === 'General') {
        if (client && client.color) {
          setEventColor(client.color);
        }
      }
    } else {
      if (eventContentType === 'General') {
        setEventColor('#00E5A0');
      }
    }
  };

  const handleContentTypeChange = (type) => {
    setEventContentType(type);
    if (type === 'Reel') {
      setEventColor('#EF4444'); // Red
    } else if (type === 'Poster') {
      setEventColor('#3B82F6'); // Blue
    } else if (type === 'Carousel') {
      setEventColor('#10B981'); // Green
    } else if (type === 'Custom') {
      // Let the user keep the existing color or change it
    } else {
      // General / Other: fall back to client color or default
      if (eventClient) {
        const client = clients.find(c => c.id === eventClient);
        setEventColor(client ? client.color : '#00E5A0');
      } else {
        setEventColor('#00E5A0');
      }
    }
  };

  // Open Form for adding a new event
  const openAddForm = (dateStr) => {
    setEditingEvent(null);
    setSelectedDate(dateStr);
    setEventTitle('');
    setEventClient(state.calendarFilterClient || ''); // Auto-prefill active client if filter is active
    
    const prefillClient = state.calendarFilterClient ? clients.find(c => c.id === state.calendarFilterClient) : null;
    setEventDeliveredBy(prefillClient?.manager || (isMember ? currentUser?.name || '' : ''));

    // Auto-prefill brand color if client is prefilled
    if (prefillClient) {
      setEventColor(prefillClient.color || '#00E5A0');
    } else {
      setEventColor('#00E5A0');
    }
    
    setEventContentType('General');
    setCustomContentType('');
    setEventStatus('pending');
    setDayDetailsModalOpen(false);
    setFormModalOpen(true);
  };

  // Open Form for editing an event
  const openEditForm = (event) => {
    setEditingEvent(event);
    setSelectedDate(event.date);
    setEventTitle(event.title);
    setEventClient(event.client || '');
    const client = clients.find(c => c.id === event.client);
    setEventDeliveredBy(event.deliveredBy || client?.manager || '');
    setEventColor(event.color || '#00E5A0');
    
    const type = event.contentType || 'General';
    if (['General', 'Reel', 'Poster', 'Carousel'].includes(type)) {
      setEventContentType(type);
      setCustomContentType('');
    } else {
      setEventContentType('Custom');
      setCustomContentType(type);
    }
    
    setEventStatus(event.status || 'pending');
    setDayDetailsModalOpen(false);
    setFormModalOpen(true);
  };

  // Delete an event
  const handleDeleteEvent = (id) => {
    if (window.confirm('Delete this event?')) {
      dispatch({ type: 'DELETE_EVENT', payload: id });
      showToast('Event deleted', 'success');
      setDayDetailsModalOpen(false);
    }
  };

  // Submit Event Form
  const handleEventFormSubmit = (e) => {
    e.preventDefault();
    const sanitizedTitle = sanitizeTextInput(eventTitle);
    if (!sanitizedTitle) {
      showToast('Event title is required.', 'error');
      return;
    }

    const sanitizedCustomType = sanitizeTextInput(customContentType);
    if (eventContentType === 'Custom' && !sanitizedCustomType) {
      showToast('Custom content type is required.', 'error');
      return;
    }

    const finalContentType = eventContentType === 'Custom' ? sanitizedCustomType : eventContentType;

    const eventData = {
      title: sanitizedTitle,
      date: selectedDate,
      client: eventClient,
      deliveredBy: sanitizeTextInput(eventDeliveredBy),
      color: eventColor,
      contentType: finalContentType,
      status: eventStatus
    };

    if (editingEvent) {
      dispatch({
        type: 'UPDATE_EVENT',
        payload: { ...editingEvent, ...eventData }
      });
      showToast('Event updated ✓', 'success');
    } else {
      dispatch({
        type: 'ADD_EVENT',
        payload: { id: `e-${Date.now()}`, ...eventData }
      });
      showToast('Event added ✓', 'success');
    }

    setFormModalOpen(false);
  };

  const handleToggleDelivered = (event) => {
    const newStatus = event.status === 'delivered' ? 'pending' : 'delivered';
    const client = clients.find(c => c.id === event.client);
    const updatedDeliveredBy = event.deliveredBy || (newStatus === 'delivered' ? (client?.manager || '') : event.deliveredBy || '');
    dispatch({
      type: 'UPDATE_EVENT',
      payload: { ...event, status: newStatus, deliveredBy: updatedDeliveredBy }
    });
    showToast(`Event status updated to ${newStatus} ✓`, 'success');
  };

  // Cell Click Handler
  const handleCellClick = (date) => {
    const dateStr = formatDateString(date);
    const dayEvents = filteredEvents.filter(e => e.date === dateStr);
    setSelectedDate(dateStr);
    
    if (dayEvents.length > 0) {
      setDayDetailsModalOpen(true);
    } else {
      openAddForm(dateStr);
    }
  };

  // Download Calendar PNG
  const handleDownloadPNG = async () => {
    const element = document.getElementById('calendar-capture-area');
    if (!element) {
      showToast('Calendar element not found', 'error');
      return;
    }
    
    showToast('Generating calendar image...', 'success');
    
    try {
      // Small delay to let toast display
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(element, {
        backgroundColor: window.getComputedStyle(document.body).getPropertyValue('--bg') || '#F9FAFB',
        useCORS: true,
        scale: 2, // Double DPI for high resolution image
        logging: false,
        onclone: (clonedDoc) => {
          const footer = clonedDoc.getElementById('calendar-capture-footer');
          if (footer) {
            footer.style.display = 'flex';
          }
          // Adjust padding and styling for captured element in the clone
          const capturedArea = clonedDoc.getElementById('calendar-capture-area');
          if (capturedArea) {
            capturedArea.style.padding = '2rem';
            capturedArea.style.borderRadius = '16px';
            capturedArea.style.background = window.getComputedStyle(document.body).getPropertyValue('--bg') || '#F9FAFB';
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const filenameMonth = viewMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).replace(' ', '-');
      link.download = `calendar-${filenameMonth}.png`;
      link.href = imgData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Calendar image downloaded ✓', 'success');
    } catch (error) {
      console.error('Error exporting calendar as PNG:', error);
      showToast('Failed to download calendar image', 'error');
    }
  };

  // Download CSV Calendar Data
  const handleDownloadCSV = () => {
    let exportEvents = [...events];
    
    // Filter by client
    if (exportClientId) {
      exportEvents = exportEvents.filter(e => e.client === exportClientId);
    }
    
    // Filter by period
    if (exportPeriod === 'current') {
      const year = viewMonth.getFullYear();
      const month = String(viewMonth.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${month}`;
      exportEvents = exportEvents.filter(e => e.date && e.date.startsWith(prefix));
    }
    
    if (exportEvents.length === 0) {
      showToast('No events found for the selected export filters.', 'error');
      return;
    }

    // Sort events by date ascending
    exportEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Generate CSV content
    const headers = ['Date', 'Title', 'Client/Company', 'Content Type', 'Status', 'Delivered By'];
    const csvRows = [headers.join(',')];

    for (const event of exportEvents) {
      const client = clients.find(c => c.id === event.client);
      const clientName = client ? client.name : 'General (No Client)';
      const delivererName = event.deliveredBy || client?.manager || 'Unassigned';
      
      const values = [
        sanitizeCSVCell(event.date || ''),
        sanitizeCSVCell(event.title || ''),
        sanitizeCSVCell(clientName),
        sanitizeCSVCell(event.contentType || 'General'),
        sanitizeCSVCell(event.status || 'pending'),
        sanitizeCSVCell(delivererName)
      ];
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\r\n');
    
    try {
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      const clientObj = clients.find(c => c.id === exportClientId);
      const clientNameSafe = clientObj ? clientObj.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'all_companies';
      const periodStr = exportPeriod === 'current' 
        ? viewMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).replace(' ', '-').toLowerCase()
        : 'all_time';
        
      link.setAttribute("href", url);
      link.setAttribute("download", `calendar-data-${clientNameSafe}-${periodStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Calendar data exported to CSV ✓', 'success');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showToast('Failed to export CSV file', 'error');
    }
  };

  // Helper lists
  const dayCells = getGridCells();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // List View: Group events by date (ascending)
  const getGroupedEvents = () => {
    // Sort all events by date ascending
    const sorted = [...filteredEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
    const groups = {};
    sorted.forEach(event => {
      if (!groups[event.date]) {
        groups[event.date] = [];
      }
      groups[event.date].push(event);
    });
    return groups;
  };
  const groupedEvents = getGroupedEvents();

  return (
    <div className="page-container">
      {/* CAPTURE WRAPPER FOR PNG DOWNLOAD */}
      <div id="calendar-capture-area" style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '0.25rem' }}>
        {/* HEADER CONTROLS */}
        <div className="calendar-controls">
          <div className="calendar-nav">
            <button data-html2canvas-ignore="true" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={handlePrevMonth}>
              &larr;
            </button>
            <h2>{viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
            <button data-html2canvas-ignore="true" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={handleNextMonth}>
              &rarr;
            </button>
          </div>

          <div className="view-toggle" data-html2canvas-ignore="true">
            <button 
              className={`view-toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month View
            </button>
            <button 
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
          </div>
        </div>

        {/* ACTIVE CLIENT FILTER BANNER */}
        {state.calendarFilterClient && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 1rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-btn)', marginBottom: '1.25rem', animation: 'fadeIn 0.2s ease' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Showing calendar events for: <strong style={{ color: 'var(--accent)' }}>{clients.find(c => c.id === state.calendarFilterClient)?.name || 'Filtered Client'}</strong>
            </span>
            <button 
              data-html2canvas-ignore="true"
              className="btn btn-secondary" 
              style={{ padding: '0.2rem 0.6rem', fontSize: '11px', marginLeft: 'auto' }}
              onClick={() => dispatch({ type: 'SET_CALENDAR_FILTER', payload: null })}
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* MONTH GRID VIEW */}
        {viewMode === 'month' && (
          <div className="calendar-grid">
            {/* Weekday headers */}
            {weekdays.map(wd => (
              <div key={wd} className="calendar-header-cell">{wd}</div>
            ))}

            {/* Days cells */}
            {dayCells.map(({ date, isCurrentMonth }, idx) => {
              const dateStr = formatDateString(date);
              const cellEvents = filteredEvents.filter(e => e.date === dateStr);
              const dayNum = date.getDate();
              const weekdayName = weekdays[date.getDay()];

              return (
                <div
                  key={idx}
                  className={`calendar-day-cell ${!isCurrentMonth ? 'outside-month' : ''} ${isToday(date) ? 'today' : ''}`}
                  onClick={() => handleCellClick(date)}
                >
                  <span className="day-number" data-weekday={weekdayName}>
                    {dayNum}
                  </span>
                  
                  <div className="day-events">
                    {cellEvents.map(event => {
                      const client = clients.find(c => c.id === event.client);
                      const typeLabel = event.contentType && event.contentType !== 'General' 
                        ? `[${event.contentType.charAt(0)}] ` 
                        : '';
                      const clientLabel = client ? `[${client.name}] ` : '';
                      const statusPrefix = event.status === 'delivered' ? '✓ ' : '';
                      return (
                        <div
                          key={event.id}
                          className={`calendar-event-pill ${event.status === 'delivered' ? 'delivered' : ''}`}
                          style={{ backgroundColor: event.color }}
                          title={`${client ? `${client.name} - ` : ''}${event.title} (${event.contentType || 'General'}) [${event.status || 'pending'}]`}
                        >
                          {statusPrefix}{clientLabel}{typeLabel}{event.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LIST VIEW */}
        {viewMode === 'list' && (
          <div className="calendar-list-view">
            {filteredEvents.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">No events scheduled.</p>
                <button data-html2canvas-ignore="true" className="btn btn-primary" onClick={() => openAddForm(formatDateString(new Date()))}>
                  + Add Event
                </button>
              </div>
            ) : (
              Object.keys(groupedEvents).map(dateStr => {
                const d = new Date(dateStr);
                const formattedDate = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
                
                return (
                  <div className="calendar-list-group" key={dateStr}>
                    <div className="calendar-list-date">{formattedDate}</div>
                    {groupedEvents[dateStr].map(event => {
                      const client = clients.find(c => c.id === event.client);
                      return (
                        <div className="calendar-event-card" key={event.id} style={{ borderLeftColor: event.color }}>
                          <div className="calendar-event-info">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span className="calendar-event-title">{event.title}</span>
                              {event.contentType && event.contentType !== 'General' && (
                                <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: event.color, border: `1px solid ${event.color}40`, fontSize: '10px', padding: '1px 6px' }}>
                                  {event.contentType}
                                </span>
                              )}
                              <span className={`badge ${event.status === 'in-progress' ? 'badge-in-progress' : `badge-${event.status || 'pending'}`}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                                {event.status || 'pending'}
                              </span>
                            </div>
                            {client && (
                              <span className="calendar-event-client" style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                <span>Client: <strong style={{ color: 'var(--text)' }}>{client.name}</strong> ({client.niche})</span>
                                {(event.deliveredBy || client.manager) && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text)' }}>
                                    👤 {event.deliveredBy || client.manager}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }} data-html2canvas-ignore="true">
                            <button className="btn-icon" onClick={() => openEditForm(event)}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button className="btn-icon delete" onClick={() => handleDeleteEvent(event.id)}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
            {filteredEvents.length > 0 && (
              <button data-html2canvas-ignore="true" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '1rem' }} onClick={() => openAddForm(formatDateString(new Date()))}>
                + Add Event
              </button>
            )}
          </div>
        )}

        {/* CAPTURE-ONLY FOOTER */}
        <div id="calendar-capture-footer" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>{settings.agencyName || 'Aleef Concepts'} Portal</span>
          <span>Generated on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* EXPORT AND DOWNLOAD TOOLS SECTION */}
      <div className="card export-card" style={{ marginTop: '2.5rem', padding: '1.75rem' }} data-html2canvas-ignore="true">
        <div className="export-card-header" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="export-icon-container" style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text)', margin: 0, fontWeight: '600' }}>Export & Download Tools</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Save calendar schedules or download company reports</p>
          </div>
        </div>

        <div className="export-grid">
          {/* IMAGE EXPORT SECTION */}
          <div className="export-panel-section">
            <div>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.5rem', fontWeight: '500' }}>Download Calendar Preview</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '1.25rem' }}>
                Capture the current monthly or list view of the calendar as a high-resolution PNG image, ideal for sharing with clients or team members.
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleDownloadPNG} style={{ alignSelf: 'flex-start' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              Download Calendar PNG
            </button>
          </div>

          {/* CSV DATA EXPORT SECTION */}
          <div className="export-panel-section">
            <div>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.5rem', fontWeight: '500' }}>Export Company Calendar Data</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '1.25rem' }}>
                Download structured calendar event data in CSV format. You can filter by a specific client/company or download the entire calendar log.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '130px' }}>
                  <label htmlFor="export-client" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase' }}>Company</label>
                  <select 
                    id="export-client" 
                    className="form-select" 
                    value={exportClientId} 
                    onChange={e => setExportClientId(e.target.value)}
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                  >
                    <option value="">All Companies</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ flex: '1', minWidth: '130px' }}>
                  <label htmlFor="export-period" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase' }}>Period</label>
                  <select 
                    id="export-period" 
                    className="form-select" 
                    value={exportPeriod} 
                    onChange={e => setExportPeriod(e.target.value)}
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                  >
                    <option value="current">Current Month ({viewMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>
            </div>
            
            <button className="btn btn-secondary" onClick={handleDownloadCSV} style={{ alignSelf: 'flex-start' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Export CSV Data
            </button>
          </div>
        </div>
      </div>

      {/* SELECTED DAY DETAILS / LIST MODAL */}
      <Modal isOpen={dayDetailsModalOpen} onClose={() => setDayDetailsModalOpen(false)} title={`Events for ${selectedDate}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredEvents.filter(e => e.date === selectedDate).map(event => {
              const client = clients.find(c => c.id === event.client);
              return (
                <div key={event.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: '6px', borderLeft: `3px solid ${event.color}` }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ color: 'var(--text)', fontSize: '0.95rem' }}>{event.title}</strong>
                      {event.contentType && event.contentType !== 'General' && (
                        <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: event.color, border: `1px solid ${event.color}40`, fontSize: '10px', padding: '1px 6px' }}>
                          {event.contentType}
                        </span>
                      )}
                      <span className={`badge ${event.status === 'in-progress' ? 'badge-in-progress' : `badge-${event.status || 'pending'}`}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {event.status || 'pending'}
                      </span>
                    </div>
                    {client && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span>Client: <strong style={{ color: 'var(--text)' }}>{client.name}</strong> ({client.niche})</span>
                        {(event.deliveredBy || client.manager) && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--surface-1, rgba(255,255,255,0.05))', padding: '2px 6px', borderRadius: '4px', color: 'var(--text)' }}>
                            👤 Delivered By: <strong style={{ color: 'var(--teal)' }}>{event.deliveredBy || client.manager}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleToggleDelivered(event)} 
                      title={event.status === 'delivered' ? "Mark Pending" : "Mark Delivered"}
                      style={{ 
                        color: event.status === 'delivered' ? 'var(--teal)' : 'color-mix(in srgb, var(--text) 40%, transparent)',
                        backgroundColor: event.status === 'delivered' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                        borderRadius: '4px',
                        padding: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </button>
                    <button className="btn-icon" onClick={() => openEditForm(event)} title="Edit Event">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button className="btn-icon delete" onClick={() => handleDeleteEvent(event.id)} title="Delete Event">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setDayDetailsModalOpen(false)}>Close</button>
            <button className="btn btn-primary" onClick={() => openAddForm(selectedDate)}>+ Add Event</button>
          </div>
        </div>
      </Modal>

      {/* EVENT FORM MODAL */}
      <Modal isOpen={formModalOpen} onClose={() => setFormModalOpen(false)} title={editingEvent ? 'Edit Event' : 'Add Event'}>
        <form onSubmit={handleEventFormSubmit}>
          <div className="form-group">
            <label htmlFor="event-date">Date</label>
            <input
              id="event-date"
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="event-title">Event Title *</label>
            <input
              id="event-title"
              type="text"
              className="form-input"
              value={eventTitle}
              onChange={e => setEventTitle(e.target.value)}
              placeholder="e.g. Weekly Strategy Meeting"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="event-client">Client</label>
            <select
              id="event-client"
              className="form-select"
              value={eventClient}
              onChange={e => handleClientChange(e.target.value)}
            >
              <option value="">No Client (General)</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="event-content-type">Content Type</label>
            <select
              id="event-content-type"
              className="form-select"
              value={eventContentType}
              onChange={e => handleContentTypeChange(e.target.value)}
            >
              <option value="General">General / Other</option>
              <option value="Reel">Reel (Red)</option>
              <option value="Poster">Poster (Blue)</option>
              <option value="Carousel">Carousel (Green)</option>
              <option value="Custom">Custom...</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="event-delivered-by">Delivered By / Assignee</label>
            <input
              id="event-delivered-by"
              list="known-deliverers"
              type="text"
              className="form-input"
              value={eventDeliveredBy}
              onChange={e => setEventDeliveredBy(e.target.value)}
              placeholder="e.g. Adarsh, Sarah, Video Editor"
            />
            <datalist id="known-deliverers">
              {knownDeliverers.map(d => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label htmlFor="event-status">Delivery Status</label>
            <select
              id="event-status"
              className="form-select"
              value={eventStatus}
              onChange={e => setEventStatus(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="delivered">Delivered</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {eventContentType === 'Custom' && (
            <div className="form-group">
              <label htmlFor="event-custom-content-type">Custom Content Type *</label>
              <input
                id="event-custom-content-type"
                type="text"
                className="form-input"
                value={customContentType}
                onChange={e => setCustomContentType(e.target.value)}
                placeholder="e.g. Newsletter, Blog Post, Video"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Event Color</label>
            <div className="color-picker-wrapper">
              <input
                type="color"
                className="color-picker-input"
                value={eventColor}
                onChange={e => setEventColor(e.target.value)}
              />
              <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{eventColor}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setFormModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingEvent ? 'Save Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
