const adminController = {
    
    // Dashboard stats principales (1 requête)
    getDashboardStats: async (req, res) => {
        try {
            const [stats] = await req.db.query(`
                SELECT 
                    (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS total_users,
                    (SELECT COUNT(*) FROM patients) AS total_patients,
                    (SELECT COUNT(*) FROM medecins) AS total_medecins,
                    (SELECT COUNT(*) FROM rendezvous) AS total_rdv,
                    (SELECT COUNT(DISTINCT m.id_medecin) 
                     FROM medecins m 
                     INNER JOIN disponibilites d ON m.id_medecin = d.id_medecin 
                     INNER JOIN creneaux c ON d.id_disponibilite = c.id_disponibilite
                     LEFT JOIN rendezvous r ON c.id_creneau = r.id_creneau
                     WHERE d.statut = 'active' 
                       AND c.statut = 'libre' 
                       AND r.id_rdv IS NULL
                       AND c.date_creneau >= CURDATE()
                    ) AS medecins_disponibles
            `);

            res.json({
                success: true, 
                stats: stats[0]
            });

        } catch (err) {
            console.error('Dashboard stats error:', err);
            res.status(500).json({ 
                success: false, 
                errors: { general: err.message } 
            });
        }
    },

    // Stats RDV détaillées (optionnel)
    getRdvStats: async (req, res) => {
        try {
            const [stats] = await req.db.query(`
                SELECT 
                    COUNT(*) AS total_rdv,
                    SUM(CASE WHEN statut = 'confirme' THEN 1 ELSE 0 END) AS rdv_confirms,
                    SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) AS rdv_en_attente,
                    SUM(CASE WHEN statut = 'annule' THEN 1 ELSE 0 END) AS rdv_annules
                FROM rendezvous
            `);

            res.json({
                success: true,
                stats: stats[0]
            });

        } catch (err) {
            res.status(500).json({ 
                success: false, 
                errors: { general: err.message } 
            });
        }
    }
};

module.exports = adminController;
