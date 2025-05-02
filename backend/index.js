// server.js - Point d'entrée principal
const dotenv = require('dotenv');
const nano = require('nano');
const app = require('./App');

// Charger les variables d'environnement
dotenv.config();

// Configuration CouchDB avec variables d'environnement ou valeurs par défaut
const couchDbUrl = process.env.COUCHDB_URL || 'http://localhost:5984';
const couchDbUsername = process.env.COUCHDB_USERNAME || 'admin';
const couchDbPassword = process.env.COUCHDB_PASSWORD || '12345';

// Port d'écoute
const PORT = process.env.PORT || 3001;

// Fonction de connexion à CouchDB avec gestion d'authentification
const connectDB = async () => {
  try {
    let connectionUrl = couchDbUrl;

    // Ajouter l'authentification si les credentials sont fournis
    if (couchDbUsername && couchDbPassword) {
      const urlObj = new URL(couchDbUrl);
      urlObj.username = couchDbUsername;
      urlObj.password = couchDbPassword;
      connectionUrl = urlObj.toString();
    }

    const connection = nano(connectionUrl);

    // Vérifier la connexion
    const info = await connection.info();
    console.log(`Connecté à CouchDB ${info.version} à ${couchDbUrl}`);

    // Initialiser les bases de données nécessaires
    const dbNames = ['users', 'clients', 'prospects', 'tickets', 'userdb'];

    for (const dbName of dbNames) {
      try {
        await connection.db.create(dbName);
        console.log(`Base de données '${dbName}' créée`);
      } catch (error) {
        // Ignorer l'erreur si la base existe déjà
        if (error.statusCode !== 412) {
          console.error(`Erreur lors de la création de la base '${dbName}':`, error);
        } else {
          console.log(`La base de données '${dbName}' existe déjà`);
        }
      }
    }

    // Créer des objets pour accéder aux bases de données
    const databases = {
      users: connection.use('users'),
      clients: connection.use('clients'),
      prospects: connection.use('prospects'),
      tickets: connection.use('tickets'),
      userdb: connection.use('userdb'),
      connection // Conserver la connexion principale
    };

    return databases;
  } catch (error) {
    console.error('Erreur de connexion à CouchDB:', error);
    throw error;
  }
};

// Démarrer le serveur après avoir établi la connexion à CouchDB
connectDB()
  .then(databases => {
    // Stocker les bases de données dans app.locals
    app.locals.db = databases;

    // Initialiser les adaptateurs
    const UserAdapter = require('./adapters/UserAdapter');
    const userAdapter = new UserAdapter();
    userAdapter.setDb(databases); // ✅ Correction ici

    // Attacher les adaptateurs à l'application
    app.locals.adapters = {
      userAdapter
    };

    // Importer et configurer les routes
    const authRoutes = require('./Routes/authRoutes');
    const userRoutes = require('./Routes/user');
    const prospectRoutes = require('./Routes/prospectRoutes');
    const ticketRoutes = require('./Routes/ticket');
    const clientRoutes = require('./Routes/clientRoutes');

    // Configurer les routes API
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/prospects', prospectRoutes);
    app.use('/api/tickets', ticketRoutes);
    app.use('/api/clients', clientRoutes);

    // Route du tableau de bord
    app.get('/api/dashboard', (req, res) => {
      res.json({
        status: 'success',
        message: 'Bienvenue sur le tableau de bord agent'
      });
    });

    // Route racine pour vérifier que le serveur fonctionne
    app.get('/', (req, res) => {
      res.json({ message: 'API du système de gestion est opérationnelle' });
    });

    // Middleware de gestion des erreurs globales
    app.use((err, req, res, next) => {
      console.error('Erreur globale:', err);
      res.status(err.status || 500).json({
        message: 'Une erreur est survenue sur le serveur',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });

    // Middleware pour les routes non trouvées
    app.use((req, res) => {
      res.status(404).json({ message: 'Route non trouvée' });
    });

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`Serveur API démarré sur le port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Échec du démarrage du serveur:', err);
    process.exit(1);
  });