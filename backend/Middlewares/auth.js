// middlewares/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Récupérer le token depuis les en-têtes
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ message: 'Accès refusé, aucun token' });
  }
  
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Token invalide' });
  }
};

module.exports = authenticateToken;