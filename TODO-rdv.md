# TODO: Fix Route Prise RDV (réf. schema actuel)

**Info schema :** rendezvous (id_rdv, id_patient, id_creneau, statut)

## Problèmes :
1. controller.create : INSERT colonnes inexistantes (id_medecin, date_rdv...)
2. Table nom 'rendezVous' vs 'rendezvous'
3. Validator attend date/heure au lieu id_creneau
4. Route dupe PUT /:id

## Plan (approuvé) :
### 1. Fix controller rendezvousController.js
- create : INSERT seulement id_patient, id_creneau, statut
- Fix table name
- getAll : SELECT colonnes schema

### 2. Fix validator rendezvousValidateur.js
- validateCreate : check id_creneau >0 entier

### 3. Clean routes
- Supprimer dupe PUT /:id
- Routes séparées cancel/confirm OK

### 4. Test
- POST /rendezvous { "id_creneau": 1 }

Progress: 0/4

