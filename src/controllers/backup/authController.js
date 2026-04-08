const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authController = {

    //  Créer
    register: async (req, res) => {
        try {
            const { nom, prenom, email, password,telephone, profile_url, role } = req.body;

            // ⚡ Hash du mot de passe avant insertion
            const hashedPassword = await bcrypt.hash(password, 10);

            const [result] = await req.db.promise().query(
                "INSERT INTO users (nom, prenom, email, password,telephone, profile_url, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [nom, prenom, email, hashedPassword, telephone, profile_url, role]
            );

            const [results] = await req.db.promise().query("SELECT * FROM users WHERE id = ?", [result.insertId]);

            return res.status(201).json({
                success: true,
                message: "Utilisateur créé avec succès!",
                data: results[0]
            });
        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Vérifier si l'utilisateur existe
      const [results] = await req.db.promise().query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      if (results.length === 0) {
        return res.status(404).json({ success: false, errors: { email: "Utilisateur introuvable" } });
      }

      const user = results[0];

      // Vérifier le mot de passe
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, errors: { password: "Mot de passe incorrect " } });
      }

      // ✅ Générer un token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" } // durée de validité
      );

      return res.json({
        success: true,
        message: "Connexion réussie",
        token, // ⚡ renvoie le token au client
        user: { id: user.id, email: user.email, role: user.role }
      });
    } catch (err) {
      return res.status(500).json({ success: false, errors: { general: err.message } });
    }
  },



    //  Logout
    logout: async (req, res) => {
        try {
            // ⚡ Avec JWT, rien à détruire côté serveur
            return res.json({
            success: true,
            message: "Déconnecté avec succès (token supprimé côté client)"
            });
        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
        }
        ,
    //  Mot de passe oublié
    forgotPassword: async (req, res) => {
        try {
            const { email, newPassword } = req.body;

            // Vérifier si l'utilisateur existe
            const [results] = await req.db.promise().query(
                "SELECT * FROM users WHERE email = ?",
                [email]
            );

            if (results.length === 0) {
                return res.status(404).json({ success: false, errors: { email: "Utilisateur introuvable" }});
            }

            // ⚡ Hash du nouveau mot de passe
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await req.db.promise().query(
                "UPDATE users SET password=? WHERE email=?",
                [hashedPassword, email]
            );

            return res.json({
                success: true,
                message: "Mot de passe réinitialisé avec succès"
            });
        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    changePassword: async (req, res) => {
        try {
        const {oldPassword, newPassword } = req.body;
        const userId = req.user.id; // ⚡ Récupérer l'ID de l'utilisateur connecté depuis le token

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, errors: { general: "Champs requis manquants" } });
        }

        // Vérifier si l'utilisateur existe
        const [results] = await req.db.promise().query(
            "SELECT * FROM users WHERE  id = ?",
            [userId]
        );

        if (results.length === 0) {
            return res.status(404).json({ success: false, errors: { general: "Utilisateur introuvable" } });
        }

        const user = results[0];

        // Vérifier l'ancien mot de passe
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, errors: { oldPassword: "Ancien mot de passe incorrect" } });
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour en base
        await req.db.promise().query(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, userId]
        );

        return res.json({
            success: true,
            message: "Mot de passe mis à jour avec succès"
        });
        /* OLD: } catch (err) { console.error(err); ... Reason: Debug console in prod. */
        } catch (err) {
        return res.status(500).json({ success: false, errors: { general: "Erreur serveur" } });
        }
    },


        // Vérifier si l'email existe
    checkEmailExists: async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ success: false, errors: { email: "Email requis" } });
            }

            const [results] = await req.db.promise().query(
                "SELECT id FROM users WHERE email = ?",
                [email]
            );

            if (results.length > 0) {
                return res.json({ success: true, exists: true });
            } else {
                return res.json({ success: true, exists: false });
            }
        } catch (err) {
            /* OLD: console.error(err); Reason: Debug console in prod. */
            return res.status(500).json({ success: false, errors: { general: "Erreur serveur" }});
        }
    },


};

module.exports = authController;
