const bcrypt = require("bcryptjs");

const medecinController = {

    // Récupérer tous les médecins (avec infos user)
    getAll: async (req, res) => {
        try {
            const { search = '', limit = 20, offset = 0 } = req.query;

            let query = `
                SELECT 
                    u.id_user,
                    u.nom,
                    u.prenom,
                    u.email,
                    u.telephone,
                    u.profile_url,
                    m.id_medecin,
                    m.specialite
                FROM users u
                INNER JOIN medecins m ON u.id_user = m.id_user
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

            const [results] = await req.db.query(query, params);

            return res.json({
                success: true,
                data: results,
                count: results.length
            });

        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

   getAvailableSummary: async (req, res) => {
    try {
        const [results] = await req.db.query(`
            SELECT 
                u.id_user,
                u.nom,
                u.prenom,
                u.telephone,
                u.profile_url,
                m.id_medecin,
                m.specialite,

                COUNT(
                    CASE 
                        WHEN c.statut = 'libre'
                        AND c.date_creneau >= CURDATE()
                        AND r.id_rdv IS NULL
                        THEN 1
                    END
                ) AS nb_creneaux_disponibles

            FROM users u

            INNER JOIN medecins m 
                ON m.id_user = u.id_user

            LEFT JOIN disponibilites d 
                ON d.id_medecin = m.id_medecin

            LEFT JOIN creneaux c 
                ON c.id_disponibilite = d.id_disponibilite

            LEFT JOIN rendezvous r 
                ON r.id_creneau = c.id_creneau

            WHERE u.role = 'medecin'
            AND u.deleted_at IS NULL

            GROUP BY 
                u.id_user,
                u.nom,
                u.prenom,
                u.telephone,
                u.profile_url,
                m.id_medecin,
                m.specialite

            ORDER BY nb_creneaux_disponibles DESC, u.nom ASC
        `);

        return res.json({
            success: true,
            data: results,
            count: results.length
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            errors: { general: err.message }
        });
    }
},
    getAvailableSlotsByMedecin: async (req, res) => {
        try {
            const id_medecin = req.params.id;

            const [results] = await req.db.query(`
                SELECT 
                    c.id_creneau,
                    c.date_creneau,
                    c.heure_creneau,
                    u.id_user,
                    u.nom,
                    u.prenom,
                    m.id_medecin,
                    m.specialite,
                    m.duree_creneau
                FROM creneaux c

                INNER JOIN disponibilites d 
                    ON c.id_disponibilite = d.id_disponibilite

                INNER JOIN medecins m 
                    ON d.id_medecin = m.id_medecin

                INNER JOIN users u 
                    ON u.id_user = m.id_user

                LEFT JOIN rendezvous r 
                    ON c.id_creneau = r.id_creneau

                WHERE m.id_medecin = ?
                AND u.role = 'medecin'
                AND u.deleted_at IS NULL
                AND d.statut = 'active'
                AND c.statut = 'libre'
                AND r.id_rdv IS NULL
                AND c.date_creneau >= CURDATE()

                ORDER BY c.date_creneau ASC, c.heure_creneau ASC
            `, [id_medecin]);

            return res.json({
                success: true,
                data: results,
                count: results.length
            });

        } catch (err) {
            console.error('getAvailableSlotsByMedecin error:', err);
            return res.status(500).json({
                success: false,
                errors: { general: err.message }
            });
        }
    },

    // Récupérer un médecin par id_medecin
    getById: async (req, res) => {
        try {
            const [results] = await req.db.query(`
                SELECT 
                    u.id_user,
                    u.nom,
                    u.prenom,
                    u.email,
                    u.telephone,
                    u.profile_url,
                    m.id_medecin,
                    m.specialite
                FROM users u
                INNER JOIN medecins m ON u.id_user = m.id_user
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

        // POST /admin/medecins
    create: async (req, res) => {
    const conn = await req.db.getConnection();

    try {
        await conn.beginTransaction();

        const {
        nom,
        prenom,
        email,
        telephone,
        profile_url,
        password,
        duree_creneau,
        specialite,
        role
        } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        // 1️⃣ Création USER
        const [userResult] = await conn.query(`
        INSERT INTO users (nom, prenom, email, password, telephone, profile_url, role)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [nom, prenom, email, hashedPassword, telephone, profile_url, role || 'medecin']);

        const userId = userResult.insertId;

        // 2️⃣ Création MEDECIN avec duree_creneau
        await conn.query(`
        INSERT INTO medecins (id_user, specialite, duree_creneau)
        VALUES (?, ?, ?)
        `, [userId, specialite, duree_creneau]);

        await conn.commit();

        res.status(201).json({
        success: true,
        message: "Médecin créé avec succès"
        });

    } catch (err) {
        await conn.rollback();
        res.status(500).json({ success: false, message: err.message });
    } finally {
        conn.release();
    }
    },

    // Mettre à jour médecin
    update: async (req, res) => {
        const conn = await req.db.getConnection();
        try {
        const { nom, prenom, telephone, profile_url, specialite, password, duree_creneau } = req.body;
            const id_medecin = req.params.id;

            await conn.beginTransaction();

            // Récup user ID from medecin
            const [med] = await conn.query('SELECT id_user FROM medecins WHERE id_medecin = ?', [id_medecin]);
            if (med.length === 0) {
                return res.status(404).json({ success: false, errors: { general: "Médecin non trouvé" } });
            }
            const userId = med[0].id_user;

            let hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

            if (password) {
                await conn.query(`
                    UPDATE users SET nom=?, prenom=?, telephone=?, profile_url=?, password=?
                    WHERE id_user = ?
                `, [nom, prenom, telephone, profile_url, hashedPassword, userId]);
                
                await conn.query(`
                    UPDATE medecins SET specialite=?, duree_creneau=?
                    WHERE id_medecin = ?
                `, [specialite, duree_creneau, id_medecin]);
            } else {
                await conn.query(`
                    UPDATE users SET nom=?, prenom=?, telephone=?, profile_url=?
                    WHERE id_user = ?
                `, [nom, prenom, telephone, profile_url, userId]);
                
                await conn.query(`
                    UPDATE medecins SET specialite=?, duree_creneau=?
                    WHERE id_medecin = ?
                `, [specialite, duree_creneau, id_medecin]);
            }



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
            const [result] = await req.db.query(`
                UPDATE users u
                INNER JOIN medecins m ON u.id_user = m.id_user
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
    },

    };

module.exports = medecinController;
