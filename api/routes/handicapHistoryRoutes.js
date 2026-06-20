const express = require('express');
const router = express.Router();
const handicapHistoryController = require('../controllers/handicapHistoryController');

router.get('/', handicapHistoryController.getHandicapHistory);

module.exports = router;
