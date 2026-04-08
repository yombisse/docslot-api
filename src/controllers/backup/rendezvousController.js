const rendezVousController = {

    getAll: async (req, res) => {
        try {
            const [results] = await req.db.promise().query(`
                SELECT * FROM rendezvous ORDER BY date_rdv DESC
            `);

            res.json({ success: true, data: results });

        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },
    //  Lister les RDV d'un patient connecté
    getMyRdv: async (req, res) => {
        try {
            const [results] = await req.db.promise().query(`
                SELECT 
                    r.id_rdv,
                    r.date_rdv,
                    r.heure_rdv,
                    r.statut,
                    m.id_medecin,
                    u.nom AS nom_medecin,
                    u.prenom AS prenom_medecin,
                    m.specialite
                FROM rendezVous r
                INNER JOIN medecins m ON r.id_medecin = m.id_medecin
                INNER JOIN users u ON m.id_utilisateur = u.id
                INNER JOIN patients p ON r.id_patient = p.id_patient
                WHERE p.id_utilisateur = ?
                ORDER BY r.date_rdv DESC, r.heure_rdv DESC
            `, [req.user.id]);

            res.json({ success: true, data: results });

        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },
     //  Récupérer un rendezvous par id_rendezvous
    /* OLD getById:
    const [results] = await req.db.promise().query(`
        SELECT 
            u.id,
            u.nom,
            u.prenom,
            m.id_medecin,
            p.id_patient
            r.*
        FROM users u
        INNER JOIN medecins m ON u.id = p.id_medecin  // ❌ Wrong: u.id != p.id_medecin
        INNER JOIN patients p ON u.id=p.id_patient     // ❌ Incomplete chain
        INNER JOIN rendezvous r ON r.id_medecin=m.id_medecin
        WHERE r.id_rendezvous = ?
    `;
    Reason: Broken JOINs (logic error, missing refs), potential SQL fail/N+1. */

    getById: async (req, res) => {
        try {
            const [results] = await req.db.promise().query(`
                SELECT 
                    r.id_rdv,
                    r.date_rdv,
                    r.heure_rdv,
                    r.statut,
                    p.id_patient,
                    p.id_utilisateur as patient_user_id,
                    m.id_medecin,
                    m.id_utilisateur as medecin_user_id,
                    pu.nom as patient_nom,
                    pu.prenom as patient_prenom,
                    mu.nom as medecin_nom,
                    mu.prenom as medecin_prenom
                FROM rendezvous r
                LEFT JOIN patients p ON r.id_patient = p.id_patient
                LEFT JOIN users pu ON p.id_utilisateur = pu.id
                LEFT JOIN medecins m ON r.id_medecin = m.id_medecin
                LEFT JOIN users mu ON m.id_utilisateur = mu.id
                WHERE r.id_rdv = ? AND (pu.deleted_at IS NULL OR pu.deleted_at IS NULL)
            `, [req.params.id]);

            if (results.length === 0) {
                return res.status(404).json({ success: false, errors: { general: "Rendez-vous non trouvé" } });
            }

            return res.json({
                success: true,
                data: results[0]
            });

        } catch (err) {
            return res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    //  Prendre un rendez-vous
    create: async (req, res) => {
        const conn = await req.db.promise().getConnection();
        try {
            await conn.beginTransaction();

            const { id_medecin, date_rdv, heure_rdv } = req.body;

            // Vérifier que le patient a un profil
            const [patient] = await conn.query(
                `SELECT id_patient FROM patients WHERE id_utilisateur = ?`,
                [req.user.id]
            );

            if (patient.length === 0) {
                throw new Error("Veuillez compléter votre profil avant de prendre un rendez-vous");
            }

            const id_patient = patient[0].id_patient;

            //Vérifier disponibilité du médecin
            const [dispo] = await conn.query(`
                SELECT * FROM disponibilites
                WHERE id_medecin = ?
                AND date_disponibilite = ?
                AND ? BETWEEN heure_debut AND heure_fin
            `, [id_medecin, date_rdv, heure_rdv]);

            if (dispo.length === 0) {
                throw new Error("Le médecin n'est pas disponible à cette heure");
            }

            // Vérifier qu’aucun RDV n’existe déjà
            const [exists] = await conn.query(`
                SELECT * FROM rendezVous
                WHERE id_medecin=? AND date_rdv=? AND heure_rdv=?
                AND statut != 'Annulé'
            `, [id_medecin, date_rdv, heure_rdv]);

            if (exists.length > 0) {
                throw new Error("Ce créneau est déjà réservé");
            }

            // Créer le RDV
            await conn.query(`
                INSERT INTO rendezVous (id_patient, id_medecin, date_rdv, heure_rdv, statut)
                VALUES (?, ?, ?, ?, 'En attente')
            `, [id_patient, id_medecin, date_rdv, heure_rdv]);

            await conn.commit();

            res.status(201).json({
                success: true,
                message: "Rendez-vous pris avec succès"
            });

        } catch (err) {
            await conn.rollback();
            res.status(400).json({ success: false, errors: { general: err.message } });
        } finally {
            conn.release();
        }
    },

    // Annuler un RDV
    cancel: async (req, res) => {
        try {
            const [result] = await req.db.promise().query(`
                UPDATE rendezVous
                SET statut = 'Annulé'
                WHERE id_rdv = ?
            `, [req.params.id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, errors: { general: "RDV introuvable" } });
            }

            res.json({
                success: true,
                message: "Rendez-vous annulé"
            });

        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    //  Confirmer un RDV (médecin ou admin)
    confirm: async (req, res) => {
        try {
            await req.db.promise().query(`
                UPDATE rendezVous
                SET statut = 'Confirmé'
                WHERE id_rdv = ?
            `, [req.params.id]);

            res.json({
                success: true,
                message: "Rendez-vous confirmé"
            });

        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    }
};

module.exports = rendezVousController;