const Joi = require('joi');

const validateCreateNotification = (req, res, next) => {
    const schema = Joi.object({
        id_user: Joi.number().integer().required().label('ID Utilisateur'),
        type: Joi.string().valid('nouveau_rdv', 'rdv_confirme', 'rdv_annule').required().label('Type'),
        message: Joi.string().max(255).required().label('Message')
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ 
            success: false, 
            errors: { 
                general: error.details[0].message 
            } 
        });
    }
    next();
};

const validateUpdateNotification = (req, res, next) => {
    const schema = Joi.object({
        lu: Joi.boolean().label('Lu')
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ 
            success: false, 
            errors: { 
                general: error.details[0].message 
            } 
        });
    }
    next();
};

module.exports = {
    validateCreateNotification,
    validateUpdateNotification
};
