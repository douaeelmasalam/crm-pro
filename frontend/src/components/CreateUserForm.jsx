import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CreateUserForm.css';

const CreateUserForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roles: ['user'],
    type: 'user'
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validation
    if (!formData.email.includes('@')) {
      setError('Email invalide');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Vérifier/Créer la base de données si elle n'existe pas
      const dbCheck = await fetch('http://localhost:5984/users', {
        method: 'HEAD',
        headers: {
          'Authorization': `Basic ${btoa('admin:12345')}`
        }
      });

      if (dbCheck.status === 404) {
        // Créer la base de données si elle n'existe pas
        const createDbResponse = await fetch('http://localhost:5984/users', {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${btoa('admin:12345')}`
          }
        });

        if (!createDbResponse.ok) {
          throw new Error('Échec de la création de la base de données');
        }
      }

      // 2. Créer l'utilisateur
      const response = await fetch('http://localhost:5984/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa('admin:12345')}`
        },
        body: JSON.stringify({
          ...formData,
          createdAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.reason || 'Échec de la création');
      }

      // Réinitialisation et redirection
      setFormData({
        name: '',
        email: '',
        password: '',
        roles: ['user'],
        type: 'user'
      });
      
      navigate('/users', { state: { success: 'Utilisateur créé avec succès' } });
      
    } catch (err) {
      console.error('Erreur création utilisateur:', err);
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Créer un nouvel utilisateur</h2>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nom complet</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            minLength="2"
            autoComplete="name"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label>Mot de passe</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
            autoComplete="new-password"
          />
        </div>

        <div className="form-group">
          <label>Rôle</label>
          <select
            name="roles"
            value={formData.roles[0]}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              roles: [e.target.value]
            }))}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="submit-btn"
        >
          {isSubmitting ? 'Création en cours...' : 'Créer l\'utilisateur'}
        </button>
      </form>
    </div>
  );
};

export default CreateUserForm;