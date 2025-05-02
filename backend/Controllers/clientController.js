const ClientAdapter = require('../models/ClientAdapter');

// Créer un client
const createClient = async (req, res) => {
  try {
    const requiredFields = ['clientEmail', 'siretNumber'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Champs obligatoires manquants: ${missingFields.join(', ')}`
      });
    }

    const savedClient = await ClientAdapter.create(req.body);
    res.status(201).json(savedClient);
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Erreur lors de la création du client'
    });
  }
};

// Récupérer tous les clients
const getClients = async (req, res) => {
  try {
    const clients = await ClientAdapter.findAll();
    res.json({ data: clients });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer un client par ID
const getClientById = async (req, res) => {
  try {
    const client = await ClientAdapter.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour un client
const updateClient = async (req, res) => {
  try {
    const updatedClient = await ClientAdapter.update(req.params.id, req.body);
    if (!updatedClient) {
      return res.status(404).json({ message: 'Client non trouvé pour mise à jour' });
    }
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
};

// Supprimer un client
const deleteClient = async (req, res) => {
  try {
    const result = await ClientAdapter.delete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Client non trouvé pour suppression' });
    }
    res.json({ message: 'Client supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
};

module.exports = {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
};
