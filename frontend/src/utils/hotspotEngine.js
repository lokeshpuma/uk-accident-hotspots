/**
 * Pure Client-Side Hotspot Detection & Analysis Engine
 * Implements PRD Section 5.2 (Upload), 5.3 (Schema Mapping), 5.4 (Validation), 5.5 (Scoring), and 5.11 (Sample Dataset)
 */

// Diurnal Time-Band Classifier (Section 5.7)
export function classifyTimeBand(timeStr) {
  if (!timeStr) return 'DAY';
  const clean = String(timeStr).trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 'DAY';

  const hour = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  const totalMins = hour * 60 + min;

  // AM_PEAK: 07:00 – 09:59 (420 - 599 mins)
  if (totalMins >= 420 && totalMins < 600) return 'AM_PEAK';
  // PM_PEAK: 16:00 – 18:59 (960 - 1139 mins)
  if (totalMins >= 960 && totalMins < 1140) return 'PM_PEAK';
  // DAY: 05:00 - 06:59 (300 - 419) and 10:00 - 15:59 (600 - 959)
  if ((totalMins >= 300 && totalMins < 420) || (totalMins >= 600 && totalMins < 960)) return 'DAY';
  // NIGHT: 19:00 - 04:59
  return 'NIGHT';
}

// Spatio-Temporal Grid Cell Calculator (Section 5.5)
export function computeGridCell(lat, lon, gridSize = 0.02) {
  const cellLat = Math.floor(lat / gridSize);
  const cellLon = Math.floor(lon / gridSize);
  return `${cellLat}:${cellLon}`;
}

// Robust Client-Side CSV Line Splitter
export function parseCsvRows(csvText) {
  // Strip UTF-8 BOM if present
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xFEFF) {
    cleanText = cleanText.slice(1);
  }

  const lines = cleanText.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const rowValues = parseLine(lines[i]);
    if (rowValues.length > 1) {
      const rowObj = {};
      headers.forEach((h, idx) => {
        rowObj[h] = rowValues[idx] || '';
      });
      rows.push(rowObj);
    }
  }

  return { headers, rows };
}

// Automatic Schema Mapping (Section 5.3)
export function autoDetectSchema(headers) {
  const lowerMap = {};
  headers.forEach((h) => {
    lowerMap[h.toLowerCase().replace(/[^a-z0-9]/g, '_')] = h;
  });

  const findHeader = (candidates) => {
    for (const c of candidates) {
      const normalized = c.toLowerCase().replace(/[^a-z0-9]/g, '_');
      for (const [key, orig] of Object.entries(lowerMap)) {
        if (key === normalized || key.includes(normalized)) {
          return orig;
        }
      }
    }
    return '';
  };

  return {
    id: findHeader(['collision_index', 'accident_id', 'id', 'incident_id', 'reference']),
    date: findHeader(['collision_date', 'accident_date', 'date', 'crash_date']),
    time: findHeader(['collision_time', 'accident_time', 'time']),
    lat: findHeader(['latitude', 'lat', 'y_coord', 'y']),
    lon: findHeader(['longitude', 'lon', 'lng', 'x_coord', 'x']),
    severity: findHeader(['collision_severity', 'accident_severity', 'severity', 'sev']),
    casualties: findHeader(['number_of_casualties', 'casualties', 'cas', 'injured']),
    vehicles: findHeader(['number_of_vehicles', 'vehicles', 'veh']),
  };
}

