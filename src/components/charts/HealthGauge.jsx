import React, { useState, useEffect } from 'react';

export default function HealthGauge({ delivered, total }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const targetScore = total > 0 ? Math.round((delivered / total) * 100) : 100;

  useEffect(() => {
    let startTimestamp = null;
    const duration = 1000; // 1000ms animation duration
    const startScore = 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = timestamp - startTimestamp;
      const percentage = Math.min(progress / duration, 1);
      const current = startScore + percentage * (targetScore - startScore);
      
      setAnimatedScore(current);

      if (progress < duration) {
        window.requestAnimationFrame(step);
      } else {
        setAnimatedScore(targetScore); // Snap to final value
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [targetScore]);

  // SVG parameters
  const radius = 80;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Compute color based on current score
  let arcColor = 'var(--teal)';
  if (animatedScore < 40) {
    arcColor = 'var(--danger)';
  } else if (animatedScore <= 70) {
    arcColor = 'var(--warning)';
  }

  return (
    <div className="health-gauge-section">
      <div className="gauge-svg-container">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* Track Circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth={strokeWidth}
          />
          {/* Progress Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
              transition: 'stroke 0.3s ease'
            }}
          />
        </svg>
        <div className="gauge-center-text">
          <span className="gauge-percentage">{Math.round(animatedScore)}%</span>
          <span className="gauge-label">Delivery Health</span>
        </div>
      </div>
    </div>
  );
}
