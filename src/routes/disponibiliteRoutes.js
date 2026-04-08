const express = require("express");
const router = express.Router();
const disponibiliteController = require("../controllers/disponibiliteController");

// Middleware pour vérifier que l'utilisateur est connecté
const authMiddleware = require("../middleware/authMiddleware");
/* OLD: const validateCreateDisponibilite=require("../middleware/disponibiliteValidateur")
Reason: Imported object { validateCreateDisponibilite }, but used as fn → TypeError 'not a function'. */

const { validateCreateDisponibilite, validateUpdateDisponibilite } = require("../middleware/disponibiliteValidateur")  /* NEW: Destructure to get function directly. Matches other routes (patient/user). */

// Voir mes disponibilités (médecin connecté)
router.get("/mine", authMiddleware, disponibiliteController.getPlanningMedecin);

// Voir les disponibilités d’un médecin
router.get("/medecin/:id", authMiddleware, disponibiliteController.getDisponibilitesPourPatient);
// Ajouter une disponibilité
router.post("/", authMiddleware,validateCreateDisponibilite, disponibiliteController.create);
// Modifier une disponibilité
router.put("/:id", authMiddleware, validateUpdateDisponibilite, disponibiliteController.update);
// Supprimer une disponibilité
router.put("/annuler/:id", authMiddleware, disponibiliteController.annuler);

module.exports = router;