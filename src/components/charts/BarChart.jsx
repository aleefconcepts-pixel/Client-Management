import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

export default function BarChart({ clients: propClients, events: propEvents }) {
  const { state } = useApp();
  const clients = propClients !== undefined ? propClients : (state.clients || []);
  const events = propEvents !== undefined ? propEvents : (state.events || []);
  const canvasRef = useRef(null);

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

      // Establish dimensions based on parent container and list size
      const chartHeight = Math.max(180, clients.length * 56 + 20);
      canvas.width = rect.width * dpr;
      canvas.height = chartHeight * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${chartHeight}px`;

      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      // Fetch colors from computed style or fallback
      const styles = getComputedStyle(document.documentElement);
      const colorTeal = styles.getPropertyValue('--teal').trim() || '#6EE7B7';
      const colorSurface2 = styles.getPropertyValue('--surface-2').trim() || '#162019';
      const colorText = styles.getPropertyValue('--text').trim() || '#F0FDF4';
      const colorTextMuted = styles.getPropertyValue('--text-muted').trim() || '#6B7280';

      ctx.clearRect(0, 0, rect.width, chartHeight);

      if (clients.length === 0) {
        ctx.fillStyle = colorTextMuted;
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No clients to display progress.', rect.width / 2, chartHeight / 2);
        return;
      }

      const activeMonth = state.settings?.currentMonth || new Date().toISOString().substring(0, 7);
      const monthEvents = (events || []).filter(e => e.date && e.date.substring(0, 7) === activeMonth);

      clients.forEach((client, idx) => {
        const clientEvents = monthEvents.filter(e => e.client === client.id);
        const total = clientEvents.length;
        const delivered = clientEvents.filter(d => d.status === 'delivered').length;
        const pct = total > 0 ? (delivered / total) : 0;
        const pctText = total > 0 ? `${Math.round(pct * 100)}%` : 'No events';

        const rowY = idx * 56 + 10;
        const barHeight = 12;
        const labelY = rowY + 16;
        const barY = rowY + 26;

        // Draw labels
        ctx.fillStyle = colorText;
        ctx.font = '500 13px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(client.name, 10, labelY);

        ctx.fillStyle = colorTextMuted;
        ctx.font = '500 12px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${delivered}/${total} delivered (${pctText})`, rect.width - 10, labelY);

        // Draw track
        const barWidth = rect.width - 20;
        ctx.fillStyle = colorSurface2;
        drawRoundedRect(ctx, 10, barY, barWidth, barHeight, 6);
        ctx.fill();

        // Draw progress fill
        if (pct > 0 && total > 0) {
          ctx.fillStyle = colorTeal;
          drawRoundedRect(ctx, 10, barY, barWidth * pct, barHeight, 6);
          ctx.fill();
        }
      });
    };

    const drawRoundedRect = (c, x, y, w, h, r) => {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
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
  }, [clients, events, state.settings?.currentMonth]);

  return (
    <div className="canvas-container" style={{ minHeight: `${Math.max(180, clients.length * 56 + 20)}px` }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
