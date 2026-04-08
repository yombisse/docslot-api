// middleware/PatientValidator.js
const { parsePhoneNumberFromString } = require('libphonenumber-js');

const validateCreatePatient = (req, res, next) => {
    const { nom, prenom, date_naissance, telephone, sexe, adresse } = req.body;
    const errors = {};

    if (!nom || nom.trim().length < 2) {
        errors.nom = "Le nom doit contenir au moins 2 caractères.";
    }

    if (!prenom || prenom.trim().length < 2) {
        errors.prenom = "Le prénom doit contenir au moins 2 caractères.";
    }

    if (!date_naissance) {
        errors.date_naissance = "La date de naissance est obligatoire.";
    }

    if (!telephone) {
        errors.telephone = "Le téléphone est obligatoire.";
    } else {
        const number = parsePhoneNumberFromString(telephone);
        if (!number || !number.isValid()) {
            errors.telephone = "Le téléphone doit être un numéro valide au format international (ex: +2266913191).";
        }
    }

    if (!sexe || !["Masculin","Feminin"].includes(sexe)) {
        errors.sexe = "Le sexe doit être 'Masculin' ou 'Feminin'.";
    }

    if (adresse && adresse.trim().length < 2) {
        errors.adresse = "L'adresse doit contenir au moins 2 caractères.";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    next();
};

const validateUpdatePatient = (req, res, next) => {
    const { nom, prenom, date_naissance, telephone, sexe, adresse } = req.body;
    const errors = {};

    if (nom !== undefined && nom.trim().length < 2) {
        errors.nom = "Le nom doit contenir au moins 2 caractères.";
    }
    if (prenom !== undefined && prenom.trim().length < 2) {
        errors.prenom = "Le prénom doit contenir au moins 2 caractères.";
    }
    if (date_naissance !== undefined && !date_naissance) {
        errors.date_naissance = "La date de naissance ne peut pas être vide.";
    }
    if (telephone !== undefined) {
        const number = parsePhoneNumberFromString(telephone);
        if (!number || !number.isValid()) {
            errors.telephone = "Le téléphone doit être un numéro valide au format international (ex: +2266913191).";
        }
    }
    if (sexe !== undefined && !["Masculin","Feminin"].includes(sexe)) {
        errors.sexe = "Le sexe doit être 'Masculin' ou 'Feminin'.";
    }
    if (adresse !== undefined && adresse.trim().length < 2) {
        errors.adresse = "L'adresse doit contenir au moins 2 caractères.";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    next();
};

module.exports = { validateCreatePatient, validateUpdatePatient };