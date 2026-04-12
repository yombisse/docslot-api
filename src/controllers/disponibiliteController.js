const disponibiliteController = {

    // ===================== PLANNING =====================
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
                LEFT JOIN creneaux c ON d.id_disponibilite = c.id_disponibilite
                LEFT JOIN rendezvous r ON c.id_creneau = r.id_creneau
                LEFT JOIN patients p ON r.id_patient = p.id_patient
                LEFT JOIN users u ON p.id_user = u.id_user
                WHERE 
                    m.id_user = ?
                    AND d.statut = 'active'
                    AND (
                        d.date_disponibilite > CURDATE()
                        OR (d.date_disponibilite = CURDATE() AND d.heure_fin > CURTIME())
                    )
                ORDER BY d.date_disponibilite ASC, d.heure_debut ASC, c.heure_creneau ASC
            `, [req.user.id]);

            res.json({ success: true, data: rows });

        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    // ===================== DISPONIBILITÉS PATIENT =====================
    getDisponibilitesPourPatient: async (req, res) => {
        try {
            const { id } = req.params;

            const [rows] = await req.db.query(`
                SELECT 
                    c.id_creneau,
                    c.date_creneau,
                    c.heure_creneau
                FROM creneaux c
                INNER JOIN disponibilites d ON c.id_disponibilite = d.id_disponibilite
                LEFT JOIN rendezvous r ON c.id_creneau = r.id_creneau
                WHERE 
                    d.id_medecin = ?
                    AND d.statut = 'active'
                    AND c.statut = 'libre'
                    AND r.id_rdv IS NULL
                    AND CONCAT(d.date_disponibilite, ' ', d.heure_fin) > NOW()
                    AND CONCAT(c.date_creneau, ' ', c.heure_creneau) > NOW()
                ORDER BY c.date_creneau ASC, c.heure_creneau ASC
            `, [id]);

            res.json({ success: true, data: rows });

        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    create: async (req, res) => {
    try {
        const { date_disponibilite, heure_debut, heure_fin } = req.body;

        const [med] = await req.db.query(
            `SELECT id_medecin, duree_creneau FROM medecins WHERE id_user=?`,
            [req.user.id]
        );

        if (!med.length)
            return res.status(400).json({ success: false, errors: { general: "Profil médecin introuvable" } });

        const duree = med[0].duree_creneau;

        if (!duree || duree > 30)
            return res.status(400).json({ success: false, errors: { general: "Durée créneau invalide (max 30min)" } });

        // ===== Conversion heures en minutes (ANTI BUG TOTAL) =====
        const toMinutes = (h) => {
            const [hh, mm] = h.split(':').map(Number);
            return hh * 60 + mm;
        };

        const startMin = toMinutes(heure_debut);
        const endMin = toMinutes(heure_fin);

        if (endMin <= startMin)
            return res.status(400).json({ success: false, errors: { general: "Heure fin doit être > heure début" } });

        if ((endMin - startMin) < duree)
            return res.status(400).json({ success: false, errors: { general: "Plage trop courte pour un créneau" } });

        // ===== Date passée interdite =====
        const now = new Date();
        const startDateTime = new Date(`${date_disponibilite}T${heure_debut}`);

        if (startDateTime <= now)
            return res.status(400).json({ success: false, errors: { general: "Date passée interdite" } });

        // ===== Chevauchement parfait (logique minutes SQL) =====
        const [conflict] = await req.db.query(`
            SELECT 1 FROM disponibilites
            WHERE id_medecin = ?
            AND date_disponibilite = ?
            AND statut = 'active'
            AND NOT (
                heure_fin <= ? OR heure_debut >= ?
            )
        `, [
            med[0].id_medecin,
            date_disponibilite,
            heure_debut,
            heure_fin
        ]);

        if (conflict.length)
            return res.status(400).json({ success: false, errors: { general: "Chevauchement détecté" } });

        // ===== INSERT DISPONIBILITE =====
        const [result] = await req.db.query(`
            INSERT INTO disponibilites (id_medecin, date_disponibilite, heure_debut, heure_fin, statut)
            VALUES (?, ?, ?, ?, 'active')
        `, [
            med[0].id_medecin,
            date_disponibilite,
            heure_debut,
            heure_fin
        ]);

        // ===== GENERATION CRENEAUX SAFE =====
        await genererCreneaux(req.db, result.insertId, duree);

        res.status(201).json({ success: true, message: "Disponibilité créée" });

    } catch (err) {
        res.status(500).json({ success: false, errors: { general: err.message } });
    }
},
    // ===================== UPDATE =====================
    update: async (req, res) => {
        try {
            const { id_disponibilite } = req.params;
            const { date_disponibilite, heure_debut, heure_fin } = req.body;

            const [rdv] = await req.db.query(`
                SELECT 1 FROM rendezvous
                WHERE id_creneau IN (
                    SELECT id_creneau FROM creneaux WHERE id_disponibilite = ?
                )
            `, [id_disponibilite]);

            if (rdv.length)
                return res.status(400).json({ success: false, errors: { general: "RDV existants" } });

            await req.db.query(`
                UPDATE disponibilites
                SET date_disponibilite=?, heure_debut=?, heure_fin=?
                WHERE id_disponibilite=?
            `, [date_disponibilite, heure_debut, heure_fin, id_disponibilite]);

            const [med] = await req.db.query(`
                SELECT duree_creneau FROM medecins m
                JOIN disponibilites d ON m.id_medecin = d.id_medecin
                WHERE d.id_disponibilite = ?
            `, [id_disponibilite]);

            if (med.length) {
                await genererCreneaux(req.db, id_disponibilite, med[0].duree_creneau);
            }

            res.json({ success: true, message: "Mis à jour + créneaux régénérés" });

        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    },

    // ===================== ANNULER =====================
    annuler: async (req, res) => {
        try {
            const id = req.params.id;

            await req.db.query(`
                UPDATE disponibilites 
                SET statut = 'inactive'
                WHERE id_disponibilite = ?
            `, [id]);

            await req.db.query(`
                UPDATE creneaux 
                SET statut = 'bloque'
                WHERE id_disponibilite = ?
            `, [id]);

            res.json({ success: true, message: "Annulé" });

        } catch (err) {
            res.status(500).json({ success: false, errors: { general: err.message } });
        }
    }
};

async function genererCreneaux(conn, id_disponibilite, duree) {
    try {

        if (!duree || duree > 30) {
            return;
        }

        await conn.query(
            `DELETE FROM creneaux WHERE id_disponibilite=?`,
            [id_disponibilite]
        );

        const [rows] = await conn.query(`
            SELECT date_disponibilite, heure_debut, heure_fin
            FROM disponibilites
            WHERE id_disponibilite=? AND statut='active'
        `, [id_disponibilite]);

        if (!rows.length) return;

        const dispo = rows[0];

        const [h1, m1] = dispo.heure_debut.split(':').map(Number);
        const [h2, m2] = dispo.heure_fin.split(':').map(Number);

        let start = h1 * 60 + m1;
        const end = h2 * 60 + m2;

        const values = [];

        while (start + duree <= end) {

            const hh = String(Math.floor(start / 60)).padStart(2, '0');
            const mm = String(start % 60).padStart(2, '0');

            values.push([
                id_disponibilite,
                dispo.date_disponibilite,
                `${hh}:${mm}:00`,
                'libre'
            ]);

            start += duree;
        }

        if (values.length) {
            await conn.query(`
                INSERT INTO creneaux (id_disponibilite, date_creneau, heure_creneau, statut)
                VALUES ?
            `, [values]);
        }

    } catch (err) {
        throw err;
    }
}
module.exports = disponibiliteController;