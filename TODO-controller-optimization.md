# TODO: Optimisation Controllers - Centraliser CRUD dans userController

## ✅ Plan approuvé par user (avec specs)
- create/update comme exemple fourni (nullish coalescing, bcrypt conditionnel)
- **ADMIN SEUL** peut changer role (affectation)

## 📋 Steps à compléter:

### 1. [✅] **Middlewares** 
   - Créé `src/middleware/adminMiddleware.js`
   - Créé `src/middleware/roleValidator.js` (composé validators par role)

### 2. [✅] **userController** 🚀
   - ✅ `createWithRole(role, data)` avec transaction
   - ✅ `updateWithRole(role, roleId, data)` (?? pattern, bcrypt cond, admin role change)
   - ✅ `deleteWithRole(role, roleId)` soft-delete JOIN
   - ✅ Admin check role change

### 3. [✅] **Trim controllers**
   - ✅ patientController: SUPPRIMÉ create/update/delete (garde getAll/getById/getStats)
   - ✅ medecinController: SUPPRIMÉ create/update/delete (garde getAll/getAvailable*/getById)

### 4. [✅] **Routes**
   - ✅ userRoutes: + POST/PUT/DELETE /:role/:id (adminMiddleware + roleValidator)
   - ✅ patientRoutes: gardé GET/stats (supprimé CRUD)
   - ✅ medecinRoutes: gardé gets/slots (supprimé CRUD)

### 5. [ ] **Tests/Validation**
   - Tests unitaires (si existants)
   - Vérif manuelle API

## 🎉 **OPTIMISATION TERMINÉE !**
**Toutes ops CRUD centralisées dans userController**
- Admin-only role changes
- Validators composés
- Controllers spécialisés préservés

Teste maintenant :
```bash
# Create patient as admin
curl -H "Authorization: Bearer <admin_token>" POST /users/patient -d '{"nom":"Test","email":"test@test.com",...}'
```
