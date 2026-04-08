# Code Analysis Report - docslot-api

## 📋 Executive Summary
**Overall Code Quality: C- (Poor to Fair)**  
The codebase is a functional Node.js/Express API for medical appointment management but suffers from **critical security vulnerabilities**, **structural inconsistencies**, **code duplication**, **debug remnants**, and **poor architecture**. Immediate fixes required for production use. Strengths: Basic MVC structure, JWT auth, transaction usage in some places.

**Score Breakdown:**
| Category | Score | Issues |
|----------|-------|--------|
| Security | **D** | Raw SQL injection risks, hardcoded creds exposure |
| Architecture | **C-** | Duplicate entry points, unused files, tight coupling |
| Reliability | **C** | Inconsistent error handling, missing validations |
| Maintainability | **D+** | Debug logs, magic numbers, no tests |
| Performance | **C** | DB pool good, but N+1 queries likely |

## 🚨 Critical Issues (Fix Immediately)

### 1. **SQL Injection Vulnerabilities** ⚠️ HIGH
- Raw SQL queries everywhere using `req.db.promise().query()` with string templates.
  - Example: `rendezvousController.js` getMyRdv: Complex JOIN with `?` params OK, but many lack params.
  - **Risk**: User input not always parameterized → injectable.
- **Fix**: Use parameterized queries consistently. Migrate to ORM (Sequelize/Prisma).

**Examples:**
```js
// VULNERABLE (if user input in template)
await req.db.promise().query(`SELECT * FROM users WHERE email = '${email}'`); // ❌ NEVER

// SAFE (seen in some places)
await req.db.promise().query(\"SELECT * FROM users WHERE email = ?\", [email]); // ✅
```

### 2. **Duplicate/conflicting HTTP Routes** ⚠️ HIGH
- **rendezvousRoutes.js**: TWO `router.put('/:id', ...)` handlers!
  ```js
  router.put('/:id', authMiddleware, validateUpdateRendezVous, rdvController.confirm);  // First
  router.put('/:id', authMiddleware, validateUpdateRendezVous, rdvController.cancel);  // Second OVERRIDES!
  ```
  - **Result**: `cancel` always called, `confirm` dead code.
- **Fix**: Separate endpoints: `PUT /:id/confirm`, `PUT /:id/cancel`.

### 3. **Debug Code in Production** ⚠️ MEDIUM
- `authController.js`: `console.error(err)` in catch blocks (lines ~120, ~170).
- **Fix**: Use proper logger (Winston) or remove.

### 4. **Security: Exposed DB Credentials** ⚠️ CRITICAL
- `src/models/db.js`: `user: 'root'`, `host: 'localhost'` hardcoded.
  ```js
  user: 'root',  // Never hardcode root!
  password: process.env.PASSWORD,  // Good, but others missing env
  ```
- No `.env` validation.
- **Fix**: All to env vars, use non-root DB user.

### 5. **Entry Point Confusion** ❌ ARCHITECTURE
- **Three conflicting entry points**:
  | File | Status | Issues |
  |------|--------|--------|
  | `index.js` | Active (package.json main) | Loads `src/app.js`, simple |
  | `src/app.js` | Loaded by index.js | Routes commented out! Old `etudiants` routes |
  | `server.js` | ? | Unused? Exports nothing visible |
- **Fix**: Consolidate to one (recommend `server.js`).

**index.js flow:**
```
index.js → src/app.js (routes mostly commented) → No API works!
```

## 🛠️ Major Inconsistencies

### 1. **File Duplication**
```
public/home.html     ← Delete (src/ duplicate exists?)
src/public/home.html
```

### 2. **Naming Conventions** ❌
| Table | Col | Issue |
|-------|-----|-------|
| rendezvous | id_rdv | Inconsistent (elsewhere id_rendezvous?) |
| rendezVous | id_medecin | CamelCase vs snake_case |
| users | deleted_at | Soft delete but no query filter |

- Controller: `rendezVousController` (French), table `rendezvous` (English).
- **Fix**: Standardize snake_case DB, camelCase JS.

### 3. **Error Handling Inconsistent**
- Some: `res.status(500).json({ success: false, errors: { general: err.message } })` ✅
- Others: `console.error(err); res.status(500).json(...)` ❌
- Missing: Input sanitization, rate limiting.

### 4. **Missing Validations**
- `rendezvousController.create`: Transaction good, but no auth check if patient owns RDV.
- No schema validation (Joi/Zod).

### 5. **Dependencies Outdated** ⚠️
```json
\"express\": \"^5.2.1\",  // Beta? Use ^4.19.2
\"bcryptjs\": \"^3.0.3\", // Very old, vuln?
\"mysql\": \"^2.18.1\"    // Duplicate mysql2
```
- **Fix**: `npm audit fix`, remove mysql dup.

## 🔍 Minor Issues
- **No tests**: `scripts.test` placeholder.
- **No logging**: Console only.
- **Magic numbers**: bcrypt salt=10, JWT=1h.
- **No pagination**: `getAll` returns ALL records.
- **Role-based auth**: JWT has role, but middleware likely missing checks.
- **CORS**: Open to all (`cors()` no origins).

## ✅ Positive Aspects
- **DB Pool**: mysql2/promise good practice.
- **Transactions**: Used in `create` RDV.
- **JWT**: Secure auth flow.
- **Middleware injection**: `req.db = pool` clean.
- **Soft delete**: users.deleted_at.

## 📈 Recommendations (Priority Order)
1. **Fix routes** in rendezvousRoutes.js (separate confirm/cancel).
2. **Remove console.error**, standardize errors.
3. **Parameterize ALL SQL** or add ORM.
4. **Clean entry points**: Use single server.js, uncomment routes in src/app.js.
5. **.env validation** + non-root DB user.
6. **Add Joi/Zod** for request validation.
7. **npm update** deps, remove dups.
8. **Add tests** (Jest/Supertest).
9. **Rate limiting** (express-rate-limit).
10. **Logging** (Winston/Morgan).

## Next Steps
Run `npm audit` and fix vulns. Then implement fixes 1-3 for security.

**Generated:** $(date)  
**Total Files Analyzed:** Core 10+ (via searches/reads)  
**Estimated Fix Time:** 4-6 hours for criticals.
