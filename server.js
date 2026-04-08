// app.js - Serveur final complet avec mysql2/promise pool
const express = require("express");
const cors = require("cors");
const pool = require("./src/models/db"); // ton pool promisifié
require('dotenv').config();
// const path = require("path");

const app = express();

// // Permet de servir les fichiers statiques
// app.use(express.static(path.join(__dirname, "public")));

// Middleware global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test de connexion au pool
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Connecté à la base de données MySQL via pool promise");
    connection.release();
  } catch (err) {
    console.error("Erreur de connexion à la base de données:", err.message);
    process.exit(1);
  }
})();

// Middleware pour injecter le pool dans req
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// // Page d'accueil / Documentation (fichier statique)
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "home.html"));
// });

// API Routes
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bienvenue sur l’API DocSlot 🚀',
    status: 'API opérationnelle',
  });
});
app.use("/api/users", require("./src/routes/userRoutes"));
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/patients", require("./src/routes/patientRoutes"));
app.use("/api/medecins", require("./src/routes/medecinRoutes"));
app.use("/api/disponibilites", require("./src/routes/disponibiliteRoutes"));
app.use("/api/rendezvous", require("./src/routes/rendezvousRoutes"));


// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error("Erreur:", err.stack);
  res.status(500).json({
    success: false,
    errors: { general: "Erreur interne du serveur" },
  });
});

// Gestion des routes 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    errors: { general: "Route non trouvée" },
  });
});

module.exports = app;