// middleware/initAdapters.js - Middleware pour initialiser les adaptateurs
/**
 * Middleware qui initialise les adaptateurs avec les connexions aux bases de données.
 * À placer avant les routes qui utilisent les adaptateurs.
 */
const initAdapters = (req, res, next) => {
    try {
      // Vérifier que les bases de données sont disponibles
      if (!req.app.locals.db) {
        throw new Error('Les bases de données ne sont pas initialisées');
      }
      
      // Vérifier que les adaptateurs sont disponibles
      if (!req.app.locals.adapters) {
        throw new Error('Les adaptateurs ne sont pas initialisés');
      }
      
      // Initialiser chaque adaptateur avec sa base de données correspondante
      if (req.app.locals.adapters.userAdapter) {
        req.app.locals.adapters.userAdapter.setDb(req.app.locals.db);
      }
      
      // Initialiser d'autres adaptateurs au besoin
      
      next();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des adaptateurs:', error);
      res.status(err.status || 500).json({
        message: 'Une erreur est survenue sur le serveur',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
      
    }
  };
  
  module.exports = initAdapters;