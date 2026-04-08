const { parsePhoneNumberFromString } = require('libphonenumber-js');

const validateCreateMedecin = (req, res, next) => {
    const { nom, prenom, email, telephone, password, specialite, duree_creneau } = req.body;
    const errors = {};

    // Champs user
    if (!nom || nom.trim().length < 2) {
        errors.nom = "Le nom doit contenir au moins 2 caractères.";
    }
    if (!prenom || prenom.trim().length < 2) {
        errors.prenom = "Le prénom doit contenir au moins 2 caractères.";
    }
    if (!email || !email.includes('@')) {
        errors.email = "Email valide requis.";
    }
    if (!password || password.length < 6) {
        errors.password = "Mot de passe (6+ caractères) requis.";
    }
    if (telephone) {
        const number = parsePhoneNumberFromString(telephone);
        if (number && !number.isValid()) {
            errors.telephone = "Téléphone invalide.";
        }
    }

    // Champs médecin
    if (!specialite || specialite.trim().length < 2) {
        errors.specialite = "Spécialité (2+ caractères) requise.";
    }
    if (!duree_creneau || !Number.isInteger(duree_creneau) || duree_creneau < 15 || duree_creneau > 120) {
        errors.duree_creneau = "Durée créneau (15-120 minutes, entier) requise.";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    next();
};

const validateUpdateMedecin = (req, res, next) => {
    const { nom, prenom, telephone, specialite, duree_creneau, password } = req.body;
    const errors = {};

    if (nom !== undefined && nom.trim().length < 2) {
        errors.nom = "Le nom doit contenir au moins 2 caractères.";
    }
    if (prenom !== undefined && prenom.trim().length < 2) {
        errors.prenom = "Le prénom doit contenir au moins 2 caractères.";
    }
    if (telephone !== undefined) {
        const number = parsePhoneNumberFromString(telephone);
        if (number && !number.isValid()) {
            errors.telephone = "Téléphone invalide.";
        }
    }
    if (specialite !== undefined && specialite.trim().length < 2) {
        errors.specialite = "Spécialité (2+ caractères) requise.";
    }
    if (duree_creneau !== undefined && (!Number.isInteger(duree_creneau) || duree_creneau < 15 || duree_creneau > 120)) {
        errors.duree_creneau = "Durée créneau (15-120 minutes, entier).";
    }
    if (password !== undefined && password.length < 6) {
        errors.password = "Nouveau mot de passe (6+ caractères).";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    next();
};

module.exports = { validateCreateMedecin, validateUpdateMedecin };

