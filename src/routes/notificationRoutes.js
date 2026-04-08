const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");
const { validateCreateNotification } = require("../middleware/notificationValidateur");

// Toutes notifications (admin)
router.get("/", authMiddleware, notificationController.getAll);

// Mes notifications
router.get("/my-notifications", authMiddleware, notificationController.getMyNotifications);

// Notification spécifique
router.get("/:id", authMiddleware, notificationController.getById);

// Créer notification
router.post("/", authMiddleware, validateCreateNotification, notificationController.create);

// Marquer comme lue
router.put("/:id/read", authMiddleware, notificationController.markAsRead);

// Marquer toutes comme lues
router.put("/my-notifications/read-all", authMiddleware, notificationController.markAllAsRead);

// Supprimer
router.delete("/:id", authMiddleware, notificationController.delete);

module.exports = router;
