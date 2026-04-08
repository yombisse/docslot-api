const patientController = {

    // Récupérer tous les patients (avec infos user)
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
                    p.id_patient,
                    p.date_naissance,
                    p.adresse,
                    p.sexe
                FROM users u
                INNER JOIN patients p ON u.id = p.id_utilisateur
                WHERE u.deleted_at IS NULL
            `;

            const params = [];

            if (search) {
                query += ` AND (
                    u.nom LIKE ? OR 
                    u.prenom LIKE ? OR 
                    u.email LIKE ? OR 
                    p.adresse LIKE ?
                )`;
                const like = `%${search}%`;
                params.push(like, like, like, like);
            }

            query += ` LIMIT ? OFFSET ?`;
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

    //  Récupérer un patient par id_patient
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
                    p.id_patient,
                    p.date_naissance,
                    p.adresse,
                    p.sexe
                FROM users u
                INNER JOIN patients p ON u.id = p.id_utilisateur
                WHERE p.id_patient = ?
            `, [req.params.id]);

            if (results.length === 0) {
                return res.status(404).json({ success: false, errors: { general: "Patient non trouvé" } });
            }

            return res.json({
                success: true,
                data: results[0]
            });

        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    // Statistiques patients
    getStats: async (req, res) => {
        try {
            const [stats] = await req.db.promise().query(`
                SELECT 
                    COUNT(*) AS total_patients,
                    SUM(CASE WHEN sexe = 'Masculin' THEN 1 ELSE 0 END) AS total_hommes,
                    SUM(CASE WHEN sexe = 'Feminin' THEN 1 ELSE 0 END) AS total_femmes
                FROM patients
            `);

            return res.json({
                success: true,
                stats: stats[0]
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
            id_utilisateur, // peut être NULL (cas admin)
            nom,
            prenom,
            email,
            telephone,
            profile_url,
            password,
            date_naissance,
            adresse,
            sexe
        } = req.body;

        let userId = id_utilisateur;

        // CAS 2 : Admin crée tout
        if (!userId) {
            const hashedPassword = await bcrypt.hash(password, 10);

            const [userResult] = await conn.query(`
                INSERT INTO users (nom, prenom, email, password, telephone, profile_url, role)
                VALUES (?, ?, ?, ?, ?, ?, 'patient')
            `, [nom, prenom, email, hashedPassword, telephone, profile_url]);

            userId = userResult.insertId;
        } 
        // CAS 1 : User existe déjà → on complète ses infos
        else {
            await conn.query(`
                UPDATE users
                SET nom=?, prenom=?, telephone=?, profile_url=?
                WHERE id=?
            `, [nom, prenom, telephone, profile_url, userId]);
        }

        // Insérer les infos spécifiques patient
        await conn.query(`
            INSERT INTO patients (id_utilisateur, date_naissance, adresse, sexe)
            VALUES (?, ?, ?, ?)
        `, [userId, date_naissance, adresse, sexe]);

        await conn.commit();

        res.status(201).json({
            success: true,
            message: "Patient créé/completé avec succès"
        });

    } catch (err) {
        await conn.rollback();
        res.status(500).json({ success: false, errors: { general: err.message } });
    } finally {
        conn.release();
    }
},

    // Mettre à jour infos patient
    update: async (req, res) => {
        try {
            const { date_naissance, adresse, sexe } = req.body;

            const [result] = await req.db.promise().query(`
                UPDATE patients 
                SET date_naissance=?, adresse=?, sexe=? 
                WHERE id_patient=?
            `, [date_naissance, adresse, sexe, req.params.id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, errors: { general: "Patient non trouvé" } });
            }

            return res.json({
                success: true,
                message: "Patient mis à jour avec succès"
            });

        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    //  Supprimer patient 
    delete: async (req, res) => {
        try {
            const [result] = await req.db.promise().query(`
                UPDATE users u
                INNER JOIN patients p ON u.id = p.id_utilisateur
                SET u.deleted_at = CURRENT_TIMESTAMP
                WHERE p.id_patient = ?
            `, [req.params.id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, errors: { general: "Patient non trouvé" } });
            }

            return res.json({
                success: true,
                message: "Patient supprimé avec succès"
            });

        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
    }
};

module.exports = patientController;