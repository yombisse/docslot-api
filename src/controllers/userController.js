const bcrypt = require("bcryptjs");

const userController = {

    // ================== GET ALL ==================
    getAll: async (req, res) => {
        try {
            const roleFilter = req.query.role; // facultatif : patient / medecin / null
            let rows;

            if (roleFilter === 'patient') {
                [rows] = await req.db.query(`
                    SELECT u.id_user, u.nom, u.prenom, u.email, u.telephone, u.profile_url, u.role,
                           p.adresse, p.sexe, p.date_naissance
                    FROM users u
                    LEFT JOIN patient p ON u.id_user = p.id_user
                    WHERE u.deleted_at IS NULL AND u.role = ?
                `, [roleFilter]);
            } else if (roleFilter === 'medecin') {
                [rows] = await req.db.query(`
                    SELECT u.id_user, u.nom, u.prenom, u.email, u.telephone, u.profile_url, u.role,
                           m.specialite, m.duree_creneau
                    FROM users u
                    LEFT JOIN medecins m ON u.id_user = m.id_user
                    WHERE u.deleted_at IS NULL AND u.role = ?
                `, [roleFilter]);
            } else {
                [rows] = await req.db.query(`
                    SELECT u.id_user, u.nom, u.prenom, u.email, u.telephone, u.profile_url, u.role
                    FROM users u
                    WHERE u.deleted_at IS NULL
                `);
            }

            return res.json({ success: true, data: rows });

        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    // ================== PROFILE ==================
    profile: async (req, res) => {
        try {
            const userId = req.user.id;
            const role = req.user.role;

            let rows;
            if (role === 'patient') {
                [rows] = await req.db.query(`
                    SELECT u.id_user, u.nom, u.prenom, u.email, u.telephone, u.profile_url, u.role,
                           p.adresse, p.sexe, p.date_naissance
                    FROM users u
                    LEFT JOIN patients p ON u.id_user = p.id_user
                    WHERE u.id_user = ? AND u.deleted_at IS NULL
                `, [userId]);
            } else if (role === 'medecin') {
                [rows] = await req.db.query(`
                    SELECT u.id_user, u.nom, u.prenom, u.email, u.telephone, u.profile_url, u.role,
                           m.specialite, m.duree_creneau
                    FROM users u
                    LEFT JOIN medecins m ON u.id_user = m.id_user
                    WHERE u.id_user = ? AND u.deleted_at IS NULL
                `, [userId]);
            } else {
                [rows] = await req.db.query(`
                    SELECT u.id_user, u.nom, u.prenom, u.email, u.telephone, u.profile_url, u.role
                    FROM users u
                    WHERE u.id_user = ? AND u.deleted_at IS NULL
                `, [userId]);
            }

            if (!rows.length) return res.status(404).json({ success: false, errors: { general: "Utilisateur introuvable" } });

            return res.json({ success: true, data: rows[0] });

        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    // ================== CREATE ==================
    create: async (req, res) => {
    try {
        // Champs explicites depuis req.body
        const { nom, prenom, email, password, telephone, role,
                adresse, sexe, date_naissance, specialite, duree_creneau } = req.body;

        // Hash du mot de passe fourni ou mot de passe par défaut
        const hashedPassword = await bcrypt.hash(password || "default123", 10);

        // Création de l'utilisateur dans la table users
        const [result] = await req.db.query(
            `INSERT INTO users (nom, prenom, email, password, telephone, role)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nom, prenom, email, hashedPassword, telephone, role]
        );

        const userId = result.insertId;

        // Création du profil selon le rôle
        if (role === 'patient') {
            await req.db.query(
                `INSERT INTO patients (id_user, adresse, sexe, date_naissance)
                 VALUES (?, ?, ?, ?)`,
                [userId, adresse || "", sexe || "", date_naissance || null]
            );
        } else if (role === 'medecin') {
            await req.db.query(
                `INSERT INTO medecins (id_user, specialite, duree_creneau)
                 VALUES (?, ?, ?)`,
                [userId, specialite || "", duree_creneau || 30]
            );
        }

        // Retour
        return res.status(201).json({
            success: true,
            message: `Utilisateur ${role} créé avec succès`,
            data: {
                id_user: userId,
                nom,
                prenom,
                email,
                telephone,
                role,
                adresse: adresse || null,
                sexe: sexe || null,
                date_naissance: date_naissance || null,
                specialite: specialite || null,
                duree_creneau: duree_creneau || null,
                password: password
            }
        });

    } catch (err) {
        console.error("Erreur création utilisateur:", err);
        return res.status(500).json({ success: false, errors: { general: err.message } });
    }
},
    update: async (req, res) => {
        try {
            const {
                id_user,
                nom,
                prenom,
                email,
                password,
                telephone,
                profile_url,
                adresse,
                sexe,
                date_naissance,
                specialite,
                duree_creneau,
                role
            } = req.body || {};

            const userId = id_user;

            const [current] = await req.db.query(
                "SELECT * FROM users WHERE id_user=?",
                [userId]
            );

            if (!current.length) {
                return res.status(404).json({
                    success: false,
                    errors: { general: "Utilisateur introuvable" }
                });
            }

            const existingUser = current[0];

            const hashedPassword =
                password && password.trim() !== ""
                    ? await bcrypt.hash(password, 10)
                    : existingUser.password;

            await req.db.query(
                `UPDATE users 
                SET nom=?, prenom=?, email=?, password=?, telephone=?, profile_url=? 
                WHERE id_user=?`,
                [
                    nom ?? existingUser.nom,
                    prenom ?? existingUser.prenom,
                    email ?? existingUser.email,
                    hashedPassword,
                    telephone ?? existingUser.telephone,
                    profile_url ?? existingUser.profile_url,
                    userId
                ]
            );

            if (role === "patient") {
                await req.db.query(
                    `UPDATE patients 
                    SET adresse=?, sexe=?, date_naissance=? 
                    WHERE id_user=?`,
                    [
                        adresse ?? null,
                        sexe ?? null,
                        date_naissance ?? null,
                        userId
                    ]
                );
            }

            if (role === "medecin") {
                await req.db.query(
                    `UPDATE medecins 
                    SET specialite=?, duree_creneau=? 
                    WHERE id_user=?`,
                    [
                        specialite ?? null,
                        duree_creneau ?? 30,
                        userId
                    ]
                );
            }

            return res.json({
                success: true,
                message: "Profil mis à jour"
            });

        } catch (err) {
            console.log("UPDATE ERROR:", err);
            return res.status(500).json({
                success: false,
                errors: { general: err.message }
            });
        }
    },
    // ================== SOFT DELETE ==================
    softDelete: async (req, res) => {
        try {
            const userId = req.params.id;
            await req.db.query("UPDATE users SET deleted_at = NOW() WHERE id_user=?", [userId]);
            return res.json({ success: true, message: "Utilisateur supprimé" });
        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
    }
};

module.exports = userController;