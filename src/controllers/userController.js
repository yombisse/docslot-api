
const userController = {
    //  Récupérer tous les utilisateurs
    /* OLD: let query = "SELECT * FROM users"; 
    Reason: No soft-delete filter → returns deleted users. */

    getAll: async (req, res) => {
        try {
            let query = "SELECT * FROM users WHERE deleted_at IS NULL";
            const [results] = await req.db.query(query);

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
            const [results] = await req.db.query("SELECT * FROM users WHERE id_user = ?", [req.params.id]);

            if (results.length === 0) {
                return res.status(404).json({ success: false, errors: { general: "Utilisateur non trouvé" } });
            }

            return res.json({ success: true, data: results[0] });
        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },
 //  Route profile
    // getProfile général
    profile: async (req, res) => {
    try {
        const [userRows] = await req.db.query(
        "SELECT id_user, nom, prenom, email, telephone, profile_url, role FROM users WHERE id_user=?",
        [req.user.id]
        );

        if (!userRows.length) {
        return res.status(404).json({ success: false, errors: { general: "Utilisateur introuvable" } });
        }

        const user = userRows[0];

        let extra = {};
        if (user.role === 'patient') {
        const [rows] = await req.db.query(
            "SELECT date_naissance, adresse, sexe FROM patients WHERE id_user=?",
            [user.id_user]
        );
        extra = rows[0] || { date_naissance: '', adresse: '', sexe: '' };
        } else if (user.role === 'medecin') {
        const [rows] = await req.db.query(
            "SELECT specialite, duree_creneau FROM medecins WHERE id_user=?",
            [user.id_user]
        );
        extra = rows[0] || { specialite: '', duree_creneau: 30 };
        }

        return res.json({ success: true, data: { ...user, ...extra } });

    } catch (err) {
        console.log('Erreur profile:', err);
        return res.status(500).json({ success: false, errors: { general: err.message } });
    }
    },

    // updateProfile général
    updateProfile: async (req, res) => {
    try {
        const { nom, prenom, telephone, profile_url, role, ...rest } = req.body;

        // update users
        await req.db.query(
        "UPDATE users SET nom=?, prenom=?, telephone=?, profile_url=? WHERE id_user=?",
        [nom, prenom, telephone, profile_url, req.user.id]
        );

        if (role === 'patient') {
        const [rows] = await req.db.query(
            "SELECT id_patient FROM patients WHERE id_user=?",
            [req.user.id]
        );
        if (rows.length) {
            await req.db.query(
            "UPDATE patients SET date_naissance=?, adresse=?, sexe=? WHERE id_user=?",
            [rest.date_naissance, rest.adresse, rest.sexe, req.user.id]
            );
        } else {
            await req.db.query(
            "INSERT INTO patients (id_user, date_naissance, adresse, sexe) VALUES (?, ?, ?, ?)",
            [req.user.id, rest.date_naissance, rest.adresse, rest.sexe]
            );
        }
        } else if (role === 'medecin') {
        const [rows] = await req.db.query(
            "SELECT id_medecin FROM medecins WHERE id_user=?",
            [req.user.id]
        );
        if (rows.length) {
            await req.db.query(
            "UPDATE medecins SET specialite=?, duree_creneau=? WHERE id_user=?",
            [rest.specialite, rest.duree_creneau, req.user.id]
            );
        } else {
            await req.db.query(
            "INSERT INTO medecins (id_user, specialite, duree_creneau) VALUES (?, ?, ?)",
            [req.user.id, rest.specialite, rest.duree_creneau || 30]
            );
        }
        }

        return res.json({ success: true });
    } catch (err) {
        console.log('Erreur updateProfile:', err);
        return res.status(500).json({ success: false, errors: { general: err.message } });
    }
    },
        //  Mettre à jour
    update: async (req, res) => {
        try {
            const { nom, prenom, email, password,telephone, profile_url, role } = req.body || {};
            const userId = req.user.id_user;

            //Récupérer l'utilisateur actuel
            const [curentResults] = await req.db.query(
                "SELECT * FROM users WHERE id_user = ?",
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

            await req.db.query(
                `UPDATE users 
                SET nom=?, prenom=?, email=?, password=?, telephone=?, profile_url=?, role=? 
                WHERE id_user=?`,
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

            const [results] = await req.db.query(
                "SELECT id_user, nom, prenom, email, telephone, profile_url, role FROM users WHERE id_user=?",
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
             //  Récupérer l'utilisateur actuel
            const [curentResults] = await req.db.query(
                "SELECT deleted_at FROM users WHERE id_user = ?",
                [userId]
            );

            if (curentResults.length === 0) {
                return res.status(404).json({ success: false, errors: { general: "Utilisateur introuvable" } });
            }

            const [result] = await req.db.query("UPDATE users SET deleted_at=? WHERE id_user=?", [CURRENT_TIMESTAMP,userId]);

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
