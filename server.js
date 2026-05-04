const express = require("express");
const cors = require("cors");
require('dotenv').config();
const pool = require("./src/models/db");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Connecté à la base de données MySQL via pool promise");
    connection.release();
  } catch (err) {
    console.error("Erreur de connexion à la base de données:", err.message);
    process.exit(1); // ← l'app s'arrête ici si DB inaccessible
  }
})();

app.use((req, res, next) => {
  req.db = pool;
  next();
});

app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Bienvenue sur l'API DocSlot",
    status: 'API opérationnelle',
  });
});

app.use("/api/users", require("./src/routes/userRoutes"));
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/patients", require("./src/routes/patientRoutes"));
app.use("/api/medecins", require("./src/routes/medecinRoutes"));
app.use("/api/disponibilites", require("./src/routes/disponibiliteRoutes"));
app.use("/api/rendezvous", require("./src/routes/rendezvousRoutes"));
app.use("/api/notifications", require("./src/routes/notificationRoutes"));
app.use("/api/admin", require("./src/routes/adminRoutes"));

app.use((err, req, res, next) => {
  console.error("Erreur:", err.stack);
  res.status(500).json({
    success: false,
    errors: { general: "Erreur interne du serveur" },
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    errors: { general: "Route non trouvée" },
  });
});

module.exports = app;
