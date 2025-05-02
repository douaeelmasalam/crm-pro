// Routes/prospectRoutes.js - Prospect Routes

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// GET all prospects
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db.prospects;
    
    // Récupérer tous les prospects
    const response = await db.list({ include_docs: true });
    const prospects = response.rows.map(row => row.doc);
    
    res.json(prospects);
  } catch (error) {
    console.error('Error fetching prospects:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des prospects' });
  }
});

// GET prospect by ID
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db.prospects;
    const prospectId = req.params.id;
    
    const prospect = await db.get(prospectId);
    
    if (!prospect) {
      return res.status(404).json({ message: 'Prospect non trouvé' });
    }
    
    res.json(prospect);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: 'Prospect non trouvé' });
    }
    console.error('Error fetching prospect:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du prospect' });
  }
});

// POST create new prospect
router.post('/', async (req, res) => {
  try {
    const db = req.app.locals.db.prospects;
    const { name, email, phone, company, status, notes } = req.body;
    
    // Validation de base
    if (!name || !email) {
      return res.status(400).json({ message: 'Nom et email sont requis' });
    }
    
    // Créer le prospect
    const newProspect = {
      _id: uuidv4(), // Générer un ID unique
      name,
      email,
      phone: phone || '',
      company: company || '',
      status: status || 'nouveau',
      notes: notes || '',
      createdAt: new Date().toISOString()
    };
    
    const result = await db.insert(newProspect);
    
    // Obtenir le prospect créé
    const createdProspect = await db.get(result.id);
    
    res.status(201).json(createdProspect);
  } catch (error) {
    console.error('Error creating prospect:', error);
    res.status(500).json({ message: 'Erreur lors de la création du prospect' });
  }
});

// PUT update prospect
router.put('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db.prospects;
    const prospectId = req.params.id;
    const updateData = req.body;
    
    // Récupérer le prospect existant
    let prospect;
    try {
      prospect = await db.get(prospectId);
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ message: 'Prospect non trouvé' });
      }
      throw error;
    }
    
    // Fusionner les données
    const updatedProspect = {
      ...prospect,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // Mettre à jour dans CouchDB (nécessite le _rev)
    await db.insert(updatedProspect);
    
    // Récupérer le prospect mis à jour
    const result = await db.get(prospectId);
    
    res.json(result);
  } catch (error) {
    console.error('Error updating prospect:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du prospect' });
  }
});

// DELETE prospect
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db.prospects;
    const prospectId = req.params.id;
    
    // Récupérer le prospect pour obtenir son _rev
    let prospect;
    try {
      prospect = await db.get(prospectId);
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ message: 'Prospect non trouvé' });
      }
      throw error;
    }
    
    // Supprimer le prospect
    await db.destroy(prospectId, prospect._rev);
    
    res.json({ message: 'Prospect supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting prospect:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du prospect' });
  }
});

// POST convert prospect to client
router.post('/:id/convert', async (req, res) => {
  try {
    const prospectDb = req.app.locals.db.prospects;
    const clientDb = req.app.locals.db.clients;
    const prospectId = req.params.id;
    const additionalData = req.body || {};
    
    // Récupérer les données du prospect
    const prospect = await prospectDb.get(prospectId);
    
    if (!prospect) {
      return res.status(404).json({ message: 'Prospect non trouvé' });
    }
    
    // Créer un nouveau client basé sur les données du prospect
    const newClient = {
      _id: uuidv4(),
      name: prospect.name,
      email: prospect.email,
      phone: prospect.phone || '',
      company: prospect.company || '',
      notes: prospect.notes || '',
      formerProspect: true,
      prospectId: prospect._id,
      createdAt: new Date().toISOString(),
      ...additionalData
    };
    
    // Insérer le nouveau client
    const clientResult = await clientDb.insert(newClient);
    
    // Mettre à jour le statut du prospect ou le supprimer si demandé
    if (additionalData.deleteProspect) {
      await prospectDb.destroy(prospectId, prospect._rev);
    } else {
      const updatedProspect = {
        ...prospect,
        status: 'converti',
        convertedToClientId: clientResult.id,
        convertedAt: new Date().toISOString()
      };
      
      await prospectDb.insert(updatedProspect);
    }
    
    // Récupérer le client créé
    const createdClient = await clientDb.get(clientResult.id);
    
    res.status(201).json({
      message: 'Prospect converti en client avec succès',
      client: createdClient
    });
  } catch (error) {
    console.error('Error converting prospect to client:', error);
    res.status(500).json({ message: 'Erreur lors de la conversion du prospect en client' });
  }
});

module.exports = router;