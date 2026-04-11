const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// 🏠 Dashboard stats principales (temps réel)
router.get('/stats', authMiddleware, adminMiddleware, adminController.getDashboardStats);

// 📈 Stats RDV détaillées
router.get('/rdv-stats', authMiddleware, adminMiddleware, adminController.getRdvStats);

module.exports = router;
