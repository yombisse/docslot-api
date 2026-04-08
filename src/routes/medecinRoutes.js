const express = require("express");
const router = express.Router();
const medecinController = require("../controllers/medecinController");
const authMiddleware = require("../middleware/authMiddleware");

// 🔎 Liste tous les médecins
router.get("/", authMiddleware, medecinController.getAll);
// 📅 Liste médecins disponibles (résumé avec nombre de créneaux)
router.get("/available", authMiddleware, medecinController.getAvailableSummary);
// 🔎 Voir un médecin
router.get("/:id", authMiddleware, medecinController.getById);

// ➕ Ajouter un médecin
const { validateCreateMedecin } = require("../middleware/medecinValidateur");
router.post("/", authMiddleware, validateCreateMedecin, medecinController.create);

// ✏️ Mettre à jour un médecin
const { validateUpdateMedecin } = require("../middleware/medecinValidateur");
router.get("/:id/slots", authMiddleware, medecinController.getAvailableSlotsByMedecin);

// ✏️ Mettre à jour un médecin
router.put("/:id", authMiddleware, validateUpdateMedecin, medecinController.update);


// 🗑️ Supprimer un médecin
router.delete("/:id", authMiddleware, medecinController.delete);

module.exports = router;
