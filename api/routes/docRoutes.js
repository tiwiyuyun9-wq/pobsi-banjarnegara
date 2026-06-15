// Document Routes - Jalur API Surat Edaran & Dokumen Resmi POBSI
const express = require('express');
const router = express.Router();
const docController = require('../controllers/docController');

router.get('/', docController.getDocs);
router.post('/', docController.addDoc);
router.delete('/:id', docController.deleteDoc);

module.exports = router;
