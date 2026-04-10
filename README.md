# 🚀 DocSlot API

[![Node.js](https://img.shields.io/badge/Node.js-v20-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-orange.svg)](https://www.mysql.com/)
[![License ISC](https://img.shields.io/badge/License-ISC-purple.svg)](LICENSE)

## 📄 Description
**DocSlot API** est une API RESTful complète pour la gestion de rendez-vous médicaux. Elle permet aux **patients** de prendre des rendez-vous et aux **médecins** de gérer leurs disponibilités et plannings.

**Fonctionnalités principales :**
- 👥 Gestion multi-rôles (patient, médecin)
- 📅 Prise de rendez-vous avec créneaux automatiques
- 🔐 Authentification JWT sécurisée
- 🗓️ Planning intelligent (créneaux libres/réservés)
- 📱 Compatible mobile/web

**Base de données :** MySQL avec transactions ACID.

**Status API :** `GET /api` ✅

## 🚀 Démarrage rapide

### Prérequis
- Node.js ≥ 18
- MySQL 8.x
- Git

### Installation
```bash
git clone <repo-url>
cd docslot-api
npm install
```

### Configuration
Créez `.env` :
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=docslot
JWT_SECRET=your-super-secret-jwt-key-32chars-min
SERVER_PORT=3000
```

**Importez le schéma :**
```bash
mysql -u root -p docslot < schema.sql
```

### Lancement
```bash
npm start
# ou
node index.js
```

**API prête sur :** `http://localhost:3000/api`

### Test rapide
```bash
curl http://localhost:3000/api
# → {\"success\":true,\"message\":\"Bienvenue sur l'API DocSlot 🚀\"}
```

## 🔑 Authentification
- **JWT Bearer Token** (exp: 1h)
- Header : `Authorization: Bearer <token>`

**Flux typique :**
1. `POST /api/auth/register` → Crée user + profil (patient/medecin)
2. `POST /api/auth/login` → `{token, user}`
3. Ajoutez `Authorization: Bearer ${token}` à toutes les routes protégées

## 📚 Documentation des Endpoints

### 1. **Authentification** (`/api/auth`)
| Méthode | Endpoint | Auth | Description | Corps Exemple | Réponse |
|---------|----------|------|-------------|---------------|---------|
| `POST` | `/register` | ❌ | Inscription | `{\"nom\":\"Dupont\",\"prenom\":\"Jean\",\"email\":\"jean@example.com\",\"password\":\"123456\",\"role\":\"patient\"}` | `{success:true, data:{id_user,nom,...}}` |
| `POST` | `/login` | ❌ | Connexion | `{\"email\":\"...\",\"password\":\"...\"}` | `{success:true, token:\"...\", user:{id,role}}` |
| `POST` | `/change-password` | ✅ | Changer MDP | `{\"oldPassword\":\"...\",\"newPassword\":\"...\"}` | `{success:true}` |
| `POST` | `/forgot-password` | ❌ | Reset MDP | `{\"email\":\"...\",\"newPassword\":\"...\"}` | `{success:true}` |
| `POST` | `/check-email` | ❌ | Vérif email | `{\"email\":\"...\"}` | `{success:true, exists:true/false}` |

### 2. **Utilisateurs** (`/api/users`)
| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/` | ✅ | Liste users (`?role=patient/medecin`) |
| `GET` | `/profile` | ✅ | Mon profil |
| `PUT` | `/` | ✅ | Update profil |
| `DELETE` | `/:id` | ✅ | Soft delete |

### 3. **Médecins** (`/api/medecins`)
| Méthode | Endpoint | Auth | Description | Params/Corps |
|---------|----------|------|-------------|--------------|
| `GET` | `/` | ✅ | Liste (`?search=Jean`) |
| `GET` | `/available` | ✅ | Médecins avec créneaux libres |
| `GET` | `/:id` | ✅ | Détails medecin (id_medecin) |
| `GET` | `/:id/slots` | ✅ | Créneaux libres |
| `POST` | `/` | ✅ | Créer médecin |
| `PUT` | `/:id` | ✅ | Update |
| `DELETE` | `/:id` | ✅ | Soft delete |

### 4. **Patients** (`/api/patients`)
| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/` | ✅ | Liste (`?search=`) |
| `GET` | `/:id` | ✅ | Détails (id_patient) |
| `POST` | `/` | ✅ | Créer/compléter |
| `PUT` | `/:id` | ✅ | Update infos |
| `DELETE` | `/:id` | ✅ | Soft delete |

### 5. **Disponibilités** (`/api/disponibilites`)
| Méthode | Endpoint | Auth | Description | Params/Corps |
|---------|----------|------|-------------|--------------|
| `GET` | `/mine` | ✅ | Mon planning (médecin) |
| `GET` | `/medecin/:id` | ✅ | Créneaux libres (patient) |
| `POST` | `/` | ✅ | Ajouter dispo + créneaux auto |
| `PUT` | `/:id` | ✅ | Modifier |
| `PUT` | `/annuler/:id` | ✅ | Annuler |

### 6. **Rendez-vous** (`/api/rendezvous`)
| Méthode | Endpoint | Auth | Description | Params/Corps |
|---------|----------|------|-------------|--------------|
| `GET` | `/` | ✅ | Tous RDV |
| `GET` | `/myrdv` | ✅ | Mes RDV (`?view=agenda/historique`) |
| `GET` | `/:id` | ✅ | Détails |
| `POST` | `/` | ✅ | Prendre RDV (patient) | `{\"id_creneau\":1, \"motif\":\"Consultation\"}` |
| `PUT` | `/:id/confirm` | ✅ | Confirmer |
| `PUT` | `/:id/cancel` | ✅ | Annuler (libère créneau) |

## 💾 Schéma Base de Données (résumé)
```
users (id_user PK) ← patients/medecins (1:1)
disponibilites → creneaux → rendezvous (patients × medecins)
```
- **Soft deletes** : `deleted_at` timestamp.
- **Statuts** : RDV (en_attente/confirme/annule), Creneaux (libre/reserve/bloque), Dispos (active/annulee).

## ❌ Gestion d'erreurs
```json
{
  \"success\": false,
  \"errors\": {
    \"general\": \"Message d'erreur\",
    \"field\": \"Erreur champ\"
  }
}
```
Codes : 400 (validation), 401 (auth), 404 (non trouvé), 500 (serveur).

## 🧪 Tests & Outils
- **Insomnia/Postman** : Importez endpoints depuis docs.
- **Swagger** : À ajouter (`npm i swagger-ui-express`).
- **Tests** : `npm test` (à implémenter).

## 🤝 Contribution
1. Fork → Clone → `npm i`
2. Créez branch `feature/xxx`
3. Commit → PR

## 📄 Licence
ISC

## 👨‍💻 Auteur
DocSlot Team

---

*Docs générées automatiquement. Dernière MAJ : `date`* 

