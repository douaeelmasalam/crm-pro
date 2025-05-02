// models/prospectAdapter.js
const connectDB = require('../db');

class ProspectAdapter {
  constructor() {
    this.dbName = 'prospects';
    this.type = 'prospect';
  }

  async init() {
    const couch = await connectDB();
    this.db = couch.use(this.dbName);
    
    // Création d'un index pour la recherche 
    try {
      await this.db.createIndex({
        index: {
          fields: ['email', 'nom', 'statut']
        },
        name: 'prospect-index'
      });
    } catch (error) {
      console.log('Index might already exist or failed to create', error.message);
    }
  }

  async create(prospectData) {
    await this.init();
    
    // Valider les champs requis
    if (!prospectData.nom) {
      throw new Error('Le nom est requis');
    }
    
    if (!prospectData.email) {
      throw new Error('L\'email est requis');
    }
    
    const prospect = {
      ...prospectData,
      type: this.type,
      origine: prospectData.origine || 'Cold Call',
      statut: prospectData.statut || 'Nouveau',
      dateCreation: prospectData.dateCreation || new Date().toISOString()
    };
    
    const response = await this.db.insert(prospect);
    return { ...prospect, _id: response.id, _rev: response.rev };
  }

  async findById(id) {
    await this.init();
    try {
      return await this.db.get(id);
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async findByEmail(email) {
    await this.init();
    
    const query = {
      selector: {
        email: email,
        type: this.type
      }
    };
    
    const result = await this.db.find(query);
    return result.docs[0] || null;
  }

  async findAll() {
    await this.init();
    
    const query = {
      selector: {
        type: this.type
      }
    };
    
    const result = await this.db.find(query);
    return result.docs;
  }

  async findByStatus(status) {
    await this.init();
    
    const query = {
      selector: {
        statut: status,
        type: this.type
      }
    };
    
    const result = await this.db.find(query);
    return result.docs;
  }

  async findByGestionnaire(gestionnaire) {
    await this.init();
    
    const query = {
      selector: {
        gestionnaire: gestionnaire,
        type: this.type
      }
    };
    
    const result = await this.db.find(query);
    return result.docs;
  }

  async update(id, updates) {
    await this.init();
    
    try {
      const existingProspect = await this.db.get(id);
      const updatedProspect = {
        ...existingProspect,
        ...updates
      };
      
      const response = await this.db.insert(updatedProspect);
      return { ...updatedProspect, _rev: response.rev };
    } catch (error) {
      if (error.statusCode === 404) {
        throw new Error('Prospect not found');
      }
      throw error;
    }
  }

  async delete(id) {
    await this.init();
    
    try {
      const prospect = await this.db.get(id);
      await this.db.destroy(id, prospect._rev);
      return { success: true };
    } catch (error) {
      if (error.statusCode === 404) {
        throw new Error('Prospect not found');
      }
      throw error;
    }
  }
}

module.exports = ProspectAdapter;