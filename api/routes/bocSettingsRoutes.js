const express = require('express');
const router = express.Router();
const bocSettingsController = require('../controllers/bocSettingsController');

router.get('/', bocSettingsController.getSettings);
router.post('/', bocSettingsController.saveSettings);

module.exports = router;
