// services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
// Configuration d'axios avec une URL de base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API pour les clients
export const clientAPI = {
  getClients: async () => {
    try {
      const response = await api.get('/clients');
      return response.data;
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  },
  
  getClientById: async (id) => {
    try {
      const response = await api.get(`/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching client ${id}:`, error);
      throw error;
    }
  },
  
  createClient: async (clientData) => {
    try {
      const response = await api.post('/clients', clientData);
      return response.data;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },
  
  updateClient: async (id, clientData) => {
    try {
      const response = await api.put(`/clients/${id}`, clientData);
      return response.data;
    } catch (error) {
      console.error(`Error updating client ${id}:`, error);
      throw error;
    }
  },
  
  deleteClient: async (id) => {
    try {
      const response = await api.delete(`/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting client ${id}:`, error);
      throw error;
    }
  }
};

// API pour les prospects
export const prospectAPI = {
  // Méthodes similaires pour les prospects
  // ...
};

export default api;