import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

export default function DonutChart() {
  const { state } = useApp();
  const clients = state.clients || [];
  const canvasRef = useRef(null);

  // Compute status totals from calendar events for the active month
  const activeMonth = state.settings?.currentMonth || '2025-06';
  const monthEvents = (state.events || []).filter(e => e.date && e.date.substring(0, 7) === activeMonth);

  let delivered = 0;
  let pending = 0;
  let inProgress = 0;
  let overdue = 0;

  monthEvents.forEach(e => {
    if (e.status === 'delivered') delivered++;
    else if (e.status === 'pending') pending++;
    else if (e.status === 'in-progress') inProgress++;
    else if (e.status === 'overdue') overdue++;
  });

  const total = delivered + pending + inProgress + overdue;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const draw = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Set canvas size matching the parent, minimum height of 220px
      const size = Math.max(220, Math.min(rect.width, 260));
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      // Fetch colors from computed style or fallback
      const styles = getComputedStyle(document.documentElement);
      const colorTeal = styles.getPropertyValue('--teal').trim() || '#6EE7B7';
      const colorWarning = styles.getPropertyValue('--warning').trim() || '#F59E0B';
      const colorAccent = styles.getPropertyValue('--accent').trim() || '#00E5A0';
      const colorDanger = styles.getPropertyValue('--danger').trim() || '#EF4444';
      const colorSurface = styles.getPropertyValue('--surface').trim() || '#111A14';
      const colorText = styles.getPropertyValue('--text').trim() || '#F0FDF4';
      const colorTextMuted = styles.getPropertyValue('--text-muted').trim() || '#6B7280';

      ctx.clearRect(0, 0, size, size);

      const centerX = size / 2;
      const centerY = size / 2;
      const outerRadius = size / 2 - 12;
      const innerRadius = outerRadius * 0.70;

      if (total === 0) {
        // Draw empty state circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#162019';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = colorSurface;
        ctx.fill();

        ctx.fillStyle = colorTextMuted;
        ctx.font = '500 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No Deliverables', centerX, centerY);
        return;
      }

      const segments = [
        { count: delivered, color: colorTeal },
        { count: pending, color: colorWarning },
        { count: inProgress, color: colorAccent },
        { count: overdue, color: colorDanger }
      ].filter(s => s.count > 0);

      let startAngle = -Math.PI / 2;

      segments.forEach((seg) => {
        const sliceAngle = (seg.count / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        // Draw outer segment arc
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();

        startAngle = endAngle;
      });

      // Draw inner circle to form donut
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = colorSurface;
      ctx.fill();

      // Draw center text
      ctx.fillStyle = colorText;
      ctx.font = '700 24px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(total.toString(), centerX, centerY - 8);

      ctx.fillStyle = colorTextMuted;
      ctx.font = '500 10px Inter, sans-serif';
      ctx.fillText('DELIVERABLES', centerX, centerY + 14);
    };

    // Use ResizeObserver for responsive redraws
    const resizeObserver = new ResizeObserver(() => {
      animationFrameId = requestAnimationFrame(draw);
    });
    
    resizeObserver.observe(canvas.parentElement);
    window.addEventListener('resize', draw);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', draw);
      cancelAnimationFrame(animationFrameId);
    };
  }, [delivered, pending, inProgress, overdue, total]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' }}>
        <canvas ref={canvasRef} />
      </div>
      
      {/* Legend below chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', width: '100%', maxWidth: '280px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--teal)', display: 'inline-block' }} />
          <span style={{ color: 'var(--text-muted)' }}>Delivered:</span>
          <strong style={{ marginLeft: 'auto' }}>{delivered}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)', display: 'inline-block' }} />
          <span style={{ color: 'var(--text-muted)' }}>Pending:</span>
          <strong style={{ marginLeft: 'auto' }}>{pending}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          <span style={{ color: 'var(--text-muted)' }}>In Progress:</span>
          <strong style={{ marginLeft: 'auto' }}>{inProgress}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }} />
          <span style={{ color: 'var(--text-muted)' }}>Overdue:</span>
          <strong style={{ marginLeft: 'auto' }}>{overdue}</strong>
        </div>
      </div>
    </div>
  );
}
