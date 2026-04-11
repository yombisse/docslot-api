# 🚀 DocSlot API

[![Node.js](https://img.shields.io/badge/Node.js-v20-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.0+-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-orange.svg)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-yellow.svg)](https://jwt.io/)
[![License ISC](https://img.shields.io/badge/License-ISC-purple.svg)](LICENSE)

## 📄 Description

**DocSlot API** est une API RESTful complète pour la **gestion de rendez-vous médicaux**. 

**Rôles supportés :**
- 👤 **Patient** : Prendre/voir/annuler ses RDV
- 👨‍⚕️ **Médecin** : Gérer disponibilités, créneaux auto, confirmer RDV  
- 👨‍💼 **Admin** : Dashboard stats, gestion globale

**Fonctionnalités clés :**
- 🔐 Authentification JWT + validation middlewares
- 📅 Planning intelligent : disponibilités → créneaux auto (30min par défaut) → réservation
- 🔔 Notifications automatiques (triggers MySQL) + gestion
- 📊 Admin dashboard (stats users/RDV/dispos)
- 🛡️ Transactions ACID, soft deletes, validation complète
- ✅ Testé : `GET /api` → `{\"success\":true,\"message\":\"Bienvenue sur l'API DocSlot 🚀\"}`

**Stack technique :** Node.js/Express 5+/MySQL 8+/mysql2 pool/JWT/bcryptjs

## 🚀 Démarrage rapide

### Prérequis
```
Node.js ≥ 18
MySQL 8.x
Git
```

### Installation
```bash
git clone <repo>
cd docslot-api
npm install
```

### Configuration `.env`
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=votre-mot-de-passe
DB_NAME=docslot_db
JWT_SECRET=votre-cle-jwt-super-secrete-min32car
SERVER_PORT=3000
```

### Base de données
```bash
mysql -u root -p < schema.sql
# Crée docslot_db + tables + triggers notifications
```

### Lancement
```bash
npm start
# ou
node index.js
```
**API :** `http://localhost:3000/api`

**Test :**
```bash
curl http://localhost:3000/api
```

## 🔑 Authentification (JWT)
- **Register/Login** → `{token, user}`
- Header: `Authorization: Bearer <token>`
- Roles: `patient|medecin|administrateur`

## 📚 Endpoints Complets

### Auth `/api/auth` 
| Méthode | Route | Auth | Desc |
|---------|-------|------|------|
| POST | `/register` | ❌ | Inscription (role: patient/medecin) |
| POST | `/login` | ❌ | Connexion |
| POST | `/change-password` | ✅ | Changer MDP |
| POST | `/forgot-password` | ❌ | Reset MDP |
| POST | `/check-email` | ❌ | Email existe? |
| POST | `/logout` | ✅ | Logout client-side |

### Users `/api/users`
| GET | `/` | ✅ | Liste (?role=) |
| GET | `/profile` | ✅ | Mon profil |
| PUT | `/` | ✅ | Update profil |
| DELETE | `/:id` | ✅ | Soft delete |

### Patients `/api/patients`
| GET | `/` | ✅ | Liste (?search=) |
| GET | `/:id` | ✅ | Détails |
| POST | `/` | ✅ | Créer profil |
| PUT | `/:id` | ✅ | Update |
| DELETE | `/:id` | ✅ | Soft delete |

### Médecins `/api/medecins`
| GET | `/` | ✅ | Liste |
| GET | `/available` | ✅ | Avec créneaux libres |
| GET | `/:id` | ✅ | Détails |
| GET | `/:id/slots` | ✅ | Créneaux libres |
| POST | `/` | ✅ | Créer |
| PUT | `/:id` | ✅ | Update |
| DELETE | `/:id` | ✅ | Soft delete |

### Disponibilités `/api/disponibilites`
| GET | `/mine` | ✅ medecin | Mon planning |
| GET | `/medecin/:id` | ✅ patient | Créneaux médecin |
| POST | `/` | ✅ | Ajouter dispo + créneaux auto |
| PUT | `/:id` | ✅ | Modifier |
| PUT | `/annuler/:id` | ✅ | Annuler |

### RDV `/api/rendezvous`
| GET | `/` | ✅ | Tous |
| GET | `/myrdv?view=agenda|historique` | ✅ | Mes RDV |
| GET | `/:id` | ✅ | Détails |
| POST | `/` | ✅ patient | Prendre RDV {id_creneau, motif} |
| PUT | `/:id/confirm` | ✅ medecin | Confirmer |
| PUT | `/:id/cancel` | ✅ | Annuler (libère slot) |

### Notifications `/api/notifications`
| GET | `/` | ✅ admin | Toutes |
| GET | `/me` | ✅ | Mes notifs |
| GET | `/unread-count` | ✅ | Badge non-lues |
| GET | `/:id` | ✅ | Détail |
| PUT | `/:id/read` | ✅ | Marquer lue |
| PUT | `/read-all` | ✅ | Toutes lues |
| DELETE | `/:id` | ✅ | Supprimer |

### Admin `/api/admin`
| GET | `/stats` | ✅ admin | Dashboard (users/RDV/dispos) |
| GET | `/rdv-stats` | ✅ admin | Stats RDV détaillées |

## 💾 Base de Données `docslot_db`

**Tables principales :**
```
users (role) ←1:1→ patients/medecins
disponibilites → creneaux (libre/réservé) ←1:1→ rendezvous (patient × créneau)
notifications (auto via triggers sur RDV insert/update)
```
- **Triggers :** Notifications auto (nouveau RDV, confirm/annul).
- **Soft deletes :** `deleted_at`.
- **Statuts :** RDV (en_attente/confirme/annule), Creneaux (libre/reserve/bloque).

## ❌ Erreurs standard
```json
{ "success": false, "errors": { "general": "Msg", "field": "Erreur champ" } }
```
Codes: 400 validation, 401 auth, 404 not found, 500 server.

## 🧪 Tests & Dev
```bash
npm test  # Placeholder
```

## 📋 TODO
Voir [TODO.md](TODO.md)

## 👨‍💻 Auteur
Fandie Yombisse

**Licence : ISC** - Libre usage/modif/distribution.
