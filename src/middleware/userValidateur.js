const { parsePhoneNumberFromString } = require('libphonenumber-js');

const validateCreateUser = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      success: false,
      errors: {
        general:
          'Aucun corps de requête valide fourni (utilisez Content-Type: application/json)',
      },
    });
  }

  const { nom, prenom, email, password, telephone, role } = req.body;
  const errors = {};

  // Nom optionnel mais min 2 caractères si fourni
  if (nom !== undefined && nom.trim().length < 2) {
    errors.nom = 'Le nom doit contenir au moins 2 caractères.';
  }

  // Prénom optionnel mais min 2 caractères si fourni
  if (prenom !== undefined && prenom.trim().length < 2) {
    errors.prenom = 'Le prénom doit contenir au moins 2 caractères.';
  }

  // Email obligatoire
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Email obligatoire et au format invalide.';
  }

  // Password obligatoire
  if (
    !password ||
    !/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=<>?{}[\]~]).{8,16}$/.test(
      password
    )
  ) {
    errors.password =
      'Mot de passe obligatoire : 8-16 caractères, au moins une majuscule, un chiffre et un caractère spécial.';
  }

  // Téléphone optionnel
  if (telephone) {
    const phoneNumber = parsePhoneNumberFromString(telephone);

    if (!phoneNumber || !phoneNumber.isValid()) {
      errors.telephone = 'Numéro de téléphone invalide.';
    }
  }

  // Rôle optionnel
  let normalizedRole = role ? role.toLowerCase() : undefined;

  const allowedRoles = ['patient', 'medecin', 'administrateur'];

  if (
    normalizedRole !== undefined &&
    !allowedRoles.includes(normalizedRole)
  ) {
    errors.role =
      "Le rôle doit être 'patient', 'medecin' ou 'administrateur'.";
  }

  if (normalizedRole) {
    req.body.role = normalizedRole;
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  next();
};

const validateUpdateUser = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      success: false,
      errors: {
        general:
          'Aucun corps de requête valide fourni (utilisez Content-Type: application/json)',
      },
    });
  }

  const { nom, prenom, email, password, telephone, role } = req.body;
  const errors = {};

  if (nom !== undefined && nom.trim().length < 2) {
    errors.nom = 'Le nom doit contenir au moins 2 caractères.';
  }

  if (prenom !== undefined && prenom.trim().length < 2) {
    errors.prenom = 'Le prénom doit contenir au moins 2 caractères.';
  }

  if (
    email !== undefined &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    errors.email = "Format d'email invalide.";
  }

  if (
    password !== undefined &&
    !/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=<>?{}[\]~]).{8,16}$/.test(
      password
    )
  ) {
    errors.password =
      'Mot de passe : 8-16 caractères, au moins une majuscule, un chiffre et un caractère spécial.';
  }

  if (telephone) {
    const phoneNumber = parsePhoneNumberFromString(telephone);

    if (!phoneNumber || !phoneNumber.isValid()) {
      errors.telephone = 'Numéro de téléphone invalide.';
    }
  }

  let normalizedRole = role ? role.toLowerCase() : undefined;

  const allowedRoles = ['patient', 'medecin', 'administrateur'];

  if (
    normalizedRole !== undefined &&
    !allowedRoles.includes(normalizedRole)
  ) {
    errors.role =
      "Le rôle doit être 'patient', 'medecin' ou 'administrateur'.";
  }

  if (normalizedRole) {
    req.body.role = normalizedRole;
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  next();
};

module.exports = {
  validateCreateUser,
  validateUpdateUser,
};