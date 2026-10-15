/**
 * Safe Export Utilities with Formula Injection Defense
 * Implements PRD Section 5.10 & Section 11.4
 */

export function sanitizeCsvCell(val) {
  if (val === null || val === undefined) return '';
  let str = String(val);
  // Formula injection defense: prepend single quote if starts with dangerous formula trigger characters
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  // Quote cell if it contains commas, double quotes, or newlines
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportHotspotsToCsv(hotspots, filename = 'ranked_hotspots.csv') {
  if (!hotspots || hotspots.length === 0) return;
  const headers = ['Rank', 'Cell_ID', 'Time_Band', 'Score', 'Collisions', 'Latitude', 'Longitude', 'Fatal', 'Serious', 'Slight', 'Corridor_Name', 'District'];
  const rows = [headers.join(',')];

  hotspots.forEach((h, i) => {
    const row = [
      h.rank || (i + 1),
      sanitizeCsvCell(h.cell || ''),
      sanitizeCsvCell(h.band || 'ALL'),
      (Number(h.score) || 0).toFixed(4),
      h.collisions || h.crashes || 0,
      (Number(h.lat) || 0).toFixed(6),
      (Number(h.lon) || 0).toFixed(6),
      h.fatal || h.fatal_count || 0,
      h.serious || h.serious_count || 0,
      h.slight || h.slight_count || 0,
      sanitizeCsvCell(h.name || h.road_name || 'Highway Corridor'),
      sanitizeCsvCell(h.district || h.district_name || 'Strategic Road Network'),
    ];
    rows.push(row.join(','));
  });

  triggerDownload(rows.join('\n'), filename, 'text/csv;charset=utf-8;');
}

export function exportCollisionsToCsv(collisions, filename = 'collision_records.csv') {
  if (!collisions || collisions.length === 0) return;
  const headers = ['ID', 'Date', 'Time', 'Latitude', 'Longitude', 'Severity', 'Casualties', 'Vehicles', 'Time_Band', 'Road', 'District'];
  const rows = [headers.join(',')];

  collisions.forEach((c) => {
    const row = [
      sanitizeCsvCell(c.id || ''),
      sanitizeCsvCell(c.date || ''),
      sanitizeCsvCell(c.time || ''),
      (Number(c.lat) || 0).toFixed(6),
      (Number(c.lon) || 0).toFixed(6),
      c.sev || c.severity || 3,
      c.cas || c.casualties || 1,
      c.veh || c.vehicles || 1,
      sanitizeCsvCell(c.band || 'DAY'),
      sanitizeCsvCell(c.road || ''),
      sanitizeCsvCell(c.district || ''),
    ];
    rows.push(row.join(','));
  });

  triggerDownload(rows.join('\n'), filename, 'text/csv;charset=utf-8;');
}

export function exportAnalysisSummaryJson(summaryData, filename = 'hotspot_analysis_summary.json') {
  const content = JSON.stringify(summaryData, null, 2);
  triggerDownload(content, filename, 'application/json');
}

export function exportHotspotsGeoJson(hotspots, filename = 'hotspots.geojson') {
  const features = (hotspots || []).map((h, i) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [Number(h.lon) || 0, Number(h.lat) || 0],
    },
    properties: {
      rank: h.rank || (i + 1),
      cell: h.cell,
      band: h.band,
      score: Number(h.score) || 0,
      collisions: h.collisions || 0,
      fatal: h.fatal || 0,
      serious: h.serious || 0,
      slight: h.slight || 0,
      name: h.name || 'Highway Corridor',
      district: h.district || 'Strategic Road Network',
    },
  }));

  const geoJson = {
    type: 'FeatureCollection',
    generated_at: new Date().toISOString(),
    features,
  };

  triggerDownload(JSON.stringify(geoJson, null, 2), filename, 'application/geo+json');
}
