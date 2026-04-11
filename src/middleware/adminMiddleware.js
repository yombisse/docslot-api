// Middleware vérification rôle administrateur
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'administrateur') {
        return res.status(403).json({ 
            success: false, 
            errors: { general: 'Accès administrateur requis' } 
        });
    }
    next();
};

module.exports = adminMiddleware;
