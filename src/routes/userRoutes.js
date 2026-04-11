const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { validateCreateUser, validateUpdateUser } = require("../middleware/userValidateur");
const authMiddleware = require("../middleware/authMiddleware");

// Liste tous les utilisateurs
router.get("/", authMiddleware, userController.getAll);
// VOIR son profile
router.get("/profile", authMiddleware, userController.profile);
// Voir un utilisateur
//router.get("/:id", authMiddleware, userController.getById);
//Mettre à jour un utilisateur
router.put("/", authMiddleware, validateUpdateUser, userController.update);

//  Supprimer un utilisateur (soft delete)
router.delete("/:id", authMiddleware, userController.softDelete);

// Créer un nouvel utilisateur
router.post("/create", validateCreateUser, userController.create);

module.exports = router;
