# Code Review & Incohérences / Corrections

## 1. **Schema & Triggers (triggers_notifications.sql, schema.sql)**
**Incohérences:**
- rendezvous table lacks medecin_id direct link (via creneau -> disponibilite -> medecin). Triggers must JOIN chain.
- notifications no `id_rdv` (commented ALTER needed for ref).
- Trigger types ENUM match, but old triggers used wrong fields (fixed).

**Corrections:**
- ✅ Fixed JOINs for names/date/heure.
- Add `ALTER TABLE notifications ADD COLUMN id_rdv INT, ADD FOREIGN KEY (id_rdv) REFERENCES rendezvous(id_rdv);`.
- Test triggers with sample INSERT/UPDATE RDV.

## 2. **Controllers (notificationController.js, rendezvousController.js etc.)**
**Incohérences:**
- getUnreadCount uses `lu = FALSE` (boolean), consistent.
- Role filter JOIN redundant (id_user ensures role match), but explicit OK.
- No manual notification inserts in JS (good, triggers handle).

**Corrections:**
- Consistent. Optionally update getUnreadCount/markAsRead with role JOIN for uniformity:
  ```
  FROM notifications n JOIN users u ON n.id_user = u.id_user WHERE n.id_user = ? AND u.role = ? AND lu = FALSE
  ```

## 3. **Middleware & Routes**
- authMiddleware sets req.user.role ✅.
- No role guards on notifications routes (open to all authenticated).

**Corrections:**
- Add role middleware if admin-only for some (already getAll has no guard).

## 4. **Général**
- French comments/SQL good.
- Error handling consistent (500 with err.message).
- LIMIT 100 OK.

**Améliorations:**
- Pagination in getMyNotifications (page/limit params).
- Soft delete notifications (deleted_at).
- Notification types more specific (nouveau_rdv_patient vs _medecin).

**Tests recommandés:**
```
-- Insert test RDV
INSERT INTO patients (id_user, date_naissance) VALUES (1, '1990-01-01'); -- assume users exist
-- Then insert creneau, then RDV, check notifications
SELECT * FROM notifications ORDER BY created_at DESC;
```

Code solide, incohérences mineures fixées. Ready for prod after trigger apply & tests.
