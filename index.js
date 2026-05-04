require('dotenv').config(); // doit être EN PREMIER

const app = require("./server");

const PORT = process.env.PORT || process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`API disponible sur http://127.0.0.1:${PORT}/api`);
});

module.exports = app;
