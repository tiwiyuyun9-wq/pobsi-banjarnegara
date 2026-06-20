const express = require('express');
const router = express.Router();
const tournamentHistoryController = require('../controllers/tournamentHistoryController');

router.get('/', tournamentHistoryController.getTournamentHistory);

module.exports = router;
