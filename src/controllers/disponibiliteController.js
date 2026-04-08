const disponibiliteController = {

    // Planning complet du médecin connecté (libre + réservé)
    getPlanningMedecin: async (req, res) => {
        try {
            const [rows] = await req.db.query(`
                SELECT 
                    d.id_disponibilite,
                    d.date_disponibilite,
                    d.heure_debut,
                    d.heure_fin,
                    d.statut,
                    c.id_creneau,
                    c.statut AS creneau_statut,
                    r.id_rdv,
                    r.statut AS rdv_statut,
                    CONCAT(u.nom, ' ', u.prenom) AS patient_nom
                FROM disponibilites d
                INNER JOIN medecins m ON d.id_medecin = m.id_medecin
                LEFT JOIN creneaux c
                    ON d.id_disponibilite = c.id_disponibilite
                LEFT JOIN rendezvous r
                    ON c.id_creneau = r.id_creneau
                LEFT JOIN patients p ON r.id_patient = p.id_patient
                LEFT JOIN users u ON p.id_user = u.id_user
                WHERE m.id_user = ? AND d.statut = 'active'
                ORDER BY d.date_disponibilite, d.heure_debut, c.heure_creneau
            `, [req.user.id]);

            res.json({ success: true, data: rows });

        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    // Voir les créneaux libres d’un médecin pour un patient
    getDisponibilitesPourPatient: async (req, res) => {
        try {
            const { id } = req.params; // id_medecin

            const [rows] = await req.db.query(`
                SELECT 
                    c.id_creneau,
                    c.date_creneau,
                    c.heure_creneau
                FROM creneaux c
                INNER JOIN disponibilites d ON c.id_disponibilite = d.id_disponibilite
                LEFT JOIN rendezvous r ON c.id_creneau = r.id_creneau
                WHERE d.id_medecin = ? AND r.id_rdv IS NULL AND c.statut='libre'
                ORDER BY c.date_creneau, c.heure_creneau
            `, [id]);

            res.json({ success: true, data: rows });

        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    // Créer une disponibilité et générer les créneaux
    create: async (req, res) => {
        try {
            const { date_disponibilite, heure_debut, heure_fin } = req.body;

            const [med] = await req.db.query(
                `SELECT id_medecin, duree_creneau FROM medecins WHERE id_user=?`,
                [req.user.id]
            );

            if (!med.length)
                return res.status(400).json({ success: false, errors: { general: "Profil médecin introuvable" } });

            if (!med[0].duree_creneau)
                return res.status(400).json({ success: false, errors: { general: "Veuillez configurer la durée de vos créneaux" } });

            const now = new Date();
            const dispoStart = new Date(`${date_disponibilite}T${heure_debut}`);
            if (dispoStart < now)
                return res.status(400).json({ success: false, errors: { general: "Impossible d'ajouter une disponibilité dans le passé" } });

            // Vérifier chevauchement
            const [conflict] = await req.db.query(`
                SELECT 1 FROM disponibilites
                WHERE id_medecin = ?
                AND date_disponibilite = ?
                AND statut = 'active'
                AND (
                    (heure_debut <= ? AND heure_fin > ?) OR
                    (heure_debut < ? AND heure_fin >= ?)
                )
            `, [med[0].id_medecin, date_disponibilite, heure_debut, heure_debut, heure_fin, heure_fin]);

            if (conflict.length)
                return res.status(400).json({ success: false, errors: { general: "Chevauchement avec une autre disponibilité" } });

            // Insérer la disponibilité
            const [result] = await req.db.query(`
                INSERT INTO disponibilites (id_medecin, date_disponibilite, heure_debut, heure_fin, statut)
                VALUES (?, ?, ?, ?, 'active')
            `, [med[0].id_medecin, date_disponibilite, heure_debut, heure_fin]);

            // Générer les créneaux automatiquement
            await genererCreneaux(req.db, result.insertId, med[0].duree_creneau);

            res.status(201).json({ success: true, message: "Disponibilité ajoutée avec ses créneaux" });

        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    update: async (req, res) => {
        try {
            const { id_disponibilite } = req.params;
            const { date_disponibilite, heure_debut, heure_fin } = req.body;

            // Vérifier qu'aucun RDV n'existe sur ce créneau
            const [rdv] = await req.db.query(`
                SELECT 1 FROM rendezvous
                WHERE id_creneau IN (
                    SELECT id_creneau FROM creneaux WHERE id_disponibilite = ?
                )
            `, [id_disponibilite]);

            if (rdv.length)
                return res.status(400).json({ success: false, errors: { general: "Impossible de modifier : RDV déjà réservé" } });

            // Modifier la disponibilité
            await req.db.query(`
                UPDATE disponibilites
                SET date_disponibilite = ?, heure_debut = ?, heure_fin = ?
                WHERE id_disponibilite = ?
            `, [date_disponibilite, heure_debut, heure_fin, id_disponibilite]);

            res.json({ success: true, message: "Disponibilité modifiée" });

        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    annuler: async (req, res) => {
        try {
            // Mettre la disponibilité et tous ses créneaux en annule
            await req.db.query(`UPDATE disponibilites SET statut = 'annulee' WHERE id_disponibilite = ?`, [req.params.id]);
            await req.db.query(`UPDATE creneaux SET statut = 'bloque' WHERE id_disponibilite = ?`, [req.params.id]);

            res.json({ success: true, message: "Disponibilité annulée" });

        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    }
};

// Génération automatique des créneaux
async function genererCreneaux(conn, id_disponibilite, duree_creneau) {
    const [rows] = await conn.query(`
        SELECT date_disponibilite, heure_debut, heure_fin
        FROM disponibilites
        WHERE id_disponibilite = ?
    `, [id_disponibilite]);

    const dispo = rows[0];
    let debut = new Date(`1970-01-01T${dispo.heure_debut}`);
    const fin = new Date(`1970-01-01T${dispo.heure_fin}`);

    while (debut < fin) {
        const heure = debut.toTimeString().slice(0, 8);
        await conn.query(`
            INSERT INTO creneaux (id_disponibilite, date_creneau, heure_creneau)
            VALUES (?, ?, ?)
        `, [id_disponibilite, dispo.date_disponibilite, heure]);
        debut.setMinutes(debut.getMinutes() + duree_creneau);
    }
}

module.exports = disponibiliteController;