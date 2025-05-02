import React, { useEffect, useState } from "react";
import "../styles/UserList.css";

const UserList = ({ onEditUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: ""
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Utiliser l'URL directe de CouchDB avec la vue _all_docs
      const response = await fetch("http://localhost:5984/users/_all_docs?include_docs=true", {
        headers: {
          'Authorization': `Basic ${btoa('admin:12345')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      const userDocuments = data.rows.map(row => row.doc).filter(doc => doc.type === 'user');
      
      setUsers(userDocuments);
      setError(null);
    } catch (err) {
      console.error("Erreur lors de la récupération des utilisateurs :", err);
      setError("Impossible de charger les utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        // Récupérer le document pour obtenir la révision
        const docResponse = await fetch(`http://localhost:5984/users/${id}`, {
          headers: {
            'Authorization': `Basic ${btoa('admin:12345')}`
          }
        });
        
        if (!docResponse.ok) {
          throw new Error(`Erreur lors de la récupération du document: ${docResponse.status}`);
        }

        const document = await docResponse.json();
        
        // Supprimer avec la révision
        const deleteResponse = await fetch(`http://localhost:5984/users/${id}?rev=${document._rev}`, {
          method: "DELETE",
          headers: {
            'Authorization': `Basic ${btoa('admin:12345')}`
          }
        });

        if (deleteResponse.ok) {
          fetchUsers(); // Rafraîchir la liste
        } else {
          throw new Error("Échec de la suppression");
        }
      } catch (error) {
        console.error("Erreur lors de la suppression :", error);
        alert("Erreur lors de la suppression: " + error.message);
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      role: user.role || (user.roles && user.roles.length > 0 ? user.roles[0] : "Utilisateur")
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingUser) return;
    
    try {
      // Préparer les données à mettre à jour
      const updatedUser = {
        ...editingUser,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        // Si l'utilisateur avait des rôles en tableau, on les met à jour aussi
        roles: editingUser.roles ? [formData.role] : undefined
      };
      
      // Mettre à jour l'utilisateur dans CouchDB
      const response = await fetch(`http://localhost:5984/users/${editingUser._id}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa('admin:12345')}`
        },
        body: JSON.stringify(updatedUser)
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la mise à jour: ${response.status}`);
      }
      
      // Réinitialiser le formulaire et l'état d'édition
      setEditingUser(null);
      setFormData({ name: "", email: "", role: "" });
      
      // Rafraîchir la liste des utilisateurs
      fetchUsers();
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
      alert("Erreur lors de la mise à jour: " + error.message);
    }
  };
  
  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", role: "" });
  };

  if (loading) {
    return <div className="loading">Chargement en cours...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (editingUser) {
    return (
      <div className="edit-form-container">
        <h2>Modifier l'utilisateur</h2>
        <form onSubmit={handleSubmit} className="user-edit-form">
          <div className="form-group">
            <label htmlFor="name">Nom</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="role">Rôle</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleFormChange}
              required
            >
              <option value="Utilisateur">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="save-btn">Enregistrer</button>
            <button type="button" className="cancel-btn" onClick={cancelEdit}>Annuler</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="user-list-container">
      <h2 className="header">Utilisateurs</h2>
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>NOM</th>
              <th>EMAIL</th>
              <th>ROLE</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="user-name-cell">
                      <div className="user-avatar">
                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>{user.name || 'Non spécifié'}</div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    {user.roles ? user.roles.join(', ') : user.role || 'Utilisateur'}
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="edit-btn" 
                      onClick={() => handleEdit(user)}
                    >
                      Modifier
                    </button>
                    <button 
                      className="delete-btn" 
                      onClick={() => handleDelete(user._id)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-users">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;