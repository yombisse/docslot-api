
const userController = {
    //  Récupérer tous les utilisateurs
    /* OLD: let query = "SELECT * FROM users"; 
    Reason: No soft-delete filter → returns deleted users. */

    getAll: async (req, res) => {
        try {
            let query = "SELECT * FROM users WHERE deleted_at IS NULL";
            const [results] = await req.db.promise().query(query);

            return res.json({
                success: true,
                data: results,
                count: results.length
            });
        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    //  Récupérer par ID
    getById: async (req, res) => {
        try {
            const [results] = await req.db.promise().query("SELECT * FROM users WHERE id = ?", [req.params.id]);

            if (results.length === 0) {
                return res.status(404).json({ success: false, errors: { general: "Utilisateur non trouvé" } });
            }

            return res.json({ success: true, data: results[0] });
        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },
 //  Route profile
    profile: async (req, res) => {
        try {
            // ⚡ req.user est injecté par authMiddleware
            const [results] = await req.db.promise().query(
            "SELECT id,nom, prenom, email,telephone, profile_url, role FROM users WHERE id = ?",
            [req.user.id]
            );

            if (results.length === 0) {
            return res.status(404).json({ success: false, errors: { general: "Utilisateur introuvable" } });
            }

            return res.json({
            success: true,
            data: results[0]
            });
        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
        },

        //  Mettre à jour
    update: async (req, res) => {
        try {
            const { nom, prenom, email, password,telephone, profile_url, role } = req.body || {};
            const userId = req.user.id;

            //Récupérer l'utilisateur actuel
            const [curentResults] = await req.db.promise().query(
                "SELECT * FROM users WHERE id = ?",
                [userId]
            );

            if (curentResults.length === 0) {
                return res.status(404).json({ success: false, errors: { general: "Utilisateur introuvable" } });
            }

            const existingUser = curentResults[0];
            let hashedPassword = existingUser.password;
            if (password && password.trim() !== "") {
                hashedPassword = await bcrypt.hash(password, 10);
            }

            const updatedData = {
                nom: nom ?? existingUser.nom,
                prenom: prenom ?? existingUser.prenom,
                email: email ?? existingUser.email,
                telephone: telephone ?? existingUser.telephone,
                profile_url: profile_url ?? existingUser.profile_url,
                role: role ?? existingUser.role,
                password: hashedPassword
            };
            /* OLD: await req.db.promise().query(
                `UPDATE users 
                SET nom=?, prenom=?, email=?, password=?,telephone=? profile_url=?, role=? 
                WHERE id=?`,
                Reason: Syntax error - missing comma after telephone=? → SQL fail. */

            await req.db.promise().query(
                `UPDATE users 
                SET nom=?, prenom=?, email=?, password=?, telephone=?, profile_url=?, role=? 
                WHERE id=?`,
                [
                    updatedData.nom,
                    updatedData.prenom,
                    updatedData.email,
                    updatedData.password,
                    updatedData.telephone,
                    updatedData.profile_url,
                    updatedData.role,
                    userId
                ]
            );

            const [results] = await req.db.promise().query(
                "SELECT id, nom, prenom, email, telephone, profile_url, role FROM users WHERE id=?",
                [userId]
            );

            return res.status(200).json({
                success: true,
                message: "Utilisateur mis à jour avec succès",
                data: results[0]
            });

        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },


    //  Supprimer
    delete: async (req, res) => {
        try {
            const userId = req.params.id;
             // 🔎 Récupérer l'utilisateur actuel
            const [curentResults] = await req.db.promise().query(
                "SELECT deleted_at FROM users WHERE id = ?",
                [userId]
            );

            if (curentResults.length === 0) {
                return res.status(404).json({ success: false, errors: { general: "Utilisateur introuvable" } });
            }

            const [result] = await req.db.promise().query("UPDATE users SET deleted_at=? WHERE id=?", [CURRENT_TIMESTAMP,userId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, errors: { general: "Utilisateur introuvable" } });
            }

            return res.status(200).json({ success: true, message: "Utilisateur supprimé avec succès!" });
        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },
}
module.exports = userController;
