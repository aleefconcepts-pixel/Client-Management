import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import BarChart from '../components/charts/BarChart';
import DonutChart from '../components/charts/DonutChart';

export default function Dashboard() {
  const { state } = useApp();
  const { clients, events, settings } = state;

  useEffect(() => {
    document.title = `${settings.agencyName || 'Aleef Concepts'} — Dashboard`;
  }, [settings.agencyName]);

  // Helper to format settings.currentMonth (YYYY-MM) to Month Name YYYY
  const formatMonthName = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Compute stats based on the active month's calendar events
  const activeMonth = settings.currentMonth || '2025-06';
  const monthEvents = (events || []).filter(e => e.date && e.date.substring(0, 7) === activeMonth);

  const totalClients = clients.length;
  const totalDeliverables = monthEvents.length;
  const delivered = monthEvents.filter(d => d.status === 'delivered').length;
  const pending = monthEvents.filter(d => d.status === 'pending').length;
  const inProgress = monthEvents.filter(d => d.status === 'in-progress').length;
  const overdue = monthEvents.filter(d => d.status === 'overdue').length;

  return (
    <div className="page-container">
      {/* SECTION 1 - Greeting */}
      <h1 className="title-large">Good morning, {settings.agencyName}</h1>
      <p className="subtitle">{formatMonthName(settings.currentMonth)}</p>

      {/* SECTION 2 - Summary Cards */}
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

      {/* SECTION 3 - Charts row */}
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
    </div>
  );
}
