const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");


router.get("/unread-count", authMiddleware, notificationController.getUnreadCount);

// Mes notifications
router.get("/me", authMiddleware, notificationController.getMyNotifications);

// Une notification
router.get("/:id", authMiddleware, notificationController.getById);

// Marquer une comme lue
router.put("/:id/read", authMiddleware, notificationController.markAsRead);

// Marquer toutes comme lues
router.put("/read-all", authMiddleware, notificationController.markAllAsRead);

// Supprimer (optionnel)
router.delete("/:id", authMiddleware, notificationController.delete);

// Admin : lecture globale
router.get("/", authMiddleware, notificationController.getAll);

module.exports = router;