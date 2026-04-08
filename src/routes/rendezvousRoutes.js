const express = require("express");
const router = express.Router();
const rdvController = require("../controllers/rendezvousController");
const authMiddleware = require("../middleware/authMiddleware");
const {validateCreateRendezVous,validateUpdateRendezVous}=require("../middleware/rendezvousValidateur")

// Liste tous les rendez-vous
router.get("/", authMiddleware, rdvController.getAll);
// Liste les rendez vous d'un patient
router.get("/myrdv",authMiddleware,rdvController.getMesRdv)
// Voir un rendez-vous
router.get("/:id", authMiddleware, rdvController.getById);

//  Créer un rendez-vous
router.post("/", authMiddleware, rdvController.create);

// confirmer un rendez-vous
router.put("/:id", authMiddleware,validateUpdateRendezVous, rdvController.confirm);
/* OLD dupe: Second router.put("/:id", ...) overrides confirm. 
Reason: Only cancel works, confirm dead. Fix: Separate endpoints. */

// annuler un RDV
router.put("/:id/cancel", authMiddleware, validateUpdateRendezVous, rdvController.cancel);
// confirmer un RDV
router.put("/:id/confirm", authMiddleware, validateUpdateRendezVous, rdvController.confirm);

module.exports = router;
