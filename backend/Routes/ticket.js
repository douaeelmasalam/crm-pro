const express = require('express');
const router = express.Router();
const ticketController = require('../Controllers/ticketController');

// Créer un ticket et récupérer tous les tickets
router.post('/', ticketController.createTicket);
router.get('/', ticketController.getAllTickets);

// Récupérer, mettre à jour et supprimer un ticket spécifique
router.get('/:id', ticketController.getTicketById);
router.put('/:id', ticketController.updateTicket);
router.delete('/:id', ticketController.deleteTicket);

// Filtrer les tickets par différents critères
router.get('/status/:status', ticketController.getTicketsByStatus);
router.get('/priority/:priority', ticketController.getTicketsByPriority);
router.get('/assignee/:username', ticketController.getTicketsByAssignee);
router.get('/client/:client', ticketController.getTicketsByClient);

// Recherche des tickets
router.get('/search', ticketController.searchTickets);

module.exports = router;
