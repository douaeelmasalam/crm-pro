// models/ticketAdapter.js
const connectDB = require('../db');

class TicketAdapter {
  constructor() {
    this.dbName = 'tickets';
    this.type = 'ticket';
  }

  async init() {
    const couch = await connectDB();
    this.db = couch.use(this.dbName);
    
    // Création d'un index pour la recherche
    try {
      await this.db.createIndex({
        index: {
          fields: ['status', 'priority', 'clientConcerned']
        },
        name: 'ticket-index'
      });
    } catch (error) {
      console.log('Index might already exist or failed to create', error.message);
    }
  }

  // Validation helper
  validateTicket(ticketData) {
    const requiredFields = ['title', 'description', 'priority', 'clientConcerned'];
    const missingFields = requiredFields.filter(field => !ticketData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validation des valeurs enum
    const validPriorities = ['faible', 'moyenne', 'élevée', 'critique'];
    if (!validPriorities.includes(ticketData.priority)) {
      throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    const validStatuses = ['ouvert', 'en cours', 'résolu', 'fermé'];
    if (ticketData.status && !validStatuses.includes(ticketData.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  async create(ticketData) {
    await this.init();
    
    // Valider les données du ticket
    this.validateTicket(ticketData);
    
    const now = new Date().toISOString();
    const ticket = {
      ...ticketData,
      type: this.type,
      status: ticketData.status || 'ouvert',
      assignedUsers: Array.isArray(ticketData.assignedUsers) ? ticketData.assignedUsers : [],
      createdAt: now,
      updatedAt: now
    };
    
    const response = await this.db.insert(ticket);
    return { ...ticket, _id: response.id, _rev: response.rev };
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
        status: status,
        type: this.type
      }
    };
    
    const result = await this.db.find(query);
    return result.docs;
  }

  async findByPriority(priority) {
    await this.init();
    
    const query = {
      selector: {
        priority: priority,
        type: this.type
      }
    };
    
    const result = await this.db.find(query);
    return result.docs;
  }

  async findByClient(clientId) {
    await this.init();
    
    const query = {
      selector: {
        clientConcerned: clientId,
        type: this.type
      }
    };
    
    const result = await this.db.find(query);
    return result.docs;
  }

  async findByAssignedUser(userId) {
    await this.init();
    
    const query = {
      selector: {
        assignedUsers: { $elemMatch: { $eq: userId } },
        type: this.type
      }
    };
    
    const result = await this.db.find(query);
    return result.docs;
  }

  async findPendingReminders() {
    await this.init();
    const now = new Date().toISOString();
    
    const query = {
      selector: {
        reminderDate: { $lte: now },
        status: { $ne: 'fermé' },
        type: this.type
      }
    };
    
    const result = await this.db.find(query);
    return result.docs;
  }

  async update(id, updates) {
    await this.init();
    
    try {
      const existingTicket = await this.db.get(id);
      
      // Si la mise à jour concerne un champ validable, valider
      if (updates.priority || updates.status) {
        this.validateTicket({
          ...existingTicket,
          ...updates
        });
      }
      
      const updatedTicket = {
        ...existingTicket,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      const response = await this.db.insert(updatedTicket);
      return { ...updatedTicket, _rev: response.rev };
    } catch (error) {
      if (error.statusCode === 404) {
        throw new Error('Ticket not found');
      }
      throw error;
    }
  }

  async delete(id) {
    await this.init();
    
    try {
      const ticket = await this.db.get(id);
      await this.db.destroy(id, ticket._rev);
      return { success: true };
    } catch (error) {
      if (error.statusCode === 404) {
        throw new Error('Ticket not found');
      }
      throw error;
    }
  }
}

module.exports = TicketAdapter;