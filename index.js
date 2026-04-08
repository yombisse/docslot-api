const app = require("./server");
require('dotenv').config();
 

// Render fournit PORT via les variables d'environnement
const PORT = process.env.SERVER_PORT;

app.listen(PORT,'0.0.0.0',  () => {
  console.log(` Serveur démarré sur le port ${PORT}`);
  console.log(` API disponible sur http://127.0.0.1:${PORT}/api`);
});

module.exports = app;
