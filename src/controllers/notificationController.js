const notificationController = {

    // 🔴 Badge : nombre de notifications non lues
    getUnreadCount: async (req, res) => {
        try {
            const [[result]] = await req.db.query(`
                SELECT COUNT(*) AS total
                FROM notifications
                WHERE id_user = ? AND lu = FALSE
            `, [req.user.id]);

            res.json({ success: true, total: result.total });
        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

   getMyNotifications: async (req, res) => {
    try {
        const [results] = await req.db.query(`
            SELECT 
                n.id_notification,
                n.message,
                n.type,
                n.lu,
                n.created_at
            FROM notifications n
            JOIN users u ON n.id_user = u.id_user
            WHERE n.id_user = ?
              AND n.target_role = ?
              AND u.deleted_at IS NULL
            ORDER BY n.created_at DESC
            LIMIT 100
        `, [req.user.id, req.user.role]);

        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({
            success: false,
            errors: { general: err.message }
        });
    }
},
    // 🔎 Détail d'une notification (sécurisé)
    getById: async (req, res) => {
        try {
            const [results] = await req.db.query(`
                SELECT 
                    id_notification,
                    message,
                    type,
                    lu,
                    created_at
                FROM notifications
                WHERE id_notification = ? AND id_user = ?
            `, [req.params.id, req.user.id]);

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    errors: { general: 'Notification non trouvée' }
                });
            }

            res.json({ success: true, data: results[0] });
        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    // ✅ Marquer UNE notification comme lue
    markAsRead: async (req, res) => {
        try {
            await req.db.query(`
                UPDATE notifications 
                SET lu = TRUE 
                WHERE id_notification = ? AND id_user = ?
            `, [req.params.id, req.user.id]);

            res.json({ success: true, message: 'Notification marquée comme lue' });
        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    // ✅ Marquer TOUTES comme lues
    markAllAsRead: async (req, res) => {
        try {
            await req.db.query(`
                UPDATE notifications 
                SET lu = TRUE 
                WHERE id_user = ? AND lu = FALSE
            `, [req.user.id]);

            res.json({ success: true, message: 'Toutes les notifications marquées comme lues' });
        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    // 🗑️ Supprimer une notification (sécurisé)
    delete: async (req, res) => {
        try {
            await req.db.query(`
                DELETE FROM notifications 
                WHERE id_notification = ? AND id_user = ?
            `, [req.params.id, req.user.id]);

            res.json({ success: true, message: 'Notification supprimée' });
        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    // 👑 ADMIN : toutes les notifications
    getAll: async (req, res) => {
        try {
            const [results] = await req.db.query(`
                SELECT 
                    n.id_notification,
                    n.message,
                    n.type,
                    n.lu,
                    n.created_at,
                    u.nom,
                    u.prenom,
                    u.role
                FROM notifications n
                JOIN users u ON n.id_user = u.id_user
                WHERE u.deleted_at IS NULL
                ORDER BY n.created_at DESC
            `);

            res.json({ success: true, data: results });
        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },


};

module.exports = notificationController;