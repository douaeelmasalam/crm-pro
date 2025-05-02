import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Configuration de base d'axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    // Utilisez un moyen plus sécurisé pour l'authentification, comme des tokens JWT stockés
    // ou supprimez cette ligne si l'authentification est gérée autrement (cookies, sessions)
  },
  timeout: 15000, // Augmenté à 15 secondes
  withCredentials: true // Pour les cookies/sessions
});

// Fonction améliorée pour gérer les erreurs d'API
const handleApiError = (error) => {
  // Erreur avec réponse du serveur
  if (error.response) {
    const status = error.response.status;
    const errorData = error.response.data || {};
    
    // Log d'erreur simple sans groupCollapsed qui peut causer des problèmes
    console.error('Erreur API:', {
      url: error.config.url,
      status,
      data: errorData
    });

    const defaultMessages = {
      400: 'Requête invalide',
      401: 'Non autorisé - Veuillez vous reconnecter',
      403: 'Accès refusé - Permissions insuffisantes',
      404: 'Ressource non trouvée',
      500: 'Erreur interne du serveur',
      502: 'Passerelle invalide',
      503: 'Service indisponible'
    };

    return {
      error: true,
      message: errorData.message || defaultMessages[status] || `Erreur serveur (${status})`,
      status
    };
  } 
  // Erreur sans réponse (serveur inaccessible)
  else if (error.request) {
    console.error('Pas de réponse du serveur:', error.request);
    return {
      error: true,
      message: 'Le serveur ne répond pas. Vérifiez votre connexion.',
      status: 0
    };
  } 
  // Autres erreurs
  else {
    console.error('Erreur de configuration:', error.message);
    return {
      error: true,
      message: 'Erreur lors de la préparation de la requête',
      status: -1
    };
  }
};

// Client API calls
export const clientAPI = {
  // Get all clients avec gestion des réponses vides
  getClients: async (filters = {}) => {
    try {
      const response = await api.get('/clients', { params: filters });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      // Retourne un tableau vide si erreur 404 (pas de clients)
      if (error.response?.status === 404) {
        return [];
      }
      // Propage l'erreur pour l'UI
      const errorInfo = handleApiError(error);
      throw new Error(errorInfo.message);
    }
  },

  // Get client by ID
  getClient: async (id) => {
    try {
      if (!id) throw new Error('ID client requis');
      
      const response = await api.get(`/clients/${id}`);
      return response.data || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // Client non trouvé
      }
      const errorInfo = handleApiError(error);
      throw new Error(errorInfo.message);
    }
  },

  // Create new client
  createClient: async (clientData) => {
    try {
      if (!clientData?.name) {
        throw new Error('Le nom du client est requis');
      }

      const response = await api.post('/clients', clientData);
      return response.data;
    } catch (error) {
      const errorInfo = handleApiError(error);
      throw new Error(errorInfo.message);
    }
  },

  // Update client
  updateClient: async (id, clientData) => {
    try {
      if (!id) throw new Error('ID client requis');
      if (!clientData) throw new Error('Données client requises');

      const response = await api.put(`/clients/${id}`, clientData);
      return response.data;
    } catch (error) {
      const errorInfo = handleApiError(error);
      throw new Error(errorInfo.message);
    }
  },

  // Delete client
  deleteClient: async (id) => {
    try {
      if (!id) throw new Error('ID client requis');

      const response = await api.delete(`/clients/${id}`);
      return response.data || { success: true };
    } catch (error) {
      const errorInfo = handleApiError(error);
      throw new Error(errorInfo.message);
    }
  }
};

// Ajout d'un intercepteur pour gérer les tokens d'authentification si nécessaire
api.interceptors.request.use(
  config => {
    // Récupérer le token depuis le localStorage ou autre
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Intercepteur pour gérer les rafraîchissements de token ou déconnexions
api.interceptors.response.use(
  response => response,
  async error => {
    // Si erreur 401 (non autorisé), tentative de rafraîchir le token ou déconnexion
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Tentative de rafraîchir le token (décommentez si vous avez un système de refresh)
      /*
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/refresh-token`, { refreshToken });
          localStorage.setItem('auth_token', response.data.token);
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Echec du rafraîchissement du token:', refreshError);
      }
      */
      
      // Déconnexion si refresh échoue
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      
      // Redirection vers login si nécessaire
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Logs en développement uniquement (simplifiés)
if (process.env.NODE_ENV === 'development') {
  api.interceptors.request.use(
    config => {
      console.log(`→ ${config.method.toUpperCase()} ${config.url}`);
      return config;
    },
    error => {
      console.error('Erreur de requête:', error);
      return Promise.reject(error);
    }
  );
}

export default api;