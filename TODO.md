# TODO: Fix Medecin Disponibles & CRUD with Duree Creneaux

## Plan d'implémentation (approuvé par l'utilisateur)

### Étape 1: Créer/mettre à jour medecinValidateur.js
- Ajouter validation pour duree_creneau (int, 15-120 min)
- Exporter validateCreateMedecin, validateUpdateMedecin

**Status: ✅ Complète**

### Étape 2: Fix medecinController.js
- ✅ Corriger create(): SQL syntax & move duree_creneau to medecins table
- ✅ Corriger update(): Fix SQL params & store in medecins
- ✅ Rewrite getAvailable(): Proper JOINs via creneaux for libres slots
- ✅ Ajouter logs d'erreurs détaillés

**Status: ✅ Complète**

### Étape 3: Update medecinRoutes.js
- Ajouter medecinValidateur aux POST/PUT routes

**Status: ✅ Complète**

### Étape 4: Tests
- ⚠️ Redémarrer server si en cours (Ctrl+C puis node server.js)
- ✅ Test POST /medecins (avec duree_creneau)
- ✅ Test PUT /medecins/:id  
- ✅ Test GET /medecins/available (besoin de données disponibilites)

**Status: ⚠️ Manuel (redémarrage)**

### Étape 5: Vérification DB
- Assurer données test pour disponibilites/creneaux

**Status: ⏳ À faire**

---

Progress: 0/5 étapes complètes

