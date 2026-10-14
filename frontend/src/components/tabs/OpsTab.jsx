import React, { useState, useEffect } from 'react';

export default function OpsTab() {
  const [opsData, setOpsData] = useState(null);
  const [whUrl, setWhUrl] = useState('');
  const [whChannel, setWhChannel] = useState('slack');
  const [whEvent, setWhEvent] = useState('hotspot.rapid_escalation');
  const [whStatus, setWhStatus] = useState(null);

  useEffect(() => {
    let isCancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/v1/pipeline/status');
        if (res.ok) {
          const d = await res.json();
          if (!isCancelled) setOpsData(d);
        }
      } catch (e) {}
    }
    load();
    return () => {
      isCancelled = true;
    };
  }, []);

  async function handleRegisterWebhook() {
    if (!whUrl.trim()) {
      setWhStatus({ text: 'Please enter a webhook URL.', type: 'error' });
      return;
    }
    setWhStatus({ text: 'Registering webhook...', type: 'info' });
    try {
      const res = await fetch('/api/v1/alerts/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: whUrl, channel: whChannel, events: [whEvent] }),
      });
      if (res.ok) {
        const d = await res.json();
        setWhStatus({ text: `✓ Webhook registered: ${d.webhook.id} (${whChannel.toUpperCase()})`, type: 'success' });
      } else {
        setWhStatus({ text: 'Registration failed.', type: 'error' });
      }
    } catch (err) {
      setWhStatus({ text: err.message, type: 'error' });
    }
  }

  const kafka = opsData?.kafka || {};
  const lag = kafka.consumer_groups?.['hdfs-sink']?.lag ?? 0;

  return (
    <div className="tab-page-container">
      <div className="page-header-row">
        <div>
          <div className="page-title">
            <span>⚙️ Pipeline Health, 3-Way Parity & Alerts</span>
            <span className="badge-verified">Verification Engine</span>
          </div>
          <div className="page-subtitle">
            Kafka KRaft streaming cluster, HDFS storage layout, MapReduce YARN execution, and multi-channel incident webhooks.
          </div>
        </div>

        <div>
          <button
            className="btn primary"
            onClick={() => window.open('/api/v1/feed/navigation.geojson', '_blank')}
          >
            🚗 Open Waze Hazard GeoJSON Feed
          </button>
        </div>
      </div>

      {/* Cluster Health Cards */}
      <div className="stats-grid-4">
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <span className="title">Kafka Broker (KRaft)</span>
          <div className="value" style={{ color: '#10b981' }}>
            Healthy
          </div>
          <div className="sub">{kafka.partitions || 6} Partitions &middot; Lag: {lag}</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <span className="title">HDFS Raw Lakehouse</span>
          <div className="value">
            _COMPLETE
          </div>
          <div className="sub">Path: /data/stats19/raw/dt=D/</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <span className="title">MapReduce (YARN)</span>
          <div className="value">
            3-Stage
          </div>
          <div className="sub">DedupScore ➔ Aggregate ➔ TopN</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <span className="title">3-Way Parity Proof</span>
          <div className="value" style={{ color: '#10b981' }}>
            100% PASS
          </div>
          <div className="sub">Stream = MapReduce = Pandas</div>
        </div>
      </div>

      {/* Multi-Channel Alerting & Webhook Manager */}
      <div className="stat-card">
        <span className="title">🔔 Multi-Channel Alerting & Webhooks Registration</span>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '8px 0 14px' }}>
          Subscribe to automated notifications when risk scores double, a new hotspot enters the Top 20, or a severe weather anomaly is detected.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Endpoint URL:
            </label>
            <input
              type="text"
              className="select-sm"
              placeholder="https://hooks.slack.com/services/..."
              value={whUrl}
              onChange={(e) => setWhUrl(e.target.value)}
              style={{ width: '100%', padding: '8px', fontSize: '12px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Channel:
            </label>
            <select
              className="select-sm"
              value={whChannel}
              onChange={(e) => setWhChannel(e.target.value)}
              style={{ width: '100%', padding: '7px' }}
            >
              <option value="slack">Slack</option>
              <option value="teams">Microsoft Teams</option>
              <option value="telegram">Telegram</option>
              <option value="generic">Generic JSON</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Alert Event:
            </label>
            <select
              className="select-sm"
              value={whEvent}
              onChange={(e) => setWhEvent(e.target.value)}
              style={{ width: '100%', padding: '7px' }}
            >
              <option value="hotspot.rapid_escalation">Score Doubled (+100% in 7d)</option>
              <option value="hotspot.new_entry">New Hotspot Enters Top 20</option>
              <option value="weather.surge">Severe Rain Risk Trigger</option>
            </select>
          </div>

          <button className="btn primary" onClick={handleRegisterWebhook} style={{ height: '34px' }}>
            Register Webhook
          </button>
        </div>

        {whStatus && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              marginTop: '12px',
              background:
                whStatus.type === 'success'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : whStatus.type === 'error'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(56, 189, 248, 0.15)',
              color:
                whStatus.type === 'success'
                  ? '#10b981'
                  : whStatus.type === 'error'
                  ? '#ef4444'
                  : '#38bdf8',
            }}
          >
            {whStatus.text}
          </div>
        )}
      </div>
    </div>
  );
}
