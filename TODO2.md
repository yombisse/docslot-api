# TODO: Fix req.db.promise is not a function (mysql2/promise pool mismatch)

## Steps:
- [x] 1. Identify issue from search_files/read_files (promise pool, no .promise() needed)
- [x] 2. Replace req.db.promise().query → req.db.query in all active controllers (parallel edits)
- [ ] 3. Update TODO progress
- [ ] 4. Test registration curl, complete task

