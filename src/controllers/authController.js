const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authController = {

    // ================== REGISTER ==================
    register: async (req, res) => {
        const conn = await req.db.getConnection();
        try {
            await conn.beginTransaction();

            const {
                nom,
                prenom,
                email,
                password,
                telephone,
                profile_url,
                role = "patient"
            } = req.body;

            const hashedPassword = await bcrypt.hash(password, 10);

            const [userResult] = await conn.query(
                `INSERT INTO users (nom, prenom, email, password, telephone, profile_url, role)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [nom, prenom, email, hashedPassword, telephone, profile_url, role]
            );

            const userId = userResult.insertId;

            if (role === "patient") {
                await conn.query(
                    "INSERT INTO patients (id_user) VALUES (?)",
                    [userId]
                );
            }

            if (role === "medecin") {
                await conn.query(
                    "INSERT INTO medecins (id_user) VALUES (?)",
                    [userId]
                );
            }

            await conn.commit();

            const [results] = await conn.query(
                `SELECT id_user, nom, prenom, email, telephone, profile_url, role
                 FROM users
                 WHERE id_user = ?`,
                [userId]
            );

            return res.status(201).json({
                success: true,
                message: "Utilisateur créé avec succès",
                data: results[0]
            });

        } catch (err) {
            await conn.rollback();
            return res.status(500).json({
                success: false,
                errors: { general: err.message }
            });
        } finally {
            conn.release();
        }
    },

    // ================== LOGIN (FIX IMPORTANT) ==================
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            const [results] = await req.db.query(
                `SELECT * FROM users
                 WHERE email = ?
                 AND deleted_at IS NULL`,
                [email]
            );

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    errors: { email: "Utilisateur introuvable ou supprimé" }
                });
            }

            const user = results[0];

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    errors: { password: "Mot de passe incorrect" }
                });
            }

            const token = jwt.sign(
                {
                    id: user.id_user,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            return res.json({
                success: true,
                message: "Connexion réussie",
                token,
                user: {
                    id: user.id_user,
                    email: user.email,
                    role: user.role
                }
            });

        } catch (err) {
            return res.status(500).json({
                success: false,
                errors: { general: err.message }
            });
        }
    },

    // ================== LOGOUT ==================
    logout: async (req, res) => {
        return res.json({
            success: true,
            message: "Déconnecté avec succès"
        });
    },

    // ================== FORGOT PASSWORD ==================
    forgotPassword: async (req, res) => {
        try {
            const { email, newPassword } = req.body;

            const [results] = await req.db.query(
                `SELECT * FROM users
                 WHERE email = ?
                 AND deleted_at IS NULL`,
                [email]
            );

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    errors: { email: "Utilisateur introuvable ou supprimé" }
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await req.db.query(
                "UPDATE users SET password=? WHERE email=?",
                [hashedPassword, email]
            );

            return res.json({
                success: true,
                message: "Mot de passe réinitialisé"
            });

        } catch (err) {
            return res.status(500).json({
                success: false,
                errors: { general: err.message }
            });
        }
    },

    // ================== CHANGE PASSWORD ==================
    changePassword: async (req, res) => {
        try {
            const { oldPassword, newPassword } = req.body;
            const userId = req.user.id;

            const [results] = await req.db.query(
                `SELECT * FROM users
                 WHERE id_user = ?
                 AND deleted_at IS NULL`,
                [userId]
            );

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    errors: { general: "Utilisateur introuvable ou supprimé" }
                });
            }

            const user = results[0];

            const isMatch = await bcrypt.compare(oldPassword, user.password);

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    errors: { oldPassword: "Ancien mot de passe incorrect" }
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await req.db.query(
                "UPDATE users SET password = ? WHERE id_user = ?",
                [hashedPassword, userId]
            );

            return res.json({
                success: true,
                message: "Mot de passe mis à jour"
            });

        } catch (err) {
            return res.status(500).json({
                success: false,
                errors: { general: "Erreur serveur" }
            });
        }
    },

    // ================== CHECK EMAIL ==================
    checkEmailExists: async (req, res) => {
        try {
            const { email } = req.body;

            const [results] = await req.db.query(
                `SELECT id_user FROM users
                 WHERE email = ?
                 AND deleted_at IS NULL`,
                [email]
            );

            return res.json({
                success: true,
                exists: results.length > 0
            });

        } catch (err) {
            return res.status(500).json({
                success: false,
                errors: { general: "Erreur serveur" }
            });
        }
    }
};

module.exports = authController;