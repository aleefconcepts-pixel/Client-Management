import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import BarChart from '../components/charts/BarChart';
import DonutChart from '../components/charts/DonutChart';
import Modal from '../components/Modal';
import { sanitizeCSVCell, sanitizeTextInput } from '../utils/security';

export default function Dashboard() {
  const { state, dispatch, showToast } = useApp();
  const { clients, events, settings } = state;

  useEffect(() => {
    document.title = `${settings.agencyName || 'Aleef Concepts'} — Dashboard`;
  }, [settings.agencyName]);

  // Helper to format Date to YYYY-MM-DD
  const formatDateString = (d) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  };

  // State for Daily Report selected date (defaults to today)
  const [selectedDate, setSelectedDate] = useState(() => formatDateString(new Date()));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contributorFilter, setContributorFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

  // Modal for quick assigning / updating deliverer
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editingDelivererEvent, setEditingDelivererEvent] = useState(null);
  const [assignedPersonName, setAssignedPersonName] = useState('');

  // Helper to format settings.currentMonth (YYYY-MM) to Month Name YYYY
  const formatMonthName = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Helper to format readable date string e.g. "Wednesday, September 2, 2026"
  const formatReadableDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(num => parseInt(num, 10));
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Content type colors
  const getContentTypeColor = (type) => {
    if (type === 'Reel') return '#EF4444';
    if (type === 'Poster') return '#3B82F6';
    if (type === 'Carousel') return '#10B981';
    if (type === 'General') return '#6B7280';
    if (type === 'TikTok') return '#EC4899';
    if (type === 'Newsletter') return '#8B5CF6';
    return 'var(--accent)';
  };

  // Deterministic Avatar Color & Initials
  const getAvatarGradient = (name) => {
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

  const getInitials = (name) => {
    if (!name || name === 'Unassigned') return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Compute monthly stats
  const activeMonth = settings.currentMonth || new Date().toISOString().substring(0, 7);
  const monthEvents = (events || []).filter(e => e.date && e.date.substring(0, 7) === activeMonth);

  const totalClients = clients.length;
  const totalDeliverables = monthEvents.length;
  const delivered = monthEvents.filter(d => d.status === 'delivered').length;
  const pending = monthEvents.filter(d => d.status === 'pending').length;
  const inProgress = monthEvents.filter(d => d.status === 'in-progress').length;
  const overdue = monthEvents.filter(d => d.status === 'overdue').length;

  // Known team members/deliverers
  const knownDeliverers = Array.from(new Set([
    ...clients.map(c => c.manager).filter(Boolean),
    ...events.map(e => e.deliveredBy).filter(Boolean)
  ])).sort();

  // Selected Day Calculations
  const dailyEvents = (events || []).filter(e => e.date === selectedDate);
  const dailyDelivered = dailyEvents.filter(d => d.status === 'delivered');
  const dailyPending = dailyEvents.filter(d => d.status === 'pending');
  const dailyInProgress = dailyEvents.filter(d => d.status === 'in-progress');
  const dailyOverdue = dailyEvents.filter(d => d.status === 'overdue');
  const dailyTotal = dailyEvents.length;
  const dailyDeliveredCount = dailyDelivered.length;
  const dailyCompletionRate = dailyTotal > 0 ? Math.round((dailyDeliveredCount / dailyTotal) * 100) : 0;

  // Group daily events by contributor (who delivered or is assigned)
  const contributorMap = {};
  dailyEvents.forEach(event => {
    const client = clients.find(c => c.id === event.client);
    const delivererName = event.deliveredBy || client?.manager || 'Unassigned';

    if (!contributorMap[delivererName]) {
      contributorMap[delivererName] = {
        name: delivererName,
        total: 0,
        delivered: 0,
        pending: 0,
        inProgress: 0,
        overdue: 0,
        items: []
      };
    }

    contributorMap[delivererName].total++;
    if (event.status === 'delivered') contributorMap[delivererName].delivered++;
    else if (event.status === 'pending') contributorMap[delivererName].pending++;
    else if (event.status === 'in-progress') contributorMap[delivererName].inProgress++;
    else if (event.status === 'overdue') contributorMap[delivererName].overdue++;

    contributorMap[delivererName].items.push(event);
  });

  const contributorsList = Object.values(contributorMap).sort((a, b) => b.delivered - a.delivered || b.total - a.total);
  const activeDeliverersCount = contributorsList.filter(c => c.delivered > 0).length;
  const topDeliverer = contributorsList.find(c => c.delivered > 0);

  // Filtered Daily Events for the Table
  const filteredDailyEvents = dailyEvents.filter(event => {
    const client = clients.find(c => c.id === event.client);
    const deliverer = event.deliveredBy || client?.manager || 'Unassigned';

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = (event.title || '').toLowerCase().includes(term);
      const matchClient = (client?.name || '').toLowerCase().includes(term);
      const matchDeliverer = deliverer.toLowerCase().includes(term);
      const matchType = (event.contentType || '').toLowerCase().includes(term);
      if (!matchTitle && !matchClient && !matchDeliverer && !matchType) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'delivered' && event.status !== 'delivered') return false;
      if (statusFilter === 'pending' && event.status !== 'pending') return false;
      if (statusFilter === 'in-progress' && event.status !== 'in-progress') return false;
      if (statusFilter === 'overdue' && event.status !== 'overdue') return false;
    }

    // Contributor filter
    if (contributorFilter !== 'all' && deliverer !== contributorFilter) {
      return false;
    }

    // Client filter
    if (clientFilter !== 'all' && event.client !== clientFilter) {
      return false;
    }

    return true;
  });

  // Date Navigation handlers
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(n => parseInt(n, 10));
    const prev = new Date(y, m - 1, d - 1);
    setSelectedDate(formatDateString(prev));
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(n => parseInt(n, 10));
    const next = new Date(y, m - 1, d + 1);
    setSelectedDate(formatDateString(next));
  };

  const handleToday = () => {
    setSelectedDate(formatDateString(new Date()));
  };

  // Toggle delivery status
  const handleToggleDelivered = (event) => {
    const newStatus = event.status === 'delivered' ? 'pending' : 'delivered';
    const client = clients.find(c => c.id === event.client);
    const updatedDeliverer = event.deliveredBy || (newStatus === 'delivered' ? (client?.manager || '') : event.deliveredBy || '');
    dispatch({
      type: 'UPDATE_EVENT',
      payload: { ...event, status: newStatus, deliveredBy: updatedDeliverer }
    });
    showToast(`Deliverable marked as ${newStatus} ✓`, 'success');
  };

  // Open quick assign deliverer modal
  const handleOpenAssignModal = (event) => {
    const client = clients.find(c => c.id === event.client);
    setEditingDelivererEvent(event);
    setAssignedPersonName(event.deliveredBy || client?.manager || '');
    setAssignModalOpen(true);
  };

  const handleSaveDeliverer = (e) => {
    e.preventDefault();
    if (!editingDelivererEvent) return;

    const sanitizedDeliverer = sanitizeTextInput(assignedPersonName);
    dispatch({
      type: 'UPDATE_EVENT',
      payload: { ...editingDelivererEvent, deliveredBy: sanitizedDeliverer }
    });
    showToast(`Delivered By updated to "${sanitizedDeliverer || 'Unassigned'}" ✓`, 'success');
    setAssignModalOpen(false);
  };

  // Copy standup daily report text
  const handleCopyDailyReport = () => {
    let reportText = `📊 DAILY DELIVERY REPORT — ${formatReadableDate(selectedDate)}\n`;
    reportText += `Agency: ${settings.agencyName || 'Aleef Concepts'}\n`;
    reportText += `Delivered: ${dailyDeliveredCount}/${dailyTotal} items (${dailyCompletionRate}%)\n\n`;

    if (contributorsList.length === 0) {
      reportText += `No items scheduled for this day.`;
    } else {
      reportText += `👥 WHO DELIVERED TODAY:\n`;
      contributorsList.forEach(c => {
        const deliveredItems = c.items.filter(i => i.status === 'delivered');
        if (deliveredItems.length > 0) {
          reportText += `• ${c.name} (${deliveredItems.length} delivered):\n`;
          deliveredItems.forEach(item => {
            const cl = clients.find(clt => clt.id === item.client);
            reportText += `  ✓ [${item.contentType || 'General'}] ${item.title}${cl ? ` (${cl.name})` : ''}\n`;
          });
        }
      });

      const pendingItems = dailyEvents.filter(i => i.status !== 'delivered');
      if (pendingItems.length > 0) {
        reportText += `\n⏳ PENDING / IN-PROGRESS ITEMS (${pendingItems.length}):\n`;
        pendingItems.forEach(item => {
          const cl = clients.find(clt => clt.id === item.client);
          const by = item.deliveredBy || cl?.manager || 'Unassigned';
          reportText += `  • [${item.status}] ${item.title}${cl ? ` - ${cl.name}` : ''} (Assignee: ${by})\n`;
        });
      }
    }

    navigator.clipboard.writeText(reportText).then(() => {
      showToast('Daily Report copied to clipboard ✓', 'success');
    }).catch(() => {
      showToast('Failed to copy report to clipboard', 'error');
    });
  };

  // Export Daily CSV
  const handleDownloadDailyCSV = () => {
    if (dailyEvents.length === 0) {
      showToast('No events to export for this day', 'error');
      return;
    }

    const headers = ['Date', 'Title', 'Client', 'Content Type', 'Status', 'Delivered By'];
    const csvRows = [headers.join(',')];

    dailyEvents.forEach(event => {
      const client = clients.find(c => c.id === event.client);
      const clientName = client ? client.name : 'General (No Client)';
      const delivererName = event.deliveredBy || client?.manager || 'Unassigned';

      const row = [
        sanitizeCSVCell(event.date || selectedDate),
        sanitizeCSVCell(event.title || ''),
        sanitizeCSVCell(clientName),
        sanitizeCSVCell(event.contentType || 'General'),
        sanitizeCSVCell(event.status || 'pending'),
        sanitizeCSVCell(delivererName)
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daily-report-${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Daily CSV exported ✓', 'success');
  };

  // Build Monthly Days Timeline Strip for the active month of selectedDate
  const [selectedYear, selectedMonth] = selectedDate.split('-').map(n => parseInt(n, 10));
  const daysInSelectedMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const monthDaysList = [];
  const todayStr = formatDateString(new Date());

  for (let dayNum = 1; dayNum <= daysInSelectedMonth; dayNum++) {
    const dayStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dateObj = new Date(selectedYear, selectedMonth - 1, dayNum);
    const dayAbbr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dayEvents = (events || []).filter(e => e.date === dayStr);
    const dayDelivered = dayEvents.filter(d => d.status === 'delivered').length;
    const dayPending = dayEvents.filter(d => d.status === 'pending' || d.status === 'in-progress').length;

    monthDaysList.push({
      dateStr: dayStr,
      dayNum,
      dayAbbr,
      totalEvents: dayEvents.length,
      deliveredCount: dayDelivered,
      pendingCount: dayPending,
      isSelected: dayStr === selectedDate,
      isToday: dayStr === todayStr
    });
  }

  return (
    <div className="page-container">
      {/* SECTION 1 - Greeting & Month */}
      <h1 className="title-large">Good morning, {settings.agencyName}</h1>
      <p className="subtitle">{formatMonthName(settings.currentMonth)}</p>

      {/* SECTION 2 - Monthly Summary Cards */}
      <div className="summary-grid">
        <div className="card summary-card">
          <span className="label">Total Clients</span>
          <span className="number">{totalClients}</span>
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

      {/* SECTION 3 - Charts Row */}
      <div className="charts-grid">
        <div className="card chart-card">
          <h2 className="chart-title">Client Work Progress</h2>
          <BarChart />
        </div>
        <div className="card chart-card">
          <h2 className="chart-title">Deliverables Breakdown</h2>
          <DonutChart />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4 - DAILY REPORTS & WHO DELIVERED                                 */}
      {/* ========================================================================= */}
      <section className="daily-reports-section" id="daily-reports-section">
        {/* HEADER & DATE CONTROLS */}
        <div className="daily-header-container">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.45rem', margin: 0, fontFamily: 'Space Grotesk' }}>
                Daily Delivery Reports
              </h2>
              <span className="badge badge-delivered" style={{ fontSize: '11px', padding: '2px 8px' }}>
                {dailyDeliveredCount} Delivered Today
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Track how many items are delivered each day and who delivered them
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Quick date navigator */}
            <div className="daily-date-nav">
              <button 
                type="button" 
                className="daily-date-btn" 
                onClick={handlePrevDay} 
                title="Previous Day"
                aria-label="Previous Day"
              >
                ◀
              </button>
              <button 
                type="button" 
                className={`daily-date-btn ${selectedDate === todayStr ? 'active' : ''}`} 
                onClick={handleToday}
              >
                Today
              </button>
              <button 
                type="button" 
                className="daily-date-btn" 
                onClick={handleNextDay} 
                title="Next Day"
                aria-label="Next Day"
              >
                ▶
              </button>
              <input
                type="date"
                className="form-input"
                style={{ padding: '0.3rem 0.5rem', fontSize: '0.825rem', width: '135px', border: 'none', background: 'transparent' }}
                value={selectedDate}
                onChange={e => e.target.value && setSelectedDate(e.target.value)}
              />
            </div>

            {/* Standup Export Actions */}
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleCopyDailyReport}
              style={{ fontSize: '0.825rem', padding: '0.45rem 0.8rem' }}
              title="Copy formatted standup summary to clipboard"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy Summary
            </button>

            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleDownloadDailyCSV}
              style={{ fontSize: '0.825rem', padding: '0.45rem 0.8rem' }}
              title="Download daily deliverables CSV"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              CSV
            </button>
          </div>
        </div>

        {/* MONTHLY DAILY TIMELINE STRIP */}
        <div className="daily-strip-wrapper">
          <div className="daily-strip-header">
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Timeline
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Active Day: <strong style={{ color: 'var(--accent)' }}>{formatReadableDate(selectedDate)}</strong>
            </span>
          </div>

          <div className="daily-strip-scroll">
            {monthDaysList.map(day => (
              <div
                key={day.dateStr}
                className={`daily-strip-day ${day.isSelected ? 'selected' : ''} ${day.isToday ? 'today' : ''}`}
                onClick={() => setSelectedDate(day.dateStr)}
                title={`${day.dateStr}: ${day.deliveredCount} delivered, ${day.totalEvents} total`}
              >
                <span className="day-abbr">{day.dayAbbr}</span>
                <span className="day-num">{day.dayNum}</span>
                {day.deliveredCount > 0 ? (
                  <span className="delivery-dot">{day.deliveredCount} ✓</span>
                ) : day.totalEvents > 0 ? (
                  <span className="delivery-dot" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
                    {day.totalEvents} ⏳
                  </span>
                ) : (
                  <span className="empty-dot">—</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* DAILY KPI METRICS */}
        <div className="daily-kpi-grid">
          {/* Total Delivered Today */}
          <div className="daily-kpi-card delivered">
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Items Delivered Today
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2.1rem', fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--teal)', lineHeight: 1 }}>
                {dailyDeliveredCount}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                of {dailyTotal} items ({dailyCompletionRate}%)
              </span>
            </div>
            <div className="progress-bar-track" style={{ width: '100%', height: '5px', marginTop: '4px' }}>
              <div className="progress-bar-fill" style={{ width: `${dailyCompletionRate}%`, background: 'var(--teal)' }} />
            </div>
          </div>

          {/* Pending / Remaining */}
          <div className="daily-kpi-card pending">
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Pending & In Progress
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2.1rem', fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--warning)', lineHeight: 1 }}>
                {dailyPending.length + dailyInProgress.length}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {dailyOverdue.length > 0 ? `(${dailyOverdue.length} overdue)` : 'scheduled'}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {dailyPending.length} pending • {dailyInProgress.length} in progress
            </span>
          </div>

          {/* Active Deliverers Today */}
          <div className="daily-kpi-card team">
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Active Deliverers
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2.1rem', fontFamily: 'Space Grotesk', fontWeight: 700, color: '#6366F1', lineHeight: 1 }}>
                {activeDeliverersCount}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                team members
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {contributorsList.length} assigned contributors total
            </span>
          </div>

          {/* Top Deliverer of the Day */}
          <div className="daily-kpi-card top">
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Top Deliverer
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              {topDeliverer ? (
                <>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: getAvatarGradient(topDeliverer.name),
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {getInitials(topDeliverer.name)}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <strong style={{ fontSize: '1rem', color: 'var(--text)', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {topDeliverer.name}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#EC4899', fontWeight: 600 }}>
                      {topDeliverer.delivered} delivered
                    </span>
                  </div>
                </>
              ) : (
                <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No deliveries yet today
                </span>
              )}
            </div>
          </div>
        </div>

        {/* WHO DELIVERED WHAT - CONTRIBUTOR BREAKDOWN CARDS */}
        <div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', fontFamily: 'Space Grotesk' }}>
            Who Delivered Today — Contributor Breakdown
          </h3>

          {contributorsList.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>
                📅 No deliverables scheduled for <strong>{formatReadableDate(selectedDate)}</strong>.
              </p>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Use the date selector above or go to the Calendar to schedule and track tasks.
              </span>
            </div>
          ) : (
            <div className="contributors-grid">
              {contributorsList.map(contributor => {
                const deliveredItems = contributor.items.filter(i => i.status === 'delivered');
                const pendingItems = contributor.items.filter(i => i.status !== 'delivered');
                const pct = contributor.total > 0 ? Math.round((contributor.delivered / contributor.total) * 100) : 0;

                return (
                  <div className="contributor-card" key={contributor.name}>
                    {/* Header */}
                    <div className="contributor-header">
                      <div
                        className="contributor-avatar"
                        style={{ background: getAvatarGradient(contributor.name) }}
                      >
                        {getInitials(contributor.name)}
                      </div>
                      <div className="contributor-info">
                        <span className="contributor-name" title={contributor.name}>
                          {contributor.name}
                        </span>
                        <span className="contributor-count">
                          <strong style={{ color: 'var(--teal)' }}>{contributor.delivered}</strong> of {contributor.total} items delivered ({pct}%)
                        </span>
                      </div>
                      <span className="badge badge-delivered" style={{ marginLeft: 'auto', fontSize: '11px' }}>
                        {contributor.delivered} ✓
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="progress-bar-track" style={{ width: '100%', height: '5px' }}>
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: 'var(--teal)' }} />
                    </div>

                    {/* Delivered Items List */}
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                        Delivered Items ({deliveredItems.length})
                      </span>
                      {deliveredItems.length === 0 ? (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No items delivered yet today.
                        </span>
                      ) : (
                        <div className="contributor-items-list">
                          {deliveredItems.map(item => {
                            const client = clients.find(c => c.id === item.client);
                            const typeColor = getContentTypeColor(item.contentType);
                            return (
                              <div className="contributor-item-row" key={item.id}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                                  <span style={{ color: 'var(--teal)', fontWeight: 'bold' }}>✓</span>
                                  <span className="contributor-item-title" title={item.title}>
                                    {item.title}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                  {client && (
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--surface)', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                      {client.name}
                                    </span>
                                  )}
                                  <span style={{ fontSize: '10px', fontWeight: 600, color: typeColor, background: `${typeColor}15`, padding: '1px 5px', borderRadius: '4px' }}>
                                    {item.contentType || 'General'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Pending Items if any */}
                    {pendingItems.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                          Awaiting Delivery ({pendingItems.length})
                        </span>
                        <div className="contributor-items-list">
                          {pendingItems.map(item => {
                            const client = clients.find(c => c.id === item.client);
                            return (
                              <div className="contributor-item-row" key={item.id} style={{ opacity: 0.85 }}>
                                <span className="contributor-item-title" title={item.title}>
                                  ⏳ {item.title}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                  {client && (
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                      {client.name}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleDelivered(item)}
                                    className="btn btn-secondary"
                                    style={{ padding: '1px 6px', fontSize: '10px', height: 'auto' }}
                                    title="Mark Delivered"
                                  >
                                    Mark Done ✓
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DETAILED DAILY DELIVERABLES LOG TABLE */}
        <div className="card" style={{ marginTop: '0.5rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0, fontFamily: 'Space Grotesk' }}>
                Daily Deliverables Log
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing {filteredDailyEvents.length} of {dailyTotal} scheduled items for {formatReadableDate(selectedDate)}
              </span>
            </div>

            {/* Filter controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search title, client, deliverer..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '190px', padding: '0.35rem 0.6rem', fontSize: '0.825rem' }}
              />

              <select
                className="form-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ width: '130px', padding: '0.35rem 0.6rem', fontSize: '0.825rem' }}
              >
                <option value="all">All Statuses</option>
                <option value="delivered">Delivered Only</option>
                <option value="pending">Pending Only</option>
                <option value="in-progress">In Progress</option>
                <option value="overdue">Overdue</option>
              </select>

              <select
                className="form-select"
                value={contributorFilter}
                onChange={e => setContributorFilter(e.target.value)}
                style={{ width: '140px', padding: '0.35rem 0.6rem', fontSize: '0.825rem' }}
              >
                <option value="all">All Deliverers</option>
                {contributorsList.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredDailyEvents.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No deliverables matching current filters for this date.
            </div>
          ) : (
            <div className="table-wrapper" style={{ margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Deliverable Item</th>
                    <th>Client / Brand</th>
                    <th>Content Type</th>
                    <th>Delivered By</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDailyEvents.map(event => {
                    const client = clients.find(c => c.id === event.client);
                    const delivererName = event.deliveredBy || client?.manager || 'Unassigned';
                    const typeColor = getContentTypeColor(event.contentType);
                    const isDelivered = event.status === 'delivered';

                    return (
                      <tr key={event.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <strong style={{ color: 'var(--text)', fontSize: '0.9rem' }}>
                              {event.title}
                            </strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Scheduled Date: {event.date}
                            </span>
                          </div>
                        </td>

                        <td>
                          {client ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: client.color || 'var(--accent)' }} />
                              <span style={{ fontWeight: 500 }}>{client.name}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({client.niche})</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>General (No Client)</span>
                          )}
                        </td>

                        <td>
                          <span
                            className="badge"
                            style={{
                              background: `${typeColor}15`,
                              color: typeColor,
                              border: `1px solid ${typeColor}30`,
                              fontSize: '11px'
                            }}
                          >
                            {event.contentType || 'General'}
                          </span>
                        </td>

                        <td>
                          <div
                            className="deliverer-pill"
                            onClick={() => handleOpenAssignModal(event)}
                            title="Click to assign or change deliverer"
                            style={{ cursor: 'pointer' }}
                          >
                            <span
                              className="deliverer-pill-avatar"
                              style={{ background: getAvatarGradient(delivererName) }}
                            >
                              {getInitials(delivererName)}
                            </span>
                            <span style={{ fontWeight: delivererName === 'Unassigned' ? 400 : 600 }}>
                              {delivererName}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>✎</span>
                          </div>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`badge ${event.status === 'in-progress' ? 'badge-in-progress' : `badge-${event.status || 'pending'}`}`}
                            style={{ fontSize: '11px', padding: '0.2rem 0.5rem' }}
                          >
                            {isDelivered ? '✓ Delivered' : event.status || 'pending'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleDelivered(event)}
                            className={`btn ${isDelivered ? 'btn-secondary' : 'btn-primary'}`}
                            style={{
                              padding: '0.3rem 0.65rem',
                              fontSize: '0.78rem',
                              background: isDelivered ? 'transparent' : 'var(--teal)'
                            }}
                          >
                            {isDelivered ? 'Mark Pending' : '✓ Mark Delivered'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* QUICK ASSIGN / EDIT DELIVERER MODAL */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Deliverer / Team Member"
      >
        <form onSubmit={handleSaveDeliverer}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Specify the team member who delivered or is responsible for delivering{' '}
            <strong style={{ color: 'var(--text)' }}>{editingDelivererEvent?.title}</strong>.
          </p>

          <div className="form-group">
            <label htmlFor="quick-assign-deliverer">Delivered By (Team Member / Person Name)</label>
            <input
              id="quick-assign-deliverer"
              list="quick-deliverers-list"
              type="text"
              className="form-input"
              value={assignedPersonName}
              onChange={e => setAssignedPersonName(e.target.value)}
              placeholder="e.g. Adarsh, Sarah, Video Editor"
              autoFocus
            />
            <datalist id="quick-deliverers-list">
              {knownDeliverers.map(d => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAssignModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Deliverer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
