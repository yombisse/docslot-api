// middleware/DisponibiliteValidator.js

const validateCreateDisponibilite = (req, res, next) => {
    const { date_disponibilite, heure_debut, heure_fin } = req.body;
    const errors = {};

    // date_disponibilite
    if (!date_disponibilite) {
        errors.date_disponibilite = "La date de disponibilité est obligatoire.";
    } else if (isNaN(Date.parse(date_disponibilite))) {
        errors.date_disponibilite = "La date de disponibilité doit être valide (format YYYY-MM-DD).";
    } else {
        const today = new Date();
        const dateDisp = new Date(date_disponibilite);
        if (dateDisp < today.setHours(0,0,0,0)) {
            errors.date_disponibilite = "La date de disponibilité ne peut pas être passée.";
        }
    }

    // heures
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!heure_debut || !timeRegex.test(heure_debut)) {
        errors.heure_debut = "L'heure de début est obligatoire et doit être au format HH:MM.";
    }
    if (!heure_fin || !timeRegex.test(heure_fin)) {
        errors.heure_fin = "L'heure de fin est obligatoire et doit être au format HH:MM.";
    }

    // vérification que heure_fin > heure_debut
    if (heure_debut && heure_fin && timeRegex.test(heure_debut) && timeRegex.test(heure_fin)) {
        const [hStart, mStart] = heure_debut.split(':').map(Number);
        const [hEnd, mEnd] = heure_fin.split(':').map(Number);
        if (hEnd < hStart || (hEnd === hStart && mEnd <= mStart)) {
            errors.heure_fin = "L'heure de fin doit être après l'heure de début.";
        }
    }

    // Gestion des erreurs
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    next();
};

// middleware/DisponibiliteValidator.js
const validateUpdateDisponibilite = (req, res, next) => {
    const { id_disponibilite, date_disponibilite, heure_debut, heure_fin } = req.body;
    const errors = {};

    // id_disponibilite obligatoire
    if (!id_disponibilite || !Number.isInteger(id_disponibilite) || id_disponibilite <= 0) {
        errors.id_disponibilite = "L'identifiant de la disponibilité est obligatoire et doit être un entier positif.";
    }

    const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/; // HH:MM

    // date_disponibilite valide si fournie
    if (date_disponibilite) {
        if (isNaN(Date.parse(date_disponibilite))) {
            errors.date_disponibilite = "La date doit être valide (YYYY-MM-DD).";
        } else {
            const today = new Date();
            const dateDisp = new Date(date_disponibilite);
            if (dateDisp < today.setHours(0,0,0,0)) {
                errors.date_disponibilite = "La date ne peut pas être passée.";
            }
        }
    }

    // heures valides si fournies
    if (heure_debut && !timeRegex.test(heure_debut)) {
        errors.heure_debut = "L'heure de début doit être au format HH:MM.";
    }
    if (heure_fin && !timeRegex.test(heure_fin)) {
        errors.heure_fin = "L'heure de fin doit être au format HH:MM.";
    }

    // vérification heure_fin > heure_debut si les deux fournies
    if (heure_debut && heure_fin && timeRegex.test(heure_debut) && timeRegex.test(heure_fin)) {
        const [hStart, mStart] = heure_debut.split(':').map(Number);
        const [hEnd, mEnd] = heure_fin.split(':').map(Number);
        if (hEnd < hStart || (hEnd === hStart && mEnd <= mStart)) {
            errors.heure_fin = "L'heure de fin doit être après l'heure de début.";
        }
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    next();
};

module.exports = { validateCreateDisponibilite, validateUpdateDisponibilite };

