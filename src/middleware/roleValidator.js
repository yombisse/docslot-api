const { validateCreateUser, validateUpdateUser } = require('./userValidateur');
const { validateCreatePatient, validateUpdatePatient } = require('./patientValidateur');
const { validateCreateMedecin, validateUpdateMedecin } = require('./medecinValidateur');

const roleValidators = {
  patient: {
    create: validateCreateUser, // + patient fields gérés dans controller
    update: [validateUpdateUser, validateUpdatePatient]
  },
  medecin: {
    create: validateCreateUser,
    update: [validateUpdateUser, validateUpdateMedecin]
  },
  // admin n'a pas de table spécifique
};

// Factory pour choisir validator par role + operation
const getValidator = (role, operation) => {
  if (!roleValidators[role]?.[operation]) {
    return (req, res, next) => next(); // no-op si pas de validator spécifique
  }
  const validators = Array.isArray(roleValidators[role][operation]) 
    ? roleValidators[role][operation] 
    : [roleValidators[role][operation]];
  
  return validators.reduceRight((nextFn, validator) => (req, res, next) => {
    validator(req, res, nextFn);
  }, (req, res, next) => next());
};

module.exports = { getValidator, roleValidators };
