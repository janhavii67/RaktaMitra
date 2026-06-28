/**
 * District Controller
 *
 * Aggregates blood bank data by district and returns
 * summary or detailed responses.
 */

const BloodBank = require('../models/BloodBank');

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * Compute availability status from total units.
 */
function getStatus(totalUnits) {
  if (totalUnits >= 500) return 'HIGH';
  if (totalUnits >= 200) return 'MEDIUM';
  if (totalUnits >= 50)  return 'LOW';
  if (totalUnits >= 1)   return 'CRITICAL';
  return 'NO DATA';
}

/**
 * GET /api/districts
 * Returns a summary array of all districts with totalUnits, status, bloodBanks count.
 */
const getDistricts = async (req, res) => {
  try {
    // Aggregate: group by district, sum all blood type fields, count banks
    const pipeline = [
      {
        $group: {
          _id: '$district',
          bloodBanks: { $sum: 1 },
          'A+':  { $sum: '$availability.A+' },
          'A-':  { $sum: '$availability.A-' },
          'B+':  { $sum: '$availability.B+' },
          'B-':  { $sum: '$availability.B-' },
          'AB+': { $sum: '$availability.AB+' },
          'AB-': { $sum: '$availability.AB-' },
          'O+':  { $sum: '$availability.O+' },
          'O-':  { $sum: '$availability.O-' },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const results = await BloodBank.aggregate(pipeline);

    const districts = results.map((r) => {
      const totalUnits = BLOOD_TYPES.reduce((sum, bt) => sum + (r[bt] || 0), 0);
      return {
        district: r._id,
        totalUnits,
        status: getStatus(totalUnits),
        bloodBanks: r.bloodBanks,
      };
    });

    res.json(districts);
  } catch (err) {
    console.error('[districtController] getDistricts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch district data' });
  }
};

/**
 * GET /api/districts/:district
 * Returns full detail for a single district including all blood banks.
 */
const getDistrict = async (req, res) => {
  try {
    const districtName = decodeURIComponent(req.params.district);

    // Case-insensitive match
    const banks = await BloodBank.find({
      district: { $regex: new RegExp(`^${districtName}$`, 'i') },
    }).lean();

    if (!banks || banks.length === 0) {
      return res.status(404).json({ error: `No data found for district: ${districtName}` });
    }

    // Compute district totals
    const totals = { 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0 };
    banks.forEach((bank) => {
      BLOOD_TYPES.forEach((bt) => {
        totals[bt] += bank.availability?.[bt] || 0;
      });
    });
    const totalUnits = Object.values(totals).reduce((a, b) => a + b, 0);

    const bloodBankList = banks.map((bank) => ({
      name: bank.name,
      address: bank.address,
      contact: bank.contact,
      email: bank.email,
      'A+':  bank.availability?.['A+']  || 0,
      'A-':  bank.availability?.['A-']  || 0,
      'B+':  bank.availability?.['B+']  || 0,
      'B-':  bank.availability?.['B-']  || 0,
      'AB+': bank.availability?.['AB+'] || 0,
      'AB-': bank.availability?.['AB-'] || 0,
      'O+':  bank.availability?.['O+']  || 0,
      'O-':  bank.availability?.['O-']  || 0,
      lastUpdated: bank.lastUpdated,
    }));

    res.json({
      district: banks[0].district,
      totalUnits,
      status: getStatus(totalUnits),
      bloodBanks: bloodBankList,
    });
  } catch (err) {
    console.error('[districtController] getDistrict error:', err.message);
    res.status(500).json({ error: 'Failed to fetch district detail' });
  }
};

module.exports = { getDistricts, getDistrict };
