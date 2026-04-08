const notificationController = {

    // Admin: toutes notifications
    getAll: async (req, res) => {
        try {
            const [results] = await req.db.query(`
                SELECT n.*, u.nom, u.prenom, u.role
                FROM notifications n
                INNER JOIN users u ON n.id_user = u.id_user
                WHERE u.deleted_at IS NULL
                ORDER BY n.created_at DESC
            `);
            res.json({ success: true, data: results });
        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    // Notifications de l'utilisateur connecté
    getMyNotifications: async (req, res) => {
        try {
            const [results] = await req.db.query(`
                SELECT n.*
                FROM notifications n
                WHERE n.id_user = ? AND n.lu = FALSE
                ORDER BY n.created_at DESC
                LIMIT 50
            `, [req.user.id]);

            // Marquer comme lues après fetch (optionnel)
            await req.db.query(`UPDATE notifications SET lu = TRUE WHERE id_user = ? AND lu = FALSE`, [req.user.id]);

            res.json({ success: true, data: results });
        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    getById: async (req, res) => {
        try {
            const [results] = await req.db.query(`
                SELECT n.*, u.nom, u.prenom
                FROM notifications n
                INNER JOIN users u ON n.id_user = u.id_user
                WHERE n.id_notification = ? AND u.deleted_at IS NULL
            `, [req.params.id]);

            if (results.length === 0) {
                return res.status(404).json({ success: false, errors: { general: 'Notification non trouvée' } });
            }

            res.json({ success: true, data: results[0] });
        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    // Créer notification (interne ou admin)
    create: async (req, res) => {
        try {
            const { id_user, type, message } = req.body;

            const [result] = await req.db.query(`
                INSERT INTO notifications (id_user, type, message)
                VALUES (?, ?, ?)
            `, [id_user, type, message]);

            res.status(201).json({ success: true, data: { id_notification: result.insertId } });
        } catch (err) {
            res.status(400).json({ success: false, errors: { general: err.message } });
        }
    },

    // Marquer une notification comme lue
    markAsRead: async (req, res) => {
        try {
            await req.db.query(`
                UPDATE notifications SET lu = TRUE WHERE id_notification = ?
            `, [req.params.id]);

            res.json({ success: true, message: 'Notification marquée comme lue' });
        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    // Marquer toutes mes notifications comme lues
    markAllAsRead: async (req, res) => {
        try {
            await req.db.query(`
                UPDATE notifications SET lu = TRUE WHERE id_user = ? AND lu = FALSE
            `, [req.user.id]);

            res.json({ success: true, message: 'Toutes les notifications marquées comme lues' });
        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    // Supprimer (soft delete? or hard)
    delete: async (req, res) => {
        try {
            await req.db.query(`DELETE FROM notifications WHERE id_notification = ?`, [req.params.id]);
            res.json({ success: true, message: 'Notification supprimée' });
        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    }
};

module.exports = notificationController;
