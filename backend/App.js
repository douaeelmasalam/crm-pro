const express = require('express');
const cors = require('cors');
const authRoutes = require('./Routes/authRoutes');
const errorHandler = require('./Middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

const { login } = require('./Controllers/authController');
app.post('/login', login); // Route directe pour la compatibilité

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }));

// Use routes
app.use('/api/auth', authRoutes);

// Use error handler middleware
app.use(errorHandler);

module.exports = app;
