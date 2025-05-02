const express = require('express');
const router = express.Router();
const clientController = require('../Controllers/clientController');

// POST /api/clients - Créer un client
router.post('/', clientController.createClient);

// GET /api/clients - Lister les clients
router.get('/', clientController.getClients);

// GET /api/clients/:id - Récupérer un client
router.get('/:id', clientController.getClientById);

// PUT /api/clients/:id - Mettre à jour
router.put('/:id', clientController.updateClient);

// DELETE /api/clients/:id - Supprimer
router.delete('/:id', clientController.deleteClient);

module.exports = router;