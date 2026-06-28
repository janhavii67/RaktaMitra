/**
 * eRaktKosh Data Service
 *
 * Attempts to fetch Maharashtra blood bank data from the eRaktKosh portal.
 * Falls back to realistic mock data if the API is unreachable or blocked.
 *
 * To plug in the real API later, only update `fetchFromEraktKosh()`.
 */

const axios = require('axios');

// Known eRaktKosh API base (may require auth tokens — we try gracefully)
const ERAKTKOSH_BASE = 'https://eraktkosh.mohfw.gov.in/BLDAHIMS/bloodbank/nearbyBB.cnt';

const MAHARASHTRA_STATE_CODE = '27'; // Maharashtra state code

/**
 * Attempt to fetch from eRaktKosh portal API.
 * Returns array of normalized blood bank objects, or null on failure.
 */
async function fetchFromEraktKosh() {
  try {
    const response = await axios.get(ERAKTKOSH_BASE, {
      params: {
        stateCode: MAHARASHTRA_STATE_CODE,
        districtCode: '0',
        bloodGroup: '0',
        bloodComponent: '0',
        hbtype: '0',
      },
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; RaktaMitra/1.0)',
      },
    });

    if (response.data && Array.isArray(response.data)) {
      return response.data.map(normalizeEraktKoshRecord);
    }
    return null;
  } catch (err) {
    console.warn('[eRaktKosh] API unavailable:', err.message);
    return null;
  }
}

/**
 * Normalize a raw eRaktKosh record to our BloodBank schema shape.
 */
function normalizeEraktKoshRecord(record) {
  return {
    bankId: `ERK-${record.bbd_id || record.id || Math.random().toString(36).slice(2)}`,
    name: record.bbd_name || record.name || 'Unknown Blood Bank',
    district: record.district_name || record.district || 'Unknown',
    address: record.bbd_address || record.address || '',
    contact: record.bbd_contactno || record.contact || '',
    email: record.bbd_email || record.email || '',
    lat: parseFloat(record.bbd_lat || record.lat) || null,
    lng: parseFloat(record.bbd_lng || record.lng) || null,
    availability: {
      'A+':  parseInt(record['A+']  || record.apos  || 0),
      'A-':  parseInt(record['A-']  || record.aneg  || 0),
      'B+':  parseInt(record['B+']  || record.bpos  || 0),
      'B-':  parseInt(record['B-']  || record.bneg  || 0),
      'AB+': parseInt(record['AB+'] || record.abpos || 0),
      'AB-': parseInt(record['AB-'] || record.abneg || 0),
      'O+':  parseInt(record['O+']  || record.opos  || 0),
      'O-':  parseInt(record['O-']  || record.oneg  || 0),
    },
    lastUpdated: new Date(),
    source: 'eRaktKosh',
  };
}

/**
 * Realistic mock data for all Maharashtra districts.
 * Used as fallback when eRaktKosh API is unavailable.
 */
function getMockMaharashtraData() {
  const districts = [
    { name: 'Mumbai',         banks: 24, base: 280 },
    { name: 'Pune',           banks: 18, base: 220 },
    { name: 'Nagpur',         banks: 14, base: 180 },
    { name: 'Nashik',         banks: 12, base: 160 },
    { name: 'Thane',          banks: 16, base: 200 },
    { name: 'Aurangabad',     banks: 10, base: 130 },
    { name: 'Solapur',        banks:  8, base: 100 },
    { name: 'Kolhapur',       banks:  8, base: 110 },
    { name: 'Satara',         banks:  6, base:  80 },
    { name: 'Sangli',         banks:  6, base:  85 },
    { name: 'Ratnagiri',      banks:  5, base:  60 },
    { name: 'Sindhudurg',     banks:  3, base:  30 },
    { name: 'Raigad',         banks:  7, base:  90 },
    { name: 'Palghar',        banks:  6, base:  75 },
    { name: 'Ahmednagar',     banks:  9, base: 115 },
    { name: 'Jalgaon',        banks:  8, base: 100 },
    { name: 'Dhule',          banks:  5, base:  65 },
    { name: 'Nandurbar',      banks:  4, base:  40 },
    { name: 'Buldhana',       banks:  5, base:  55 },
    { name: 'Akola',          banks:  5, base:  70 },
    { name: 'Washim',         banks:  3, base:  35 },
    { name: 'Amravati',       banks:  7, base:  90 },
    { name: 'Yavatmal',       banks:  5, base:  60 },
    { name: 'Wardha',         banks:  4, base:  50 },
    { name: 'Chandrapur',     banks:  5, base:  65 },
    { name: 'Bhandara',       banks:  3, base:  35 },
    { name: 'Gondia',         banks:  4, base:  45 },
    { name: 'Gadchiroli',     banks:  2, base:  20 },
    { name: 'Jalna',          banks:  4, base:  50 },
    { name: 'Hingoli',        banks:  3, base:  30 },
    { name: 'Parbhani',       banks:  4, base:  48 },
    { name: 'Nanded',         banks:  7, base:  88 },
    { name: 'Latur',          banks:  6, base:  75 },
    { name: 'Osmanabad',      banks:  4, base:  42 },
    { name: 'Beed',           banks:  5, base:  55 },
    { name: 'Mumbai Suburban',banks: 20, base: 250 },
  ];

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  // Realistic distribution ratios
  const ratios = [0.28, 0.06, 0.22, 0.04, 0.10, 0.02, 0.26, 0.02];

  const records = [];

  districts.forEach(({ name: district, banks, base }) => {
    for (let i = 1; i <= banks; i++) {
      // Add ±30% variance per bank
      const variance = 0.7 + Math.random() * 0.6;
      const bankTotal = Math.round((base / banks) * variance * 2);

      const availability = {};
      bloodTypes.forEach((bt, idx) => {
        availability[bt] = Math.max(0, Math.round(bankTotal * ratios[idx] + (Math.random() * 6 - 3)));
      });

      records.push({
        bankId: `MOCK-${district.replace(/\s+/g, '')}-${i}`,
        name: `${district} Blood Bank ${i}`,
        district,
        address: `${i} Hospital Road, ${district}, Maharashtra`,
        contact: `02${Math.floor(2000000000 + Math.random() * 999999999)}`,
        email: `bloodbank${i}@${district.toLowerCase().replace(/\s/g, '')}.gov.in`,
        lat: null,
        lng: null,
        availability,
        lastUpdated: new Date(),
        source: 'mock',
      });
    }
  });

  return records;
}

/**
 * Main export: fetch blood bank data (real or mock).
 */
async function fetchBloodBankData() {
  const realData = await fetchFromEraktKosh();
  if (realData && realData.length > 0) {
    console.log(`[eRaktKosh] ✅ Fetched ${realData.length} real records`);
    return realData;
  }
  const mockData = getMockMaharashtraData();
  console.log(`[eRaktKosh] ⚠️  Using mock data (${mockData.length} records)`);
  return mockData;
}

module.exports = { fetchBloodBankData };
