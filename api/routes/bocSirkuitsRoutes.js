const express = require('express');
const router = express.Router();
const bocSirkuitsController = require('../controllers/bocSirkuitsController');

router.get('/', bocSirkuitsController.getSirkuits);
router.post('/', bocSirkuitsController.saveSirkuits);

module.exports = router;
