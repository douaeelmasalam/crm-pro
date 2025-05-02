const express = require('express');
const bcrypt = require('bcrypt');
const authenticateToken = require('../Middlewares/auth');
const isAdmin = require('../middlewares/isAdmin'); // Si vous avez ce middleware pour vérifier le rôle
const connectDB =require('../config/db');// Importez la fonction de connexion à CouchDB
const router = express.Router();

router.post('/create-user', authenticateToken, isAdmin, async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  try {
    // Connexion à CouchDB
    const db = await connectDB();
    
    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur
    const newUser = {
      email,
      password: hashedPassword,
      role,
    };

    // Insérer dans CouchDB
    const response = await db.insert(newUser, 'users'); // 'users' est le nom de la collection/document dans CouchDB

    res.status(201).json({ message: 'Utilisateur créé avec succès !', userId: response.id });
  } catch (error) {
    console.error('Erreur serveur lors de la création :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création' });
  }
});

module.exports = router;
