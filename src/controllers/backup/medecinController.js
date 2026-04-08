const bcrypt = require("bcryptjs");

const medecinController = {

    // Récupérer tous les médecins (avec infos user)
    getAll: async (req, res) => {
        try {
            const { search = '', limit = 20, offset = 0 } = req.query;

            let query = `
                SELECT 
                    u.id,
                    u.nom,
                    u.prenom,
                    u.email,
                    u.telephone,
                    u.profile_url,
                    m.id_medecin,
                    m.specialite
                FROM users u
                INNER JOIN medecins m ON u.id = m.id_utilisateur
                WHERE u.role = 'medecin' AND u.deleted_at IS NULL
            `;

            const params = [];

            if (search) {
                query += ` AND (
                    u.nom LIKE ? OR 
                    u.prenom LIKE ? OR 
                    u.email LIKE ? OR 
                    m.specialite LIKE ?
                )`;
                const like = `%${search}%`;
                params.push(like, like, like, like);
            }

            query += ` ORDER BY u.nom LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));

            const [results] = await req.db.promise().query(query, params);

            return res.json({
                success: true,
                data: results,
                count: results.length
            });

        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    // Récupérer un médecin par id_medecin
    getById: async (req, res) => {
        try {
            const [results] = await req.db.promise().query(`
                SELECT 
                    u.id,
                    u.nom,
                    u.prenom,
                    u.email,
                    u.telephone,
                    u.profile_url,
                    m.id_medecin,
                    m.specialite
                FROM users u
                INNER JOIN medecins m ON u.id = m.id_utilisateur
                WHERE m.id_medecin = ? AND u.deleted_at IS NULL
            `, [req.params.id]);

            if (results.length === 0) {
                return res.status(404).json({ success: false, errors: { general: "Médecin non trouvé" } });
            }

            return res.json({
                success: true,
                data: results[0]
            });

        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    create: async (req, res) => {
        const conn = await req.db.promise().getConnection();
        try {
            await conn.beginTransaction();

            const {
                id_utilisateur,
                nom,
                prenom,
                email,
                telephone,
                profile_url,
                password,
                specialite
            } = req.body;

            let userId = id_utilisateur;

            if (!userId) {
                // Admin crée tout
                const hashedPassword = await bcrypt.hash(password, 10);

                const [userResult] = await conn.query(`
                    INSERT INTO users (nom, prenom, email, password, telephone, profile_url, role)
                    VALUES (?, ?, ?, ?, ?, ?, 'medecin')
                `, [nom, prenom, email, hashedPassword, telephone, profile_url]);

                userId = userResult.insertId;
            } else {
                // Compléter infos user existant
                await conn.query(`
                    UPDATE users
                    SET nom=?, prenom=?, telephone=?, profile_url=?
                    WHERE id = ?
                `, [nom, prenom, telephone, profile_url, userId]);
            }

            // Insérer infos médecin
            await conn.query(`
                INSERT INTO medecins (id_utilisateur, specialite)
                VALUES (?, ?)
            `, [userId, specialite]);

            await conn.commit();

            res.status(201).json({
                success: true,
                message: "Médecin créé/complété avec succès"
            });

        } catch (err) {
            await conn.rollback();
            res.status(500).json({ success: false, errors: { general: err.message } });
        } finally {
            conn.release();
        }
    },

    // Mettre à jour médecin
    update: async (req, res) => {
        const conn = await req.db.promise().getConnection();
        try {
            const { nom, prenom, telephone, profile_url, specialite, password } = req.body;
            const id_medecin = req.params.id;

            await conn.beginTransaction();

            // Récup user ID from medecin
            const [med] = await conn.query('SELECT id_utilisateur FROM medecins WHERE id_medecin = ?', [id_medecin]);
            if (med.length === 0) {
                return res.status(404).json({ success: false, errors: { general: "Médecin non trouvé" } });
            }
            const userId = med[0].id_utilisateur;

            let hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

            if (password) {
                await conn.query(`
                    UPDATE users SET nom=?, prenom=?, telephone=?, profile_url=?, password=?
                    WHERE id = ?
                `, [nom, prenom, telephone, profile_url, hashedPassword, userId]);
            } else {
                await conn.query(`
                    UPDATE users SET nom=?, prenom=?, telephone=?, profile_url=?
                    WHERE id = ?
                `, [nom, prenom, telephone, profile_url, userId]);
            }

            await conn.query(`
                UPDATE medecins SET specialite = ?
                WHERE id_medecin = ?
            `, [specialite, id_medecin]);

            await conn.commit();

            res.json({
                success: true,
                message: "Médecin mis à jour"
            });

        } catch (err) {
            await conn.rollback();
            res.status(500).json({ success: false, errors: { general: err.message } });
        } finally {
            conn.release();
        }
    },

    // Supprimer (soft delete user)
    delete: async (req, res) => {
        try {
            const [result] = await req.db.promise().query(`
                UPDATE users u
                INNER JOIN medecins m ON u.id = m.id_utilisateur
                SET u.deleted_at = CURRENT_TIMESTAMP
                WHERE m.id_medecin = ?
            `, [req.params.id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, errors: { general: "Médecin non trouvé" } });
            }

            return res.json({
                success: true,
                message: "Médecin supprimé avec succès"
            });

        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
    }
};

module.exports = medecinController;
