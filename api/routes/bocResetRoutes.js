const express = require('express');
const router = express.Router();
const bocResetController = require('../controllers/bocResetController');

router.post('/', bocResetController.resetBoc);

module.exports = router;
