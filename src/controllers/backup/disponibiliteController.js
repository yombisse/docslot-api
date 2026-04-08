const disponibiliteController = {

    // Voir mes disponibilités (médecin connecté)
    getMine: async (req, res) => {
        try {
            const [results] = await req.db.promise().query(`
                SELECT d.*
                FROM disponibilites d
                INNER JOIN medecins m ON d.id_medecin = m.id_medecin
                WHERE m.id_utilisateur = ?
                ORDER BY date_disponibilite, heure_debut
            `, [req.user.id]);

            res.json({ success: true, data: results });

        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    // Ajouter une disponibilité
    create: async (req, res) => {
        try {
            const { date_disponibilite, heure_debut, heure_fin } = req.body;

            // récupérer id_medecin
            const [med] = await req.db.promise().query(
                `SELECT id_medecin FROM medecins WHERE id_utilisateur=?`,
                [req.user.id]
            );

            if (med.length === 0)
                return res.status(400).json({ success: false, errors: { general: "Profil médecin introuvable" } });

            await req.db.promise().query(`
                INSERT INTO disponibilites (id_medecin, date_disponibilite, heure_debut, heure_fin)
                VALUES (?, ?, ?, ?)
            `, [med[0].id_medecin, date_disponibilite, heure_debut, heure_fin]);

            res.status(201).json({ success: true, message: "Disponibilité ajoutée" });

        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    //  Supprimer une disponibilité
    delete: async (req, res) => {
        try {
            await req.db.promise().query(
                `DELETE FROM disponibilites WHERE id_disponibilite=?`,
                [req.params.id]
            );

            res.json({ success: true, message: "Disponibilité supprimée" });

        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    }
};

module.exports = disponibiliteController;