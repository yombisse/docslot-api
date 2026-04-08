const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const {validateUpdateUser } = require("../middleware/userValidateur");
const authMiddleware = require("../middleware/authMiddleware");

// Liste tous les utilisateurs
router.get("/", authMiddleware, userController.getAll);

// Voir un utilisateur
router.get("/:id", authMiddleware, userController.getById);
// voir son profile
router.get("/profile", authMiddleware, userController.profile);
//Mettre à jour un utilisateur
router.put("/:id", authMiddleware, validateUpdateUser, userController.update);

//  Supprimer un utilisateur (soft delete)
router.delete("/:id", authMiddleware, userController.delete);

module.exports = router;