const express = require('express');
const router = express.Router();
const { getDistricts, getDistrict } = require('../controllers/districtController');

// GET /api/districts — all district summaries
router.get('/', getDistricts);

// GET /api/districts/:district — full detail for one district
router.get('/:district', getDistrict);

module.exports = router;
