import React, { useState, useEffect } from 'react';

export default function ForecastTab() {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/v1/predictions/risk');
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) setForecastData(data);
        }
      } catch (err) {
        console.error('Error fetching forecasts:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    load();

    return () => {
      isCancelled = true;
    };
  }, []);

  const predictions = forecastData?.hotspot_predictions || [];
  const weather = forecastData?.weather_forecast || [];

  return (
    <div className="tab-page-container">
      <div className="page-header-row">
        <div>
          <div className="page-title">
            <span>🔮 7-Day Spatio-Temporal Risk Forecasting</span>
            <span className="badge-verified">Model: LightGBM-Poisson-v2.1</span>
          </div>
          <div className="page-subtitle">
            Forecasting expected incident rate ($\lambda$) and Poisson confidence intervals (P10/P90) incorporating Met Office weather predictions.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Horizon: 7 Days (Rolling)</span>
        </div>
      </div>

      {/* Weather Forecast Banner Strip */}
      <div className="stats-grid-4">
        {weather.slice(0, 4).map((w, idx) => (
          <div key={idx} className="stat-card" style={{ borderLeft: '3px solid #a855f7' }}>
            <span className="title">{w.date} &middot; {w.condition}</span>
            <div className="value" style={{ fontSize: '20px', color: '#a855f7' }}>
              {(w.rain_prob * 100).toFixed(0)}% Rain
            </div>
            <div className="sub">Temp: {w.temp_c}°C &middot; Risk Multiplier: {w.rain_prob > 0.6 ? '1.8x' : '1.1x'}</div>
          </div>
        ))}
      </div>

      {/* Predictions Table */}
      <div className="data-table-wrapper" style={{ maxHeight: '520px', overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Grid Cell</th>
              <th>Time Band</th>
              <th>Coordinates</th>
              <th>Predicted 7d Avg Score</th>
              <th>Tomorrow Expected (λ)</th>
              <th>Confidence [P10 — P90]</th>
              <th>Weather Factor</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((p, idx) => {
              const nextDay = p.daily_forecast?.[0] || {};

              return (
                <tr key={idx}>
                  <td>
                    <code>{p.cell}</code>
                  </td>
                  <td>
                    <span className={`card-band band-${p.band}`} style={{ fontSize: '9px' }}>
                      {p.band}
                    </span>
                  </td>
                  <td>{p.lat.toFixed(4)}, {p.lon.toFixed(4)}</td>
                  <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: '#a855f7', fontSize: '13px' }}>
                    {p.predicted_7d_avg_score}
                  </td>
                  <td>
                    <b>~{nextDay.predicted_lambda_crashes}</b> collisions
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono' }}>
                    [{nextDay.confidence_p10} &mdash; {nextDay.confidence_p90}]
                  </td>
                  <td>
                    <span style={{ color: nextDay.weather_condition?.includes('Rain') ? '#06b6d4' : 'var(--text-dim)', fontWeight: 600 }}>
                      {nextDay.weather_condition || 'Overcast'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
