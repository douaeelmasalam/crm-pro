// adapters/UserAdapter.js - Adaptateur pour les opérations utilisateur
const bcrypt = require('bcrypt');

class UserAdapter {
  constructor() {
    // Ne plus initialiser la connexion directement ici
    // La connexion sera récupérée depuis app.locals.db
    this.db = null;
  }

  // Méthode pour définir la base de données à utiliser
  setDb(db) {
    // Si db.userdb existe (nouvelle structure), utiliser db.userdb
    // Sinon, essayer d'utiliser db.users (structure originale)
    this.db = db.userdb || db.users || null;
    
    if (!this.db) {
      throw new Error('Base de données utilisateur non disponible');
    }
    
    return this;
  }

  async create(userData) {
    if (!this.db) {
      throw new Error('Base de données non initialisée');
    }
    
    // Hasher le mot de passe avant stockage
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Préparer l'objet utilisateur pour CouchDB
    const user = {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      type: 'user',          // valeur par défaut
      role: 'agent',         // rôle par défaut
      createdAt: new Date().toISOString()
    };
    
    
    // Insérer dans CouchDB
    const response = await this.db.insert(user);
    return { ...user, _id: response.id, _rev: response.rev };
  }

  async findByEmail(email) {
    if (!this.db) {
      throw new Error('Base de données non initialisée');
    }
    
    const result = await this.db.find({
      selector: { email }
    });
    return result.docs[0];
  }

  async validatePassword(email, password) {
    const user = await this.findByEmail(email);
    if (!user) return false;
    return bcrypt.compare(password, user.password);
  }

  async findById(id) {
    if (!this.db) {
      throw new Error('Base de données non initialisée');
    }
    
    try {
      return await this.db.get(id);
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async update(id, updates) {
    if (!this.db) {
      throw new Error('Base de données non initialisée');
    }
    
    // Récupérer le document existant
    const user = await this.findById(id);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // Hasher le mot de passe si fourni
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    
    // Préparer la mise à jour
    const updated = { ...user, ...updates };
    
    // Insérer le document mis à jour
    const response = await this.db.insert(updated);
    return { ...updated, _rev: response.rev };
  }
  
  async delete(id, rev) {
    if (!this.db) {
      throw new Error('Base de données non initialisée');
    }
    
    try {
      return await this.db.destroy(id, rev);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }
  
  async findAll() {
    if (!this.db) {
      throw new Error('Base de données non initialisée');
    }
    
    try {
      // Utiliser une vue ou une requête Mango pour récupérer tous les utilisateurs
      const result = await this.db.find({
        selector: { type: 'user' },
        fields: ['_id', '_rev', 'name', 'email', 'roles', 'role', 'createdAt']
      });
      return result.docs;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  }
}

module.exports = UserAdapter;