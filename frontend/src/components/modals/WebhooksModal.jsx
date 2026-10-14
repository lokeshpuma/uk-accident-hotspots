import React, { useState } from 'react';

export default function WebhooksModal({ isOpen, onClose }) {
  const [url, setUrl] = useState('');
  const [channel, setChannel] = useState('slack');
  const [event, setEvent] = useState('hotspot.rapid_escalation');
  const [statusMsg, setStatusMsg] = useState(null);

  if (!isOpen) return null;

  async function handleSubmit() {
    if (!url.trim()) {
      setStatusMsg({ text: 'Please enter a valid webhook destination URL.', type: 'error' });
      return;
    }
    setStatusMsg({ text: 'Subscribing webhook...', type: 'info' });

    try {
      const res = await fetch('/api/v1/alerts/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, channel, events: [event] }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatusMsg({
          text: `✓ Subscribed! ID: ${data.webhook?.id || 'wh_001'} (${channel.toUpperCase()})`,
          type: 'success',
        });
      } else {
        setStatusMsg({ text: 'Failed to register webhook.', type: 'error' });
      }
    } catch (err) {
      setStatusMsg({ text: `Error: ${err.message}`, type: 'error' });
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>🔔 Multi-Channel Alerting & Webhooks</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Register webhook subscribers to receive instant notifications for new hotspot entries, rapid score escalation, or severe weather warnings.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Webhook Endpoint URL:
            </label>
            <input
              type="text"
              className="select-sm"
              placeholder="https://hooks.slack.com/services/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ width: '100%', padding: '8px', fontSize: '12px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Target Channel:
              </label>
              <select
                className="select-sm"
                style={{ width: '100%', padding: '6px' }}
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                <option value="slack">Slack Incoming Webhook</option>
                <option value="teams">Microsoft Teams Connector</option>
                <option value="telegram">Telegram Bot API</option>
                <option value="generic">Generic HTTPS JSON</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Alert Event:
              </label>
              <select
                className="select-sm"
                style={{ width: '100%', padding: '6px' }}
                value={event}
                onChange={(e) => setEvent(e.target.value)}
              >
                <option value="hotspot.rapid_escalation">Score Doubled (+100% in 7d)</option>
                <option value="hotspot.new_entry">New Hotspot Enters Top 20</option>
                <option value="weather.surge">Severe Rain / Ice Risk Trigger</option>
              </select>
            </div>
          </div>
        </div>

        {statusMsg && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              marginBottom: '12px',
              background:
                statusMsg.type === 'success'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : statusMsg.type === 'error'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(56, 189, 248, 0.15)',
              color:
                statusMsg.type === 'success'
                  ? '#10b981'
                  : statusMsg.type === 'error'
                  ? '#ef4444'
                  : '#38bdf8',
            }}
          >
            {statusMsg.text}
          </div>
        )}

        <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSubmit}>
          Register & Test Webhook
        </button>
      </div>
    </div>
  );
}