// Core Mathematical Hotspot Aggregation & Scoring Algorithm (Section 5.5)
export function computeHotspots({
  rows,
  schemaMapping,
  gridSize = 0.02,
  windowDays = 90,
  halfLifeDays = 30,
  severityWeights = { 1: 10, 2: 5, 3: 1 },
  customAsOfDate = null,
}) {
  const validRecords = [];
  const rejectedReasons = {
    missingCoords: 0,
    invalidDate: 0,
    outOfRangeCoords: 0,
    other: 0,
  };

  const seenIds = new Set();
  let duplicateCount = 0;

  // 1. Validate & Parse Raw Records
  rows.forEach((row, idx) => {
    const idVal = row[schemaMapping.id] || `rec_${idx}`;
    if (seenIds.has(idVal)) {
      duplicateCount++;
    } else {
      seenIds.add(idVal);
    }

    const rawLat = parseFloat(row[schemaMapping.lat]);
    const rawLon = parseFloat(row[schemaMapping.lon]);

    if (isNaN(rawLat) || isNaN(rawLon)) {
      rejectedReasons.missingCoords++;
      return;
    }

    if (rawLat < -90 || rawLat > 90 || rawLon < -180 || rawLon > 180 || (rawLat === 0 && rawLon === 0)) {
      rejectedReasons.outOfRangeCoords++;
      return;
    }

    // Parse Date (handles YYYY-MM-DD or DD/MM/YYYY)
    const rawDateStr = String(row[schemaMapping.date] || '').trim();
    let parsedDate = null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDateStr)) {
      parsedDate = new Date(rawDateStr + 'T12:00:00Z');
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rawDateStr)) {
      const parts = rawDateStr.split('/');
      parsedDate = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T12:00:00Z`);
    } else {
      const d = new Date(rawDateStr);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      rejectedReasons.invalidDate++;
      return;
    }

    // Severity extraction
    let sevNum = 3;
    const rawSev = String(row[schemaMapping.severity] || '').toLowerCase();
    if (rawSev.includes('1') || rawSev.includes('fatal')) sevNum = 1;
    else if (rawSev.includes('2') || rawSev.includes('serious')) sevNum = 2;
    else sevNum = 3;

    const timeVal = row[schemaMapping.time] || '12:00';
    const band = classifyTimeBand(timeVal);

    validRecords.push({
      id: idVal,
      lat: rawLat,
      lon: rawLon,
      date: parsedDate.toISOString().split('T')[0],
      time: timeVal,
      dateObj: parsedDate,
      sev: sevNum,
      cas: parseInt(row[schemaMapping.casualties], 10) || 1,
      veh: parseInt(row[schemaMapping.vehicles], 10) || 1,
      band,
      road: row['1st_Road_Class'] && row['1st_Road_Number'] ? `${row['1st_Road_Class']} ${row['1st_Road_Number']}` : (row['road'] || 'Highway Corridor'),
      district: row['local_authority_district'] || row['district'] || 'Strategic Road Network',
    });
  });

  if (validRecords.length === 0) {
    return {
      success: false,
      validationReport: {
        totalRows: rows.length,
        validRows: 0,
        duplicateCount,
        rejectedReasons,
      },
      top20: [],
      stats: { total_window_collisions: 0, fatal: 0, serious: 0, slight: 0 },
    };
  }

  // 2. Establish Reference As-Of Date
  let asOf = customAsOfDate ? new Date(customAsOfDate) : null;
  if (!asOf || isNaN(asOf.getTime())) {
    const latestTimestamp = Math.max(...validRecords.map((r) => r.dateObj.getTime()));
    asOf = new Date(latestTimestamp);
  }

  const asOfDateStr = asOf.toISOString().split('T')[0];
  const windowMillis = windowDays * 24 * 60 * 60 * 1000;
  const asOfMillis = asOf.getTime();

  // 3. Cluster and Apply Recency Decay Weighting (Section 5.5)
  const clusterMap = new Map();
  let fatalTotal = 0;
  let seriousTotal = 0;
  let slightTotal = 0;
  let windowCollisions = 0;

  validRecords.forEach((rec) => {
    const ageDays = Math.max(0, (asOfMillis - rec.dateObj.getTime()) / (1000 * 3600 * 24));
    // Check if within rolling window
    if (ageDays >= windowDays) return;

    windowCollisions++;
    if (rec.sev === 1) fatalTotal++;
    else if (rec.sev === 2) seriousTotal++;
    else slightTotal++;

    // Exponential Recency Decay Formula
    const decayFactor = Math.pow(0.5, ageDays / Math.max(1, halfLifeDays));
    const sevWeight = severityWeights[rec.sev] || 1;
    const scoreContribution = sevWeight * decayFactor;

    const cellId = computeGridCell(rec.lat, rec.lon, gridSize);
    const clusterKey = `${cellId}:${rec.band}`;

    if (!clusterMap.has(clusterKey)) {
      clusterMap.set(clusterKey, {
        cell: cellId,
        band: rec.band,
        score: 0,
        collisions: 0,
        fatal: 0,
        serious: 0,
        slight: 0,
        sumLat: 0,
        sumLon: 0,
        events: [],
      });
    }

    const c = clusterMap.get(clusterKey);
    c.score += scoreContribution;
    c.collisions += 1;
    if (rec.sev === 1) c.fatal += 1;
    else if (rec.sev === 2) c.serious += 1;
    else c.slight += 1;
    c.sumLat += rec.lat;
    c.sumLon += rec.lon;
    c.events.push(rec);
  });

  // 4. Rank Hotspots Deterministically
  const rankedClusters = Array.from(clusterMap.values())
    .map((c) => ({
      cell: c.cell,
      band: c.band,
      score: Number(c.score.toFixed(4)),
      collisions: c.collisions,
      lat: Number((c.sumLat / c.collisions).toFixed(6)),
      lon: Number((c.sumLon / c.collisions).toFixed(6)),
      fatal: c.fatal,
      serious: c.serious,
      slight: c.slight,
      name: `Corridor ${c.cell}`,
      district: 'Analyzed Region',
      is_new: false,
      economic_cost: Math.round(c.fatal * 2250000 + c.serious * 253000 + c.slight * 19500),
    }))
    .sort((a, b) => b.score - a.score);

  rankedClusters.forEach((h, idx) => {
    h.rank = idx + 1;
  });

  const top20 = rankedClusters.slice(0, 20);

  return {
    success: true,
    asOfDate: asOfDateStr,
    top20,
    allHotspots: rankedClusters,
    stats: {
      total_window_collisions: windowCollisions,
      fatal: fatalTotal,
      serious: seriousTotal,
      slight: slightTotal,
      pipeline_events_per_sec: 'N/A (Local Upload)',
    },
    validationReport: {
      totalRows: rows.length,
      validRows: validRecords.length,
      windowRecords: windowCollisions,
      duplicateCount,
      rejectedReasons,
      dateSpan: {
        asOf: asOfDateStr,
        windowDays,
      },
    },
  };
}

// Built-in Synthetic Demonstration Sample Dataset (Section 5.11)
export function generateSyntheticDemoDataset() {
  const baseLat = 51.5074;
  const baseLon = -0.1278;
  const rows = [];
  const severities = [1, 2, 2, 3, 3, 3, 3, 3];
  const times = ['08:15', '09:30', '12:00', '14:20', '17:45', '18:10', '21:30', '23:15'];

  for (let i = 0; i < 80; i++) {
    const latOffset = (Math.random() - 0.5) * 0.15;
    const lonOffset = (Math.random() - 0.5) * 0.18;
    const dayAgo = Math.floor(Math.random() * 85);
    const d = new Date(Date.now() - dayAgo * 86400000);
    const dateStr = d.toISOString().split('T')[0];

    rows.push({
      collision_index: `SYNTH-${1000 + i}`,
      date: dateStr,
      time: times[i % times.length],
      latitude: (baseLat + latOffset).toFixed(6),
      longitude: (baseLon + lonOffset).toFixed(6),
      collision_severity: severities[i % severities.length],
      number_of_casualties: severities[i % severities.length] === 1 ? 2 : 1,
      number_of_vehicles: Math.floor(Math.random() * 3) + 1,
    });
  }

  return rows;
}
