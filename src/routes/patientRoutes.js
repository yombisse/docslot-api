const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const authMiddleware = require("../middleware/authMiddleware");
const {validateCreatePatient,validateUpdatePatient}=require("../middleware/patientValidateur");

// Liste tous les patients
router.get("/", authMiddleware, patientController.getAll);

//  Voir un patient
router.get("/:id", authMiddleware, patientController.getById);

//  Ajouter un patient
router.post("/", authMiddleware, validateCreatePatient, patientController.create);

// Mettre à jour un patient
router.put("/:id", authMiddleware, validateUpdatePatient, patientController.update);

//Supprimer un patient
router.delete("/:id", authMiddleware, patientController.delete);

module.exports = router;