// controllers/authController.js
const jwt = require('jsonwebtoken');
const UserAdapter = require('../Models/userAdapter');

const userAdapter = new UserAdapter();

const login = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }
  
  try {
    // Vérifier les identifiants
    const isValid = await userAdapter.validatePassword(email, password);
    
    if (!isValid) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
    
    // Récupérer l'utilisateur sans le mot de passe
    const user = await userAdapter.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
    
    // Créer le token JWT
    const token = jwt.sign(
      { 
        _id: user._id, 
        email: user.email, 
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }  // Token valide 24h
    );
    
    // Renvoyer le token et les informations de l'utilisateur
    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validation basique
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    
    // Créer le nouvel utilisateur
    const user = await userAdapter.create({
      name,
      email,
      password,
      role: role || 'user'
    });
    
    // Créer le token JWT
    const token = jwt.sign(
      { 
        _id: user._id, 
        email: user.email, 
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Renvoyer le token et les informations de l'utilisateur
    res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    
    // Erreur spécifique si l'utilisateur existe déjà
    if (error.message.includes('existe déjà')) {
      return res.status(409).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Erreur serveur lors de l\'inscription' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await userAdapter.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateProfile = async (req, res) => {
  try {
    // Interdire la mise à jour du rôle via cette route
    const { role, ...updates } = req.body;
    
    const updatedUser = await userAdapter.update(req.user._id, updates);
    
    res.status(200).json({
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  login,
  register,
  getProfile,
  updateProfile
};