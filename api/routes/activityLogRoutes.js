const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');

router.get('/', activityLogController.getLogs);
router.post('/', activityLogController.addLog);

module.exports = router;
