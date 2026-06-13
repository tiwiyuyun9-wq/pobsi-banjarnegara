// Player Routes - Jalur API Atlet Handicap
const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

router.get('/', playerController.getPlayers);
router.post('/', playerController.addPlayer);
router.put('/:id', playerController.updatePlayer);
router.delete('/:id', playerController.deletePlayer);

module.exports = router;
