/**
 * Blood Bank Sync Service
 *
 * Orchestrates fetching data from eRaktKosh and upserting into MongoDB.
 * Uses bankId as the unique key — no duplicates ever created.
 */

const BloodBank = require('../models/BloodBank');
const { fetchBloodBankData } = require('./eraktKoshService');

async function syncBloodBanks() {
  console.log('[Sync] 🔄 Starting blood bank data sync...');
  const startTime = Date.now();

  try {
    const records = await fetchBloodBankData();

    if (!records || records.length === 0) {
      console.warn('[Sync] ⚠️  No records returned — skipping sync.');
      return;
    }

    // Bulk upsert: match on bankId, update availability + lastUpdated
    const bulkOps = records.map((record) => ({
      updateOne: {
        filter: { bankId: record.bankId },
        update: {
          $set: {
            name: record.name,
            district: record.district,
            address: record.address,
            contact: record.contact,
            email: record.email,
            lat: record.lat,
            lng: record.lng,
            availability: record.availability,
            lastUpdated: record.lastUpdated,
            source: record.source,
          },
        },
        upsert: true,
      },
    }));

    const result = await BloodBank.bulkWrite(bulkOps, { ordered: false });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `[Sync] ✅ Done in ${elapsed}s — ` +
      `inserted: ${result.upsertedCount}, updated: ${result.modifiedCount}`
    );
  } catch (err) {
    console.error('[Sync] ❌ Sync failed:', err.message);
  }
}

module.exports = { syncBloodBanks };
