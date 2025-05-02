const nano = require('nano');

// Fonction de connexion à CouchDB
const connectDB = async () => {
  try {
    // Configuration de connexion avec valeurs par défaut sécurisées
    const couchDbUrl = process.env.COUCHDB_URL || 'http://localhost:5984';
    const couchDbUsername = process.env.COUCHDB_USERNAME || 'admin';
    const couchDbPassword = process.env.COUCHDB_PASSWORD || '12345';

    // Construction sécurisée de l'URL de connexion
    const urlObj = new URL(couchDbUrl);
    if (couchDbUsername && couchDbPassword) {
      urlObj.username = couchDbUsername;
      urlObj.password = couchDbPassword;
    }
    
    const connection = nano(urlObj.toString());

    // Vérification de la connexion
    const info = await connection.info();
    console.log(`Connecté à CouchDB ${info.version} (${urlObj.host})`);

    // Bases de données requises avec vérification d'existence
    const requiredDbs = ['clients', 'prospects', 'users', 'tickets'];
    const existingDbs = await connection.db.list();

    // Création des bases manquantes avec gestion d'erreur améliorée
    await Promise.all(requiredDbs.map(async (dbName) => {
      if (!existingDbs.includes(dbName)) {
        try {
          await connection.db.create(dbName);
          console.log(`✅ Base '${dbName}' créée`);
        } catch (error) {
          if (error.statusCode !== 412) { // Ignorer si la base existe déjà
            console.error(`❌ Erreur création '${dbName}':`, error.message);
            throw error; // Propager les erreurs critiques
          }
        }
      }
    }));

    // Retourner les références aux bases de données
    return {
      connection,
      users: connection.use('users'),
      clients: connection.use('clients'),
      prospects: connection.use('prospects'),
      tickets: connection.use('tickets'),
      
      // Méthodes utilitaires
      ensureIndexes: async () => {
        try {
          const clientsDb = connection.use('clients');
          await clientsDb.createIndex({
            index: { fields: ['clientEmail', 'siretNumber'] },
            name: 'clients_search_idx'
          });
          console.log('Indexes créés avec succès');
        } catch (error) {
          console.error('Erreur création indexes:', error.message);
        }
      }
    };
  } catch (error) {
    console.error('❌ Erreur de connexion à CouchDB:', error.message);
    throw new Error(`Échec de la connexion à CouchDB: ${error.message}`);
  }
};

module.exports = connectDB;
