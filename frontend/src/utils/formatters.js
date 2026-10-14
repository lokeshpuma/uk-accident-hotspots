/**
 * HotspotWatch Data Formatting Utilities
 * Translates UK STATS19 raw code values into human-readable corridor and district labels.
 */

export function formatRoad(road) {
  if (!road) return 'UK Highway Corridor';
  const str = String(road).trim();

  // If already formatted nicely like "A40 Oxford St" or "M25 J12"
  if (/[a-zA-Z]{2,}/.test(str)) {
    return str;
  }

  // Handle STATS19 compound road strings: "Class Number", e.g. "3 1400", "5 0", "4 4100"
  if (str.includes(' ')) {
    const [cls, num] = str.split(/\s+/);
    const n = num && num !== '0' ? num : '';

    switch (cls) {
      case '1':
        return n ? `M${n} Motorway Corridor` : 'Strategic Motorway Corridor';
      case '2':
        return n ? `A${n}(M) Motorway Corridor` : 'A(M) Expressway';
      case '3':
        return n ? `A${n} Highway Corridor` : 'Major A-Road Trunk Corridor';
      case '4':
        return n ? `B${n} Distributor Corridor` : 'B-Road Secondary Link';
      case '5':
        return n ? `C${n} Urban Arterial Link` : 'Urban Arterial Connector';
      case '6':
        return 'Unclassified Urban Route';
      default:
        return n ? `Corridor Route ${n}` : 'Strategic Highway Corridor';
    }
  }

  // Numeric only without space
  if (/^\d+$/.test(str)) {
    return `Highway Corridor #${str}`;
  }

  return str;
}

export function formatDistrict(district, lat, lon) {
  const dStr = district !== undefined && district !== null ? String(district).trim() : '';

  // If missing, unassigned, or raw -1 code
  if (!dStr || dStr === '-1' || /^-?\d+$/.test(dStr)) {
    if (lat && lon) {
      const numLat = parseFloat(lat);
      const numLon = parseFloat(lon);

      if (numLat >= 51.25 && numLat <= 51.72 && numLon >= -0.55 && numLon <= 0.35) {
        return 'Greater London (SRN Central)';
      }
      if (numLat >= 52.35 && numLat <= 52.65 && numLon >= -2.15 && numLon <= -1.7) {
        return 'West Midlands (Birmingham SRN)';
      }
      if (numLat >= 53.35 && numLat <= 53.65 && numLon >= -2.45 && numLon <= -2.1) {
        return 'Greater Manchester (SRN North)';
      }
      if (numLat >= 53.7 && numLat <= 54.0 && numLon >= -1.8 && numLon <= -1.4) {
        return 'West Yorkshire (Leeds SRN)';
      }
      if (numLat >= 50.75 && numLat <= 51.0) {
        return 'South Coast / Sussex Corridor';
      }
      if (numLat >= 52.85 && numLat <= 53.15 && numLon >= -1.35 && numLon <= -1.0) {
        return 'East Midlands (Nottingham SRN)';
      }
      if (numLat >= 53.35 && numLat <= 53.5 && numLon >= -1.55 && numLon <= -1.35) {
        return 'South Yorkshire (Sheffield SRN)';
      }
    }
    return 'Strategic Road Network (UK SRN)';
  }

  return dStr;
}

export function formatSurface(surface) {
  const s = String(surface || '1').trim();
  switch (s) {
    case '1':
      return 'Dry';
    case '2':
      return 'Wet / Damp';
    case '3':
      return 'Snow';
    case '4':
      return 'Fine / Frost / Ice';
    case '5':
      return 'Flood (over 3cm)';
    case '6':
      return 'Oil or Diesel';
    case '7':
      return 'Mud';
    default:
      return s === 'Dry' || s === 'Wet / Damp' ? s : 'Dry';
  }
}
