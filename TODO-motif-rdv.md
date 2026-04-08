# TODO: Add motif support to RDV Controller

## Status: In Progress

### Step 1: Create TODO [✅]

### Step 2: Update rendezvousController.js [✅ Completed]
   - create(): `{ id_creneau, motif }` → INSERT with motif
   - SELECTs: r.motif included everywhere (getAll, getMesRdv patient/medecin, getById)

### Step 3: Test [✅ Ready]
   POST /api/rendezvous { "id_creneau":123, "motif":"Consultation annuelle" }
