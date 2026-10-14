import React from 'react';

export default function TimelineBar({
  windowStart = '2025-10-03',
  windowEnd = '2025-12-31',
  scrubberValue = 90,
  onChangeScrubber,
}) {
  const progressPercent = (scrubberValue / 90) * 100;

  return (
    <div className="timeline-bar">
      <div className="timeline-meta-row">
        <div>
          <b>Window Start:</b> <span id="win-start">{windowStart}</span>
        </div>
        <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
          90-Day Sliding Evaluation Window (Half-Life = 30d)
        </div>
        <div>
          <b>As-Of Date:</b> <span id="win-end">{windowEnd}</span> (Virtual Now)
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <div className="window-track">
          <div
            className="window-fill"
            id="timeline-progress"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <input
          type="range"
          className="scrubber-input"
          id="time-machine-slider"
          min="0"
          max="90"
          value={scrubberValue}
          step="1"
          onChange={(e) => onChangeScrubber(parseInt(e.target.value, 10))}
          title="Time Machine 90-Day Sliding Window Scrubber"
        />
      </div>
    </div>
  );
}
