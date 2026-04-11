## 🎯 FIX "0 créneaux trop court 06:00-07:00" 

**Log confirmé:** `⚠️ 0 créneaux (trop court: 06:00:00-07:00:00)`

### 📈 CAUSE: duree_creneau incompatible avec durée dispo

**Exemple math:**
```
Dispo: 06:00 → 07:00 = 60min
duree_creneau = 45min
- Créneau1: 06:00
- next = 06:45 < 07:00 → OK
- Créneau2: 06:45  
- next = 07:30 > 07:00 → STOP (2 créneaux)
```
**Si duree=60+min** → 1 seul ou 0 créneaux.

### 🔍 VÉRIF DB (exécutez):
```sql
-- Medecins avec longue duree_creneau
SELECT m.id_medecin, u.nom, m.duree_creneau, 
       TIMEDIFF('07:00:00','06:00:00') as dispo_duree
FROM medecins m JOIN users u ON m.id_user = u.id_user 
WHERE m.duree_creneau > 30;

-- Creneaux générés récemment
SELECT d.id_disponibilite, m.duree_creneau, COUNT(c.id_creneau)
FROM disponibilites d JOIN medecins m ON d.id_medecin = m.id_medecin
LEFT JOIN creneaux c ON d.id_disponibilite = c.id_disponibilite
GROUP BY d.id_disponibilite ORDER BY d.id_disponibilite DESC LIMIT 5;
```

### 🚀 3 SOLUTIONS:

**1️⃣ Fix DB (IMMEDIATE - 30s):**
```sql
-- Force 20-30min raisonnable
UPDATE medecins SET duree_creneau = GREATEST(15, LEAST(30, duree_creneau));

-- Test
SELECT nom, duree_creneau FROM medecins m JOIN users u ON m.id_user = u.id_user;
```
**→** Dispos 1h = 2-3 créneaux ✅

**2️⃣ Fix code genererCreneaux (sûr):**
Ajoutez au début fonction:
```js
duree = Math.max(15, Math.min(45, parseInt(duree) || 30));  // 15-45min safe
console.log(`Using duree_creneau: ${duree}min for dispo ${dispo.heure_debut}-${dispo.heure_fin}`);
```

**3️⃣ UI: Empêcher creation dispos trop courtes:**
Validation frontend: `if ((fin - debut)*60 < duree_creneau*1.1) error`

### ✅ PRIORITÉ:
1. **UPDATE DB** (ligne 1) → test IMMÉDIAT
2. Nouvelle dispos → log `✅ X créneaux`
3. Liste médecins **pleine** ✅

**Exécutez UPDATE → test → résultat?**
