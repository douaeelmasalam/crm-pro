const nano = require('nano');
const dbConfig = require('../config/db');

class ClientAdapter {
  constructor() {
    this.dbName = 'clients';
    this.type = 'client';
    this.connection = null;
  }

  async init() {
    if (!this.connection) {
      const { connection, clients } = await dbConfig.connectDB();
      this.connection = connection;
      this.db = clients;
    }
  }

  // Créer un client
  async create(clientData) {
    await this.init();
    
    // Validation
    if (!clientData.clientEmail || !clientData.siretNumber) {
      throw new Error('Email client et numéro SIRET sont obligatoires');
    }

    const clientDoc = {
      ...clientData,
      type: this.type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const response = await this.db.insert(clientDoc);
    return { ...clientDoc, _id: response.id, _rev: response.rev };
  }

  // Récupérer un client par ID
  async findById(id) {
    await this.init();
    try {
      return await this.db.get(id);
    } catch (error) {
      if (error.statusCode === 404) return null;
      throw error;
    }
  }

  // Lister tous les clients
  async findAll() {
    await this.init();
    const query = {
      selector: { type: this.type },
      fields: ['_id', 'clientContactName', 'clientEmail', 'clientPhone', 'siretNumber', 'legalStatus']
    };
    const result = await this.db.find(query);
    return result.docs;
  }

  // Mettre à jour un client
  async update(id, updates) {
    await this.init();
    const existing = await this.db.get(id);
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    const response = await this.db.insert(updated);
    return { ...updated, _rev: response.rev };
  }

  // Supprimer un client
  async delete(id) {
    await this.init();
    const doc = await this.db.get(id);
    await this.db.destroy(id, doc._rev);
    return { success: true };
  }
}

module.exports = new ClientAdapter();