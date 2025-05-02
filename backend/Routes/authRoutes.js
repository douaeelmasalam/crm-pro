const express = require('express');
const router = express.Router();
const nano = require('nano');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Configuration CouchDB
const couchDBUrl = process.env.COUCHDB_URL || 'http://localhost:5984';
const couchDBCredentials = {
  username: process.env.COUCHDB_USERNAME || 'admin',
  password: process.env.COUCHDB_PASSWORD || '12345'
};

// Connexion à CouchDB
const db = nano({
  url: couchDBUrl,
  requestDefaults: {
    auth: couchDBCredentials
  }
});

// Nom de la base de données
const DB_NAME = 'userdb';

// Route pour le login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des données d'entrée
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Vérification de l'existence de la base de données
    const dbs = await db.db.list();
    
    if (!dbs.includes(DB_NAME)) {
      return res.status(500).json({ 
        success: false,
        message: `Database ${DB_NAME} non trouvée`,
        availableDatabases: dbs
      });
    }

    // Accès à la base des utilisateurs
    const usersDb = db.use(DB_NAME);

    // Recherche de l'utilisateur par email
    try {
      // Utilisation de Mango Query pour trouver l'utilisateur par email
      const query = {
        selector: {
          email: email
        },
        limit: 1
      };

      const result = await usersDb.find(query);
      
      if (result.docs.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      const user = result.docs[0];
      
      // Vérification du mot de passe (en production, utiliser bcrypt.compare)
      if (user.password !== password) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Vérification des rôles
      const isAdmin = user.roles && user.roles.includes('admin');
      const isAgent = user.roles && user.roles.includes('agent');

      // Réponse réussie
      res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          roles: user.roles || []
        },
        isAdmin,
        isAgent
      });

    } catch (error) {
      console.error('Erreur de recherche:', error);
      throw error;
    }

  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
});

module.exports = router;