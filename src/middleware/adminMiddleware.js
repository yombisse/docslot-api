const authMiddleware = require('./authMiddleware');

// Admin middleware - utilise auth + check role
function adminMiddleware(req, res, next) {
  authMiddleware(req, res, (err) => {
    if (err) return; // authMiddleware gère déjà l'erreur
    
    if (req.user.role !== 'administrateur') {
      return res.status(403).json({ 
        success: false, 
        errors: { general: 'Accès admin requis' } 
      });
    }
    next();
  });
}

module.exports = adminMiddleware;
