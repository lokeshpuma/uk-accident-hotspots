import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import TimelineBar from './components/TimelineBar';
import Map from './components/Map';
import HotspotsTab from './components/tabs/HotspotsTab';
import TelemetryTab from './components/tabs/TelemetryTab';
import ForecastTab from './components/tabs/ForecastTab';
import EconomicsTab from './components/tabs/EconomicsTab';
import OpsTab from './components/tabs/OpsTab';

export default function App() {
  // Theme State (Dark by default, toggles light-mode on body)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Active Main Navigation Tab
  const [activeMainTab, setActiveMainTab] = useState('map');

  // App Data & Live State
  const [appData, setAppData] = useState(null);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [stats, setStats] = useState({
    total_window_collisions: 25642,
    fatal: 378,
    serious: 5834,
    slight: 19430,
    pipeline_events_per_sec: '28.4',
  });
  const [virtualTs, setVirtualTs] = useState('2025-12-31 17:42');
  const virtualTsRef = useRef('2025-12-31 17:42');

  useEffect(() => {
    virtualTsRef.current = virtualTs;
  }, [virtualTs]);

  // Playback & Simulation State
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(10);
  const [scrubberValue, setScrubberValue] = useState(90);

  // Filters & Modes
  const [selectedBand, setSelectedBand] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [normMode, setNormMode] = useState('sqrt');
  const [h3Mode, setH3Mode] = useState(false);
  const [forecastMode, setForecastMode] = useState(false);

  // Inspector & Map Interaction
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [activeRightTab, setActiveRightTab] = useState('stream');
  const [tickerEvents, setTickerEvents] = useState([]);
  const [pulseQueue, setPulseQueue] = useState([]);

  // Toggle Dark/Light Mode
  const handleToggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      document.body.classList.toggle('light-mode', !next);
      return next;
    });
  };

  // Fetch initial app_data and check live API
  useEffect(() => {
    let isCancelled = false;

    async function initData() {
      // 1. Check live healthz
      try {
        const healthRes = await fetch('/api/v1/healthz');
        if (healthRes.ok) {
          setIsLiveApi(true);

          const statsRes = await fetch('/api/v1/stats');
          if (statsRes.ok) {
            const st = await statsRes.json();
            if (!isCancelled) {
              setStats({
                total_window_collisions: st.total_window_collisions || 25659,
                fatal: st.fatal || 378,
                serious: st.serious || 5840,
                slight: st.slight || 19441,
                pipeline_events_per_sec: st.pipeline_events_per_sec || '28.4',
              });
            }
          }
        }
      } catch (e) {
        console.log('[App] Running in standalone data mode');
      }

      // 2. Load base app_data.json
      try {
        const res = await fetch('./app_data.json').catch(() => fetch('/app_data.json'));
        if (res && res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setAppData(data);
            const list = data.top20 || data.hotspots || [];
            if (list.length > 0) {
              setSelectedHotspot(list[0]);
            }
            const evs = data.events || data.stream_events || [];
            if (evs.length > 0) {
              setTickerEvents(
                evs.slice(0, 30).map((ev, i) => {
                  const minsAgo = i * 2;
                  const d = new Date(Date.UTC(2025, 11, 31, 17, 42));
                  d.setUTCMinutes(d.getUTCMinutes() - minsAgo);
                  const hh = String(d.getUTCHours()).padStart(2, '0');
                  const mm = String(d.getUTCMinutes()).padStart(2, '0');
                  const y = d.getUTCFullYear();
                  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
                  const day = String(d.getUTCDate()).padStart(2, '0');
                  return {
                    ...ev,
                    date: `${y}-${m}-${day}`,
                    time: `${hh}:${mm}`,
                    _uid: `init_${i}_${Date.now()}`,
                  };
                })
              );
            }
          }
        }
      } catch (err) {
        console.error('Error loading app_data.json:', err);
      }
    }

    initData();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Connect Server-Sent Events (SSE) for live stream
  useEffect(() => {
    if (!window.EventSource) return;
    let es;
    try {
      es = new EventSource('/api/v1/stream');
      es.addEventListener('clock', (e) => {
        try {
          const c = JSON.parse(e.data);
          if (c.virtual_ts) {
            setVirtualTs(c.virtual_ts.replace('T', ' ').substring(0, 16));
          }
        } catch (err) {}
      });

      es.addEventListener('ticker', (e) => {
        try {
          const batch = JSON.parse(e.data);
          if (Array.isArray(batch)) {
            const enriched = batch.map((ev, idx) => ({
              ...ev,
              _isNew: true,
              _uid: `sse_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
            }));
            setTickerEvents((prev) => [...enriched, ...prev.slice(0, 49)]);
            setPulseQueue((prev) => [...prev.slice(-10), ...enriched]);
          }
        } catch (err) {}
      });
    } catch (err) {}

    return () => {
      if (es) es.close();
    };
  }, []);

  // Local Replay Simulation Loop & Virtual Clock Advancement
  useEffect(() => {
    if (!isPlaying || !appData) return;
    const events = appData.events || appData.stream_events || [];
    if (events.length === 0) return;

    const intervalMs = Math.max(600, (10 / speed) * 1000);
    let curIdx = 0;

    const interval = setInterval(() => {
      // 1. Advance virtual clock continuously
      const prevTs = virtualTsRef.current || '2025-12-31 17:42';
      let nextDate = '2025-12-31';
      let nextTime = '17:42';

      try {
        const [dPart, tPart] = prevTs.split(' ');
        const [yr, mo, da] = dPart.split('-').map(Number);
        const [hr, mi] = tPart.split(':').map(Number);
        const d = new Date(Date.UTC(yr, mo - 1, da, hr, mi));
        const stepMins = speed === 1 ? 1 : Math.max(1, Math.round(10 / Math.max(1, 10 / speed)));
        d.setUTCMinutes(d.getUTCMinutes() + stepMins);
        const ny = d.getUTCFullYear();
        const nm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const nd = String(d.getUTCDate()).padStart(2, '0');
        const nh = String(d.getUTCHours()).padStart(2, '0');
        const nmi = String(d.getUTCMinutes()).padStart(2, '0');
        nextDate = `${ny}-${nm}-${nd}`;
        nextTime = `${nh}:${nmi}`;
      } catch (e) {}

      const newVirtualTs = `${nextDate} ${nextTime}`;
      setVirtualTs(newVirtualTs);

      // 2. Prepend newly generated event to the TOP of the stack
      const raw = events[curIdx % events.length];
      curIdx++;
      const ev = {
        ...raw,
        date: nextDate,
        time: nextTime,
        _isNew: true,
        _uid: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      };

      setTickerEvents((prev) => [ev, ...prev.slice(0, 49)]);
      setPulseQueue((prev) => [...prev.slice(-10), ev]);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, speed, appData]);

  // Handle Export
  const handleExport = () => {
    const choice = confirm('Click OK for CSV Export.\nClick Cancel for GeoJSON Export.');
    if (choice) {
      window.open('/api/v1/export/top20.csv', '_blank');
    } else {
      window.open('/api/v1/export/top20.geojson', '_blank');
    }
  };

  // Hotspot selection handler (immediately flies to hotspot on map)
  const handleSelectHotspot = (h) => {
    setSelectedHotspot({ ...h, _selectedAt: Date.now() });
    setActiveRightTab('detail');
    setActiveMainTab('map');
  };

  // Navigate from Hotspots Tab directly to Map
  const handleNavigateToMap = (h) => {
    if (h) setSelectedHotspot({ ...h, _selectedAt: Date.now() });
    setActiveMainTab('map');
  };

  const currentHotspots = appData?.top20 || appData?.hotspots || [];

  return (
    <div className="hotspotwatch-app">
      {/* Top Header Navigation Bar */}
      <Header
        activeMainTab={activeMainTab}
        onSelectMainTab={setActiveMainTab}
        isLiveApi={isLiveApi}
        virtualTs={virtualTs}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        speed={speed}
        onChangeSpeed={setSpeed}
        h3Mode={h3Mode}
        onToggleH3={() => setH3Mode(!h3Mode)}
        forecastMode={forecastMode}
        onToggleForecast={() => setForecastMode(!forecastMode)}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onExport={handleExport}
      />

      {/* Map Viewport (Always kept in DOM so Leaflet preserves tile cache) */}
      <div style={{ display: activeMainTab === 'map' ? 'block' : 'none' }}>
        <Map
          isDarkMode={isDarkMode}
          heatData={appData?.heat_layers}
          selectedBand={selectedBand}
          normMode={normMode}
          hotspots={currentHotspots}
          selectedHotspot={selectedHotspot}
          onSelectHotspot={handleSelectHotspot}
          h3Mode={h3Mode}
          forecastMode={forecastMode}
          pulseQueue={pulseQueue}
        />

        {/* Left Sidebar: Top 20 Ranked Hotspot List */}
        <LeftPanel
          hotspots={currentHotspots}
          selectedBand={selectedBand}
          onSelectBand={setSelectedBand}
          selectedSeverity={selectedSeverity}
          onSelectSeverity={setSelectedSeverity}
          normMode={normMode}
          onChangeNorm={setNormMode}
          selectedHotspot={selectedHotspot}
          onSelectHotspot={handleSelectHotspot}
        />

        {/* Right Sidebar: Live Stream & Hotspot Detail Inspector */}
        <RightPanel
          activeTab={activeRightTab}
          onChangeTab={setActiveRightTab}
          tickerEvents={tickerEvents}
          selectedHotspot={selectedHotspot}
        />

        {/* Bottom Timeline Bar: 90-Day Sliding Window Scrubber */}
        <TimelineBar
          windowStart="2025-10-03"
          windowEnd="2025-12-31"
          scrubberValue={scrubberValue}
          onChangeScrubber={setScrubberValue}
        />
      </div>

      {/* Tab 2: Dedicated Hotspot Intelligence */}
      {activeMainTab === 'hotspots' && (
        <HotspotsTab
          hotspots={currentHotspots}
          selectedHotspot={selectedHotspot}
          onSelectHotspot={setSelectedHotspot}
          onNavigateToMap={handleNavigateToMap}
        />
      )}

      {/* Tab 3: Dedicated Live Ingest Telemetry */}
      {activeMainTab === 'telemetry' && (
        <TelemetryTab
          tickerEvents={tickerEvents}
          stats={stats}
          isLiveApi={isLiveApi}
          virtualTs={virtualTs}
        />
      )}

      {/* Tab 4: Dedicated 7-Day Poisson ML Risk Forecast */}
      {activeMainTab === 'forecast' && <ForecastTab />}

      {/* Tab 5: Dedicated Vision Zero Economics & Patrol Optimizer */}
      {activeMainTab === 'economics' && <EconomicsTab />}

      {/* Tab 6: Dedicated Pipeline Health & System Ops */}
      {activeMainTab === 'ops' && <OpsTab />}
    </div>
  );
}
