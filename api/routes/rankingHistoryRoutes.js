const express = require('express');
const router = express.Router();
const rankingHistoryController = require('../controllers/rankingHistoryController');

router.get('/', rankingHistoryController.getRankingHistory);

module.exports = router;
