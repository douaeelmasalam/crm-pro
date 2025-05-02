import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/EditUserForm.css';

const EditUserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState({
    _id: '',
    _rev: '',
    name: '',
    email: '',
    roles: ['user'],
    password: '',
    type: 'user'
  });
  
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!id) {
      setMessage({ text: "ID utilisateur manquant", type: 'error' });
      setIsLoading(false);
      return;
    }

    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:5984/users/${encodeURIComponent(id)}`, {
          headers: {
            'Authorization': `Basic ${btoa('admin:12345')}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            setMessage({ 
              text: "Utilisateur non trouvé. Voulez-vous le créer ?", 
              type: 'warning' 
            });
            setUserData(prev => ({
              ...prev,
              _id: id
            }));
            return;
          }
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data._id || !data._rev) {
          throw new Error('Données utilisateur incomplètes');
        }
        
        setUserData({
          _id: data._id,
          _rev: data._rev,
          name: data.name || '',
          email: data.email || '',
          roles: Array.isArray(data.roles) ? data.roles : [data.roles || 'user'],
          password: '',
          type: data.type || 'user'
        });
        
      } catch (err) {
        console.error("Erreur récupération utilisateur:", err);
        setMessage({ 
          text: err.message || "Erreur lors de la récupération de l'utilisateur", 
          type: 'error' 
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, [id]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleRoleChange = (e) => {
    setUserData(prev => ({
      ...prev,
      roles: [e.target.value]
    }));
  };
  
  const handleCreateUser = async () => {
    try {
      const newUser = {
        _id: id,
        name: userData.name,
        email: userData.email,
        roles: userData.roles,
        type: 'user',
        createdAt: new Date().toISOString(),
        password: userData.password
      };

      const res = await fetch(`http://localhost:5984/users/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa('admin:12345')}`
        },
        body: JSON.stringify(newUser),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.reason || 'Échec de la création');
      }

      navigate('/admin/dashboard', { state: { activeSection: 'users' } });

    } catch (error) {
      console.error('Erreur création:', error);
      setMessage({ 
        text: error.message || 'Erreur lors de la création', 
        type: 'error' 
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!id) {
      setMessage({ text: "ID utilisateur manquant", type: 'error' });
      return;
    }

    setMessage({ text: '', type: '' });
    
    try {
      if (!userData.name || !userData.email) {
        throw new Error('Le nom et l\'email sont obligatoires');
      }

      if (!userData.email.includes('@')) {
        throw new Error('Email invalide');
      }

      if (!userData._rev) {
        await handleCreateUser();
        return;
      }

      const updateData = {
        _id: userData._id,
        _rev: userData._rev,
        name: userData.name.trim(),
        email: userData.email.trim(),
        roles: userData.roles,
        type: 'user',
        updatedAt: new Date().toISOString()
      };
      
      if (userData.password && userData.password.trim()) {
        if (userData.password.length < 4) {
          throw new Error('Le mot de passe doit contenir au moins 4 caractères');
        }
        updateData.password = userData.password;
      }
      
      const res = await fetch(`http://localhost:5984/users/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa('admin:12345')}`
        },
        body: JSON.stringify(updateData),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.reason || 'Échec de la mise à jour');
      }

      // Redirection directe après mise à jour réussie
      navigate('/admin/dashboard', { state: { activeSection: 'users' } });

    } catch (error) {
      console.error('Erreur mise à jour:', error);
      setMessage({ 
        text: error.message || 'Erreur lors de la mise à jour', 
        type: 'error' 
      });
    }
  };
  
  if (isLoading) {
    return <div className="loading">Chargement en cours...</div>;
  }
  
  return (
    <div className="user-form">
      <h2 className="edit-user-title">
        {userData._rev ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}
      </h2>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
          {message.type === 'warning' && (
            <button 
              onClick={handleCreateUser}
              className="btn-create"
            >
              Créer l'utilisateur
            </button>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nom :</label>
          <input
            type="text"
            name="name"
            className="form-control"
            value={userData.name}
            onChange={handleChange}
            required
            minLength="2"
            autoComplete="name"
          />
        </div>
        
        <div className="form-group">
          <label>Email :</label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={userData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </div>
        
        <div className="form-group">
          <label>Rôle :</label>
          <select 
            name="roles" 
            className="form-control"
            value={userData.roles[0] || 'user'}
            onChange={handleRoleChange}
            required
          >
            <option value="user">Utilisateur</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Mot de passe :</label>
          <input
            type="password"
            name="password"
            className="form-control"
            value={userData.password}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={userData._rev ? undefined : "4"}
            required={!userData._rev}
          />
          <small className="password-hint">
            {userData._rev ? 
              "(Remplissez uniquement si vous souhaitez changer le mot de passe)" : 
              "(Minimum 6 caractères)"}
          </small>
        </div>
        
        <button 
          type="submit" 
          className="btn-update"
          disabled={isLoading}
        >
          {isLoading ? 'En cours...' : (userData._rev ? 'Mettre à jour' : 'Créer')}
        </button>
      </form>
    </div>
  );
};

export default EditUserForm;
