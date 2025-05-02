// routes/user.js - Routes utilisateur corrigées
const express = require('express');
const router = express.Router();

// GET tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const users = await req.app.locals.adapters.userAdapter.findAll();
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// GET utilisateur par ID
router.get('/:id', async (req, res) => {
  try {
    const user = await req.app.locals.adapters.userAdapter.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Ne pas renvoyer le mot de passe
    const { password, ...userSansPassword } = user;
    res.json(userSansPassword);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' });
  }
});

// POST créer nouvel utilisateur
router.post('/', async (req, res) => {
  try {
    const { name, email, password, roles, role } = req.body;
    
    // Validation de base
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nom, email et mot de passe sont requis' });
    }
    
    // Vérifier si l'email existe déjà
    const existingUser = await req.app.locals.adapters.userAdapter.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Préparer les données utilisateur
    const userData = {
      name,
      email,
      password,
      role: role || 'user',
      roles: roles || ['user'],
      type: 'user'
    };
    
    // Créer l'utilisateur
    const createdUser = await req.app.locals.adapters.userAdapter.create(userData);
    
    // Ne pas renvoyer le mot de passe
    const { password: _, ...userSansPassword } = createdUser;
    
    res.status(201).json(userSansPassword);
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
  }
});

// PUT mettre à jour utilisateur
router.put('/:id', async (req, res) => {
  try {
    const updateData = req.body;
    
    // Ne pas permettre la modification de certains champs critiques
    delete updateData._id;
    delete updateData._rev;
    
    const updatedUser = await req.app.locals.adapters.userAdapter.update(req.params.id, updateData);
    
    // Ne pas renvoyer le mot de passe
    const { password, ...userSansPassword } = updatedUser;
    
    res.json(userSansPassword);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
});

// DELETE supprimer utilisateur
router.delete('/:id', async (req, res) => {
  try {
    // Récupérer l'utilisateur pour obtenir la révision
    const user = await req.app.locals.adapters.userAdapter.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Supprimer l'utilisateur avec son ID et sa révision
    await req.app.locals.adapters.userAdapter.delete(req.params.id, user._rev);
    
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
  }
});

module.exports = router;