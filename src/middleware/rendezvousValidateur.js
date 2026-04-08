// middleware/RendezVousValidator.js

const validateCreateRendezVous = (req, res, next) => {
    const { id_creneau } = req.body;
    const errors = {};

    if (!id_creneau || !Number.isInteger(id_creneau) || id_creneau <= 0) {
        errors.id_creneau = "ID créneau obligatoire et entier positif.";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    next();
};

// Middleware pour la mise à jour d'un rendez-vous
const validateUpdateRendezVous = (req, res, next) => {
    // For PUT /:id/confirm & /:id/cancel - no body params needed
    // Just validate req.params.id is valid
    const id_rdv = req.params.id;
    const errors = {};

    if (!id_rdv || !Number.isInteger(parseInt(id_rdv)) || parseInt(id_rdv) <= 0) {
        errors.id_rdv = "ID rendez-vous invalide";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    next();
};

module.exports = { validateCreateRendezVous, validateUpdateRendezVous };