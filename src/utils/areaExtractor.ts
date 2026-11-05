/**
 * Comprehensive Area / Locality Extractor from School Name, Address, and Google Maps queries
 */

const KNOWN_AREAS = [
  // Hubli localities & corridors
  'Vidyanagar',
  'Keshwapur',
  'Old Hubli',
  'Gokul Road',
  'Navanagar',
  'Rajnagar',
  'Unkal',
  'Deshpande Nagar',
  'Shirur Park',
  'Bengeri',
  'Gopankoppa',
  'Ashok Nagar',
  'Akshay Colony',
  'Kusugal Road',
  'Gabbur',
  'Tarihal',
  'Rayapur',
  'Sattur',
  'Kalyan Nagar',
  'PB Road',
  'Lingaraj Nagar',
  'Bhavani Nagar',
  'CBT',
  'Court Circle',
  'Hosur',
  'Station Road',
  'Settlement',
  'Bhairidevarakoppa',
  'Manjunath Nagar',
  'Shanti Nagar',
  'Nehru Nagar',
  'Subhash Nagar',
  'Adarsh Nagar',
  'Shri Nagar',
  'Anand Nagar',
  'Santosh Nagar',
  'Sirur Park',
  'Airport Road',
  'Gadag Road',
  'Karwar Road',
  'Solapur Road',
  'Kusugal',
  'Amargol',
  'Navalur',
  
  // Dharwad localities & corridors
  'Vidyagiri',
  'Saptapur',
  'Kelgeri',
  'Gandhi Nagar',
  'Tejaswi Nagar',
  'Malamaddi',
  'Line Bazaar',
  'Kamalapur',
  'Haliyal Road',
  'Belur Industrial Area',
  'Saraswatpur',
  'Narayanpur',
  'Jubilee Circle',
  'DC Compound',
  'Maratha Colony',
  'Karnataka University Campus',
  'UAS Dharwad Campus',

  // Surrounding Taluks / Hubli-Dharwad Regions
  'Navalagund',
  'Kundgol',
  'Kalghatgi',
  'Alnavar',
  'Hubli Rural',
  'Hubli Urban',
  'Dharwad Rural',
  'Dharwad Urban',

  // Major Karnataka Education Hubs & Metro Suburbs
  'Tilakwadi',
  'Camp Belagavi',
  'Shahapur',
  'Vadgaon',
  'Udyambag',
  'Kuvempu Nagar',
  'Saraswathipuram',
  'Vijayanagar',
  'Indiranagar',
  'Jayanagar',
  'Koramangala',
  'Whitefield',
  'Rajajinagar',
  'Malleshwaram',
  'Sadashivnagar',
  'Hebbal',
  'Yelahanka',
  'Electronic City',
  'Bannerghatta Road',
  'HSR Layout',
  'BTM Layout',
];

const AREA_SUFFIX_REGEX = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(?:Nagar|Colony|Layout|Park|Road|Cross|Circle|Campus|Compound|Extension|Extn|Galli|Koppa|Halli|Keri|Pura|Pur|Bazaar|Industrial Area|Zone|Sector|Ward))\b/i;

/**
 * Clean up area text
 */
function sanitizeArea(val: string): string {
  if (!val) return '';
  return val
    .replace(/^[\s,./\\-]+|[\s,./\\-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligently extract area/locality from school name, raw text, or Google Maps query
 */
export function extractAreaFromSchool(
  schoolName: string,
  rawArea?: string,
  city?: string,
  address?: string
): string {
  const existingArea = sanitizeArea(rawArea || '');

  // If existingArea is already specific (not generic city name or empty), use it
  const isGeneric = !existingArea || 
    /^(hubli|dharwad|hubli[- ]dharwad|karnataka|india|city|district|unknown|not provided|n\/a|main|sheet\s*\d*)$/i.test(existingArea);

  if (!isGeneric && existingArea.length > 2) {
    // Check if existingArea has a recognized format
    return existingArea;
  }

  const combinedSearchText = `${schoolName || ''} ${address || ''}`.trim();
  if (!combinedSearchText) {
    return existingArea || city || 'Hubli';
  }

  // 1. Direct match with Known Localities (case-insensitive boundary check)
  for (const known of KNOWN_AREAS) {
    const regex = new RegExp(`\\b${known.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(combinedSearchText)) {
      return known;
    }
  }

  // 2. Check for parenthetical area: e.g. "Govt Model High School (Old Hubli)" or "(Vidyanagar)"
  const parenMatch = schoolName.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    const inside = sanitizeArea(parenMatch[1]);
    if (!/cbse|icse|state|govt|school|kannada|english|medium|aided|unaided|boys|girls|co-ed/i.test(inside)) {
      if (inside.length >= 3 && inside.length <= 35) {
        return inside;
      }
    }
  }

  // 3. Check for comma-separated area right before City: e.g. "KLE School, Vidyanagar, Hubli"
  const commaParts = combinedSearchText.split(',').map((p) => sanitizeArea(p)).filter(Boolean);
  if (commaParts.length >= 2) {
    // If the last part is City ("Hubli", "Dharwad", etc.), the second-to-last part is often Area
    const lastPart = commaParts[commaParts.length - 1].toLowerCase();
    if (lastPart.includes('hubli') || lastPart.includes('dharwad') || (city && lastPart.includes(city.toLowerCase()))) {
      const candidate = commaParts[commaParts.length - 2];
      if (candidate && !/school|vidyalaya|academy|college|institute|particulars/i.test(candidate)) {
        if (candidate.length >= 3 && candidate.length <= 40) {
          return candidate;
        }
      }
    }
  }

  // 4. Check for Area Suffixes: e.g. "Shirur Park", "Gokul Road", "Akshay Colony", "Kalyan Nagar"
  const suffixMatch = combinedSearchText.match(AREA_SUFFIX_REGEX);
  if (suffixMatch && suffixMatch[1]) {
    const candidate = sanitizeArea(suffixMatch[1]);
    if (candidate.length >= 4 && !/High School|Primary School|Senior Secondary/i.test(candidate)) {
      return candidate;
    }
  }

  // 5. Check for "Near ...", "Opp ...", "Behind ..."
  const landmarkMatch = combinedSearchText.match(/\b(?:near|opp|behind|beside)\s+([A-Za-z0-9\s]+?)(?:,|\.|$|\s+(?:hubli|dharwad))/i);
  if (landmarkMatch && landmarkMatch[1]) {
    const candidate = sanitizeArea(landmarkMatch[1]);
    if (candidate.length >= 3 && candidate.length <= 35) {
      return candidate;
    }
  }

  // 6. Fallback to existingArea or City
  return existingArea || city || 'Hubli';
}

/**
 * Return all distinct areas found in a list of schools
 */
export function getUniqueAreas(schools: Array<{ area?: string; city?: string; name: string }>): string[] {
  const set = new Set<string>();
  schools.forEach((s) => {
    const area = extractAreaFromSchool(s.name, s.area, s.city);
    if (area) set.add(area);
  });
  return Array.from(set).sort();
}
