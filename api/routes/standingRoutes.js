// Standing Routes - Jalur API Klasemen Battle of Champions
const express = require('express');
const router = express.Router();
const standingController = require('../controllers/standingController');

router.get('/', standingController.getStandings);
router.post('/reset', standingController.resetStandings);
router.post('/', standingController.updateStanding);

module.exports = router;
