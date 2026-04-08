# TODO: Implementer routes notifications

## Plan d'implémentation (approuvé)

**Fichiers à créer:**
1. [x] src/controllers/notificationController.js - CRUD + méthodes user-specific
2. [x] src/middleware/notificationValidateur.js - validateurs Joi
3. [x] src/routes/notificationRoutes.js - routes Express
4. [x] Edit src/app.js - monter les routes

**Terminé!** 🎉

**Test routes:**
```bash
# Installer joi si pas présent
npm i joi

# Démarrer serveur
npm start

# Test my-notifications (avec token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/notifications/my-notifications
```

**Prochaines étapes suggérées:**
- Créer notifications lors RDV create/confirm/cancel
- Ajouter WebSocket pour real-time (optionnel)
