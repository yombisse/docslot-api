# Diagnostic du problème de réservation de créneaux indisponibles

## 🐛 **Problème identifié**
Vous pouvez réserver des créneaux à **00:05** même à **4h ou 8h** du matin, alors que la disponibilité du médecin est définie de **00:00 à 06:00** (censée être indisponible après 6h, ou slots passés).

## 🔍 **Flux du code analysé**
```
1. Médecin crée dispo (ex: 2024-12-01, 00:00-06:00) 
   ↓ src/controllers/disponibiliteController.js#create
2. Génère créneaux auto (00:00, 00:15, ..., 06:00) 
   ↓ genererCreneaux() avec duree_creneau (15-120min)
   → TOUS marqués statut='libre'
3. Patient voit créneaux libres: GET /disponibilite/medecin/:id
   ↓ src/controllers/disponibiliteController.js#getDisponibilitesPourPatient
   → SELECT creneaux WHERE statut='libre' + pas de RDV
   ❌ **AUCUN filtre horaire vs heure actuelle !**
4. Sélectionne id_creneau=00:05 → POST /rendezvous
   ↓ src/controllers/rendezvousController.js#create
   → Vérifie SEULEMENT statut='libre' ✅ → réserve !
```

## 🚨 **Cause racine (2 problèmes)**
1. **`getDisponibilitesPourPatient` ne filtre PAS les créneaux **passés du jour courant** :
   ```sql
   -- ACTUEL (incorrect)
   WHERE d.id_medecin = ? AND r.id_rdv IS NULL AND c.statut='libre'
   -- FAIT retourner 00:05 à 4h du matin
   
   -- CORRECT devrait être:
   AND c.date_creneau >= CURDATE()
   AND CONCAT(c.date_creneau, ' ', c.heure_creneau) > NOW()
   ```

2. **`rendezvousController.create` ne valide PAS l'heure actuelle** :
   ```js
   // ACTUEL (insuffisant)
   SELECT ... WHERE id_creneau = ? AND statut='libre'
   
   // Ajouter:
   AND CONCAT(date_creneau, ' ', heure_creneau) > NOW()
   ```

## 📊 **Fichiers impactés**
| Fichier | Problème | Ligne approx |
|---------|----------|--------------|
| `src/controllers/disponibiliteController.js` | Pas de filtre temps dans `getDisponibilitesPourPatient` | Ligne 38-48 |
| `src/controllers/rendezvousController.js` | Pas de check temps dans `create` | Ligne 90-105 |
| `src/middleware/rendezvousValidateur.js` | Pas de validation temps | - |

## ✅ **Solution proposée (Plan de correction)**
```
1. ✅ AJOUTER filtre temps dans getDisponibilitesPourPatient:
   AND c.date_creneau >= CURDATE() 
   AND TIME(CONCAT(c.date_creneau, ' ', c.heure_creneau)) > CURTIME()

2. ✅ AJOUTER check temps dans rendezvoux.create:
   WHERE ... AND statut='libre' AND TIME(CONCAT(...)) > CURTIME()

3. ✅ Optionnel: middleware validateCreneauFuture() 
   Avant booking
```

## 🧪 **Test après correction**
```
1. Créer dispo 00:00-06:00 aujourd'hui
2. À 4h: GET disponibilites → **NE DOIT PLUS** voir 00:05
3. Essayer book 00:05 → erreur \"Créneau passé\"
```

**Voulez-vous que j'implémente ces corrections ?** Confirmez et je crée le plan détaillé + TODO.md.
