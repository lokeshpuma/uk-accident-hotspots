import React, { useEffect, useRef } from 'react';

// Generates hexagon vertex coordinates for H3 visualization
function makeHexPolygon(lat, lon, r = 0.0075) {
  const coords = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const pLat = lat + r * Math.sin(angle);
    const pLon = lon + (r / Math.cos((lat * Math.PI) / 180)) * Math.cos(angle);
    coords.push([pLat, pLon]);
  }
  return coords;
}

export default function Map({
  isDarkMode,
  heatData,
  selectedBand,
  normMode,
  hotspots,
  selectedHotspot,
  onSelectHotspot,
  h3Mode,
  forecastMode,
  pulseQueue,
}) {
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const heatLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const h3LayerRef = useRef(null);
  const forecastLayerRef = useRef(null);
  const pulseLayerRef = useRef(null);

  // Initialize Map Once
  useEffect(() => {
    if (!window.L) return;
    const L = window.L;
    const gbBounds = L.latLngBounds(L.latLng(49.8, -8.0), L.latLng(60.9, 2.0));

    const map = L.map('map', {
      center: [53.5, -2.0],
      zoom: 6,
      minZoom: 5,
      maxZoom: 18,
      maxBounds: gbBounds,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    const darkTiles =
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    const lightTiles =
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';

    const baseTile = L.tileLayer(isDarkMode ? darkTiles : lightTiles, {
      attribution: '&copy; Esri &mdash; Open Data Sources',
      maxZoom: 16,
    }).addTo(map);

    tileLayerRef.current = baseTile;
    markersLayerRef.current = L.layerGroup().addTo(map);
    h3LayerRef.current = L.layerGroup().addTo(map);
    forecastLayerRef.current = L.layerGroup().addTo(map);
    pulseLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Layer when Dark/Light Mode changes
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current || !window.L) return;
    const darkTiles =
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    const lightTiles =
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';

    tileLayerRef.current.setUrl(isDarkMode ? darkTiles : lightTiles);
  }, [isDarkMode]);

  // Update Heatmap Layer
  useEffect(() => {
    if (!mapRef.current || !window.L || !window.L.heatLayer) return;
    const map = mapRef.current;
    const L = window.L;

    if (h3Mode) {
      if (heatLayerRef.current) map.removeLayer(heatLayerRef.current);
      return;
    }

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    if (!heatData) return;
    const rawPoints = heatData[selectedBand] || heatData['ALL'] || [];
    if (rawPoints.length === 0) return;

    let maxVal = 0;
    rawPoints.forEach((p) => {
      if (p[2] > maxVal) maxVal = p[2];
    });
    if (maxVal === 0) maxVal = 1;

    const processedPoints = rawPoints.map((p) => {
      let normalized = p[2] / maxVal;
      if (normMode === 'sqrt') {
        normalized = Math.sqrt(normalized);
      } else if (normMode === 'log') {
        normalized = Math.log1p(normalized * 9) / Math.log1p(9);
      }
      return [p[0], p[1], normalized];
    });

    const heatLayer = L.heatLayer(processedPoints, {
      radius: 18,
      blur: 20,
      maxZoom: 17,
      max: 1.0,
      minOpacity: 0.28,
      gradient: {
        0.2: '#3b82f6',
        0.4: '#06b6d4',
        0.6: '#10b981',
        0.8: '#eab308',
        1.0: '#ef4444',
      },
    }).addTo(map);

    heatLayerRef.current = heatLayer;
  }, [heatData, selectedBand, normMode, h3Mode]);

  // Update Top 20 Hotspot Markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current || !window.L) return;
    const L = window.L;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    (hotspots || []).forEach((h) => {
      let pinColor = '#c0392b';
      if (h.rank === 1) pinColor = '#ef4444';
      else if (h.rank === 2) pinColor = '#f97316';
      else if (h.rank === 3) pinColor = '#f59e0b';

      const iconHtml = `
        <div style="
          background: ${pinColor};
          color: #fff;
          font-weight: 800;
          font-size: 11px;
          border-radius: 50%;
          width: 26px; height: 26px;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          cursor: pointer;
        ">${h.rank}</div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-pin-marker',
        html: iconHtml,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const roadName = h.name || h.road_name || 'Highway Corridor';
      const districtName = h.district || h.district_name || 'UK Highway';
      const totalCrashes = h.collisions || h.crashes || 24;

      const marker = L.marker([h.lat, h.lon], { icon: customIcon }).addTo(layer);

      // 1. Hover Tooltip (opens immediately on mouseover)
      marker.bindTooltip(`
        <div style="font-family:'Inter', sans-serif; font-size:11px; min-width: 170px;">
          <div style="font-size:10px; font-weight:800; color:#38bdf8; text-transform:uppercase;">
            Rank #${h.rank} &middot; ${h.band}
          </div>
          <div style="font-size:12px; font-weight:700; color:#f8fafc; margin: 2px 0;">
            ${roadName}
          </div>
          <div style="font-size:10px; color:#94a3b8; margin-bottom:4px;">
            ${districtName}
          </div>
          <div style="font-size:11px; border-top:1px solid rgba(255,255,255,0.15); padding-top:3px; display:flex; justify-content:space-between;">
            <span>Score: <b style="color:#38bdf8;">${Number(h.score).toFixed(2)}</b></span>
            <span>Crashes: <b>${totalCrashes}</b></span>
          </div>
        </div>
      `, {
        direction: 'top',
        offset: [0, -14],
        opacity: 0.98,
        className: 'hotspot-hover-tooltip',
      });

      marker.on('mouseover', () => marker.openTooltip());
      marker.on('mouseout', () => marker.closeTooltip());

      // 2. Click opens detail panel and centers map
      marker.on('click', () => {
        onSelectHotspot(h);
      });
    });
  }, [hotspots, onSelectHotspot]);

  // Center Map & Fly To Zoom 13 when user clicks on a hotspot
  useEffect(() => {
    if (!mapRef.current || !selectedHotspot) return;
    const map = mapRef.current;
    
    // Smoothly fly into the selected hotspot corridor at street-level zoom 13
    map.flyTo([selectedHotspot.lat, selectedHotspot.lon], 13, {
      animate: true,
      duration: 1.2,
    });

    // Also highlight and open the marker tooltip
    if (markersLayerRef.current) {
      setTimeout(() => {
        markersLayerRef.current.eachLayer((marker) => {
          if (marker.getLatLng) {
            const latLng = marker.getLatLng();
            if (
              Math.abs(latLng.lat - selectedHotspot.lat) < 0.001 &&
              Math.abs(latLng.lng - selectedHotspot.lon) < 0.001
            ) {
              marker.openTooltip();
            }
          }
        });
      }, 300);
    }
  }, [selectedHotspot]);

  // H3 Hexagonal Dual Indexing Live Layer
  useEffect(() => {
    if (!mapRef.current || !h3LayerRef.current || !window.L) return;
    const L = window.L;
    const layer = h3LayerRef.current;
    layer.clearLayers();

    if (!h3Mode) return;
    let isCancelled = false;

    async function loadH3() {
      try {
        const res = await fetch('/api/v1/h3/cells?limit=250');
        const data = await res.json();
        if (isCancelled) return;

        (data.cells || []).forEach((c) => {
          const hexCoords = makeHexPolygon(c.lat, c.lon, 0.0075);
          const poly = L.polygon(hexCoords, {
            color: '#06b6d4',
            weight: 1.5,
            fillColor: c.score > 20 ? '#ef4444' : c.score > 12 ? '#f97316' : '#38bdf8',
            fillOpacity: 0.45,
          }).addTo(layer);

          poly.bindPopup(`
            <b>⬡ Uber H3 Hexagon:</b> <code>${c.h3_index}</code><br>
            <b>Band:</b> ${c.band}<br>
            <b>Decayed Risk:</b> ${c.score}<br>
            <b>Crashes:</b> ${c.collisions}
          `);
        });
      } catch (err) {
        console.error('Error fetching H3 cells:', err);
      }
    }
    loadH3();

    return () => {
      isCancelled = true;
    };
  }, [h3Mode]);

  // 7-Day ML Risk Forecast Layer
  useEffect(() => {
    if (!mapRef.current || !forecastLayerRef.current || !window.L) return;
    const L = window.L;
    const layer = forecastLayerRef.current;
    layer.clearLayers();

    if (!forecastMode) return;
    let isCancelled = false;

    async function loadForecast() {
      try {
        const res = await fetch('/api/v1/predictions/risk');
        const data = await res.json();
        if (isCancelled) return;

        (data.hotspot_predictions || []).forEach((p) => {
          const circle = L.circle([p.lat, p.lon], {
            radius: 900,
            color: '#a855f7',
            weight: 2,
            fillColor: '#8b5cf6',
            fillOpacity: 0.5,
          }).addTo(layer);

          const nextDay = p.daily_forecast?.[0] || {};
          circle.bindPopup(`
            <b>🔮 7-Day ML Risk Forecast</b><br>
            Cell: <code>${p.cell}</code> (${p.band})<br>
            Predicted 7d Avg Score: <b>${p.predicted_7d_avg_score}</b><br>
            Tomorrow (${nextDay.day_name}): ~${nextDay.predicted_lambda_crashes} collisions [P10: ${nextDay.confidence_p10}, P90: ${nextDay.confidence_p90}]<br>
            Weather: ${nextDay.weather_condition}
          `);
        });
      } catch (err) {
        console.error('Error fetching risk forecast:', err);
      }
    }
    loadForecast();

    return () => {
      isCancelled = true;
    };
  }, [forecastMode]);

  // Animate Pulse Markers when real-time streaming collisions arrive
  useEffect(() => {
    if (!mapRef.current || !pulseLayerRef.current || !window.L || !pulseQueue || pulseQueue.length === 0) return;
    const L = window.L;
    const layer = pulseLayerRef.current;
    const latestEvent = pulseQueue[pulseQueue.length - 1];
    if (!latestEvent) return;

    const sevColor =
      latestEvent.sev === 1 ? '#ef4444' : latestEvent.sev === 2 ? '#f97316' : '#eab308';

    const pulseIcon = L.divIcon({
      className: 'pulse-icon-wrapper',
      html: `<div class="pulse-marker" style="border-color:${sevColor}; box-shadow:0 0 10px ${sevColor};"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    const marker = L.marker([latestEvent.lat, latestEvent.lon], { icon: pulseIcon }).addTo(layer);
    setTimeout(() => {
      if (layer && marker) layer.removeLayer(marker);
    }, 2200);
  }, [pulseQueue]);

  return (
    <>
      <div id="map-container">
        <div id="map"></div>
      </div>

      {/* Floating Legend */}
      <div className="map-legend-box">
        <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Heat Intensity:</span>
        <span>Low</span>
        <div className="legend-bar"></div>
        <span>High</span>
      </div>
    </>
  );
}
