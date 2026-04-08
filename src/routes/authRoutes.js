const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { validateCreateUser } = require("../middleware/userValidateur");
const authMiddleware = require("../middleware/authMiddleware");

// Inscription
router.post("/register", validateCreateUser, authController.register);

// Connexion
router.post("/login", authController.login);

// Mot de passe oublié
router.post("/forgot-password", authController.forgotPassword);

// Vérifier si un email existe
router.post("/check-email", authController.checkEmailExists);

// route protegées
//  Déconnexion (côté client, token à supprimer)
router.post("/logout", authMiddleware, authController.logout);
//  Changer le mot de passe (utilisateur connecté)
router.post("/change-password", authMiddleware, authController.changePassword);

module.exports = router;