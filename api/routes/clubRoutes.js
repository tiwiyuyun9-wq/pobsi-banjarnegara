// Club Routes - Jalur API Klub Biliar
const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');

router.get('/', clubController.getClubs);
router.post('/', clubController.addClub);
router.delete('/:id', clubController.deleteClub);
router.put('/:id', clubController.updateClub);

module.exports = router;
