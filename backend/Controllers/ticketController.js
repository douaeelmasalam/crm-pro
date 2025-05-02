const db = require('../config/db'); // Connexion à CouchDB

// Créer un ticket
exports.createTicket = async (req, res) => {
  try {
    const { title, description, priority, clientConcerned, assignedUser, status } = req.body;
    
    const newTicket = {
      title,
      description,
      priority,
      clientConcerned,
      assignedUsers: [assignedUser], // Stocké comme tableau
      status: status || 'open',
    };

    const response = await db.insert(newTicket); // Insérer le ticket dans CouchDB
    res.status(201).json({ message: 'Ticket créé avec succès', ticketId: response.id });
  } catch (error) {
    console.error('Erreur lors de la création du ticket:', error);
    res.status(500).json({ message: 'Erreur lors de la création du ticket.' });
  }
};

// Obtenir tous les tickets
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await db.find({ selector: {} }); // Récupérer tous les tickets
    res.status(200).json(tickets.docs);
  } catch (error) {
    console.error('Erreur lors de la récupération des tickets:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des tickets' });
  }
};

// Obtenir un ticket par ID
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await db.get(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }
    
    res.status(200).json(ticket);
  } catch (error) {
    console.error('Erreur lors de la récupération du ticket:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du ticket' });
  }
};

// Mettre à jour un ticket
exports.updateTicket = async (req, res) => {
  try {
    const { title, description, priority, clientConcerned, assignedUser, status } = req.body;
    const ticket = await db.get(req.params.id);
    
    const updatedTicket = {
      ...ticket,
      title,
      description,
      priority,
      clientConcerned,
      assignedUser,
      status,
      updatedAt: Date.now(),
    };
    
    const response = await db.insert(updatedTicket); // Insérer à nouveau le ticket mis à jour
    res.status(200).json({ message: 'Ticket mis à jour avec succès', ticket: response });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du ticket:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du ticket' });
  }
};

// Supprimer un ticket
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await db.get(req.params.id);
    const response = await db.destroy(req.params.id, ticket._rev); // Supprimer le ticket de CouchDB
    res.status(200).json({ message: 'Ticket supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du ticket:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du ticket' });
  }
};

// Filtrer les tickets par statut
exports.getTicketsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const tickets = await db.find({ selector: { status } }); // Filtrer par statut
    res.status(200).json(tickets.docs);
  } catch (error) {
    console.error('Erreur lors de la récupération des tickets par statut:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des tickets' });
  }
};

// Filtrer les tickets par priorité
exports.getTicketsByPriority = async (req, res) => {
  try {
    const { priority } = req.params;
    const tickets = await db.find({ selector: { priority } }); // Filtrer par priorité
    res.status(200).json(tickets.docs);
  } catch (error) {
    console.error('Erreur lors de la récupération des tickets par priorité:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des tickets' });
  }
};

// Filtrer les tickets par utilisateur assigné
exports.getTicketsByAssignee = async (req, res) => {
  try {
    const { username } = req.params;
    const tickets = await db.find({ selector: { assignedUsers: username } }); // Filtrer par utilisateur assigné
    res.status(200).json(tickets.docs);
  } catch (error) {
    console.error('Erreur lors de la récupération des tickets par assigné:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des tickets' });
  }
};

// Filtrer les tickets par client
exports.getTicketsByClient = async (req, res) => {
  try {
    const { client } = req.params;
    const tickets = await db.find({ selector: { clientConcerned: client } }); // Filtrer par client
    res.status(200).json(tickets.docs);
  } catch (error) {
    console.error('Erreur lors de la récupération des tickets par client:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des tickets' });
  }
};

// Recherche des tickets
exports.searchTickets = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'La requête de recherche est requise' });
    }

    // Recherche avec regex
    const tickets = await db.find({
      selector: {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { clientConcerned: { $regex: query, $options: 'i' } }
        ]
      }
    });

    res.status(200).json(tickets.docs);
  } catch (error) {
    console.error('Erreur lors de la recherche des tickets:', error);
    res.status(500).json({ message: 'Erreur lors de la recherche des tickets' });
  }
};
