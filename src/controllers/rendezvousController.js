const rendezVousController = {

    getAll: async (req, res) => {
        try {
            const [results] = await req.db.query(`
                SELECT r.*, c.date_creneau, c.heure_creneau 
                FROM rendezvous r
                LEFT JOIN creneaux c ON r.id_creneau = c.id_creneau
                ORDER BY c.date_creneau DESC, c.heure_creneau DESC
            `);

            res.json({ success: true, data: results });

        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

   getMesRdv: async (req, res) => {
        try {

            const role = req.user.role;
            const userId = req.user.id;
            const view = req.query.view || 'agenda';

            let query;
            let params = [userId];

            if (role === 'patient') {

            query = `
                SELECT 
                r.id_rdv,
                r.motif,
                r.statut,
                c.date_creneau AS date_rdv,
                c.heure_creneau AS heure_rdv,
                m.id_medecin,
                mu.nom AS medecin_nom,
                mu.prenom AS medecin_prenom
                FROM rendezvous r
                LEFT JOIN creneaux c ON r.id_creneau = c.id_creneau
                LEFT JOIN disponibilites d ON c.id_disponibilite = d.id_disponibilite
                LEFT JOIN medecins m ON d.id_medecin = m.id_medecin
                LEFT JOIN users mu ON m.id_user = mu.id_user
                LEFT JOIN patients p ON r.id_patient = p.id_patient
                WHERE p.id_user = ?
            `;

            if (view === 'agenda') {
                query += `
                AND (c.date_creneau >= CURDATE() AND r.statut != 'annule')
                `;
            }

            if (view === 'historique') {
                query += `
                AND (c.date_creneau < CURDATE() OR r.statut IN ('annule','confirme'))
                `;
            }

            } else if (role === 'medecin') {

            query = `
                SELECT 
                r.id_rdv,
                r.motif,
                r.statut,
                c.date_creneau AS date_rdv,
                c.heure_creneau AS heure_rdv,
                p.id_patient,
                pu.nom AS patient_nom,
                pu.prenom AS patient_prenom
                FROM rendezvous r
                INNER JOIN creneaux c ON r.id_creneau = c.id_creneau
                LEFT JOIN disponibilites d ON c.id_disponibilite = d.id_disponibilite
                LEFT JOIN patients p ON r.id_patient = p.id_patient
                LEFT JOIN users pu ON p.id_user = pu.id_user
                LEFT JOIN medecins m ON d.id_medecin = m.id_medecin
                WHERE m.id_user = ?
            `;

            if (view === 'agenda') {
                query += `
                AND (c.date_creneau >= CURDATE() AND r.statut != 'annule')
                `;
            }

            if (view === 'historique') {
                query += `
                AND (c.date_creneau < CURDATE() OR r.statut IN ('annule','confirme'))
                `;
            }
            }

            const [results] = await req.db.query(query, params);

            res.json({
            success: true,
            data: results
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({
            success: false,
            errors: { general: err.message }
            });
        }
        },
        getById: async (req, res) => {
        try {
            const [results] = await req.db.query(`
                SELECT 
                    r.id_rdv,
                    r.motif,
                    r.statut,
                    p.id_patient,
                    p.id_user as patient_user_id,
                    m.id_medecin,
                    m.id_user as medecin_user_id,
                    pu.nom as patient_nom,
                    pu.prenom as patient_prenom,
                    mu.nom as medecin_nom,
                    mu.prenom as medecin_prenom
                FROM rendezvous r
                LEFT JOIN patients p ON r.id_patient = p.id_patient
                LEFT JOIN users pu ON p.id_user = pu.id_user
                LEFT JOIN medecins m ON r.id_medecin = m.id_medecin
                LEFT JOIN users mu ON m.id_user = mu.id_user
                WHERE r.id_rdv = ? AND (pu.deleted_at IS NULL AND mu.deleted_at IS NULL)
            `, [req.params.id]);

            if (results.length === 0)
                return res.status(404).json({ success: false, errors: { general: "Rendez-vous non trouvé" } });

            res.json({ success: true, data: results[0] });

        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    // Prendre un rendez-vous
    create: async (req, res) => {
        const conn = await req.db.getConnection();
        try {
            await conn.beginTransaction();

            const { id_creneau, motif = '' } = req.body;

            // Vérifier que le patient a un profil
            const [patient] = await conn.query(
                `SELECT id_patient FROM patients WHERE id_user = ?`,
                [req.user.id]
            );
            if (patient.length === 0)
                throw new Error("Veuillez compléter votre profil avant de prendre un rendez-vous");

            const id_patient = patient[0].id_patient;

            // Vérifier que le créneau est libre
            const [creneau] = await conn.query(`
                SELECT statut, id_disponibilite, date_creneau, heure_creneau
                FROM creneaux
                WHERE id_creneau = ? AND statut='libre'
            `, [id_creneau]);

            if (creneau.length === 0)
                throw new Error("Ce créneau n'est plus disponible");

            // Créer le RDV
            const [result] = await conn.query(`
                INSERT INTO rendezvous (id_patient, id_creneau, motif, statut) 
                VALUES (?, ?, ?, 'en_attente')
            `, [id_patient, id_creneau, motif]);
            const id_rdv = result.insertId;

            // Bloquer le créneau
            await conn.query(`
                UPDATE creneaux SET statut='reserve' WHERE id_creneau=?
            `, [id_creneau]);

            // TODO: Ajouter notification push (ex: à l'admin et au médecin)
            // await sendNotification(id_medecin, `Un nouveau rendez-vous a été pris pour ${creneau[0].date_creneau} à ${creneau[0].heure_creneau}`);

            await conn.commit();

            res.status(201).json({ success: true, message: "Rendez-vous pris avec succès" });

        } catch (err) {
            await conn.rollback();
            res.status(400).json({ success: false, errors: { general: err.message } });
        } finally {
            conn.release();
        }
    },

    cancel: async (req, res) => {
        const conn = await req.db.getConnection();
        try {
            await conn.beginTransaction();

            const id_rdv = req.params.id;

            // 1. Get RDV details first
            const [rdv] = await conn.query('SELECT id_creneau FROM rendezvous WHERE id_rdv = ?', [id_rdv]);
            if (rdv.length === 0) {
                return res.status(404).json({ success: false, errors: { general: "RDV introuvable" } });
            }

            // 2. Update RDV status
            await conn.query(`
                UPDATE rendezvous 
                SET statut = 'annule' 
                WHERE id_rdv = ?
            `, [id_rdv]);

            // 3. Free slot
            await conn.query(`
                UPDATE creneaux 
                SET statut = 'libre' 
                WHERE id_creneau = ?
            `, [rdv[0].id_creneau]);

            await conn.commit();
            res.json({ success: true, message: "Rendez-vous annulé avec succès" });

        } catch (err) {
            await conn.rollback();
            console.error('Cancel RDV error:', err);
            res.status(500).json({ success: false, errors: { general: err.message } });
        } finally {
            conn.release();
        }
    },

    confirm: async (req, res) => {
        const conn = await req.db.getConnection();

        try {
            await conn.beginTransaction();

            const id_rdv = req.params.id;

            // 1️⃣ Vérifier que le rendez-vous existe
            const [rdv] = await conn.query(
                `SELECT * FROM rendezvous WHERE id_rdv = ?`,
                [id_rdv]
            );

            if (rdv.length === 0) {
                await conn.rollback();
                return res.status(404).json({
                    success: false,
                    errors: { general: "Rendez-vous introuvable" }
                });
            }

            // 2️⃣ Vérifier que le RDV n'est pas déjà confirmé ou annulé
            if (rdv[0].statut === 'confirme') {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    errors: { general: "Rendez-vous déjà confirmé" }
                });
            }

            if (rdv[0].statut === 'annule') {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    errors: { general: "Impossible de confirmer un RDV annulé" }
                });
            }

            // 3️⃣ Mise à jour du statut
            await conn.query(
                `UPDATE rendezvous
                SET statut = 'confirme'
                WHERE id_rdv = ?`,
                [id_rdv]
            );

            await conn.commit();

            return res.json({
                success: true,
                message: "Rendez-vous confirmé avec succès"
            });

        } catch (err) {
            await conn.rollback();
            console.error("Confirm RDV error:", err);

            return res.status(500).json({
                success: false,
                errors: { general: err.message }
            });

        } finally {
            conn.release();
        }
    }
};

module.exports = rendezVousController;