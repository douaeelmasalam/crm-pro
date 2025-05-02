import React, { useState, useEffect } from 'react';
import '../styles/TicketList.css';

function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/tickets');
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      setTickets(data);
    } catch (err) {
      setError('Erreur lors du chargement des tickets.');
    } finally {
      setLoading(false);
    }
  };

  const deleteTicket = async (id) => {
    if (!window.confirm("Confirmer la suppression de ce ticket ?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/tickets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur de suppression');
      setTickets(tickets.filter(ticket => ticket._id !== id));
      if (selectedTicket && selectedTicket._id === id) {
        closeTicketDetail();
      }
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  const openTicketDetail = async (ticket) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tickets/${ticket._id}`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const detailedTicket = await response.json();
      setSelectedTicket(detailedTicket);
      setEditFormData(detailedTicket);
      setIsEditing(false);
    } catch (err) {
      alert("Erreur lors du chargement des détails du ticket.");
    }
  };

  const closeTicketDetail = () => {
    setSelectedTicket(null);
    setIsEditing(false);
    setEditFormData({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const saveTicketChanges = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/tickets/${selectedTicket._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const updatedTicket = await response.json();
      
      // Update the ticket in the tickets array
      setTickets(tickets.map(t => t._id === updatedTicket._id ? updatedTicket : t));
      setSelectedTicket(updatedTicket);
      setIsEditing(false);
      alert("Ticket mis à jour avec succès !");
    } catch (err) {
      alert("Erreur lors de la mise à jour du ticket.");
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = (
      ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.clientConcerned?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filter !== 'all') {
      return matchesSearch && ticket.status === filter;
    }

    return matchesSearch;
  });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortConfig.key === null) {
      return 0;
    }
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    if (aValue < bValue) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case 'ouvert': return 'status-open';
      case 'en cours': return 'status-in-progress';
      case 'résolu': return 'status-resolved';
      case 'fermé': return 'status-closed';
      default: return '';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'faible': return 'priority-low';
      case 'moyenne': return 'priority-medium';
      case 'élevée': return 'priority-high';
      case 'critique': return 'priority-critical';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const getUserName = (user) => {
    if (!user) return '';
    if (typeof user === 'object' && user.name) {
      return user.name;
    }
    if (typeof user === 'object' && user.username) {
      return user.username;
    }
    return 'Utilisateur';
  };

  if (loading) return <div className="loading-container">Chargement...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="ticket-list-container">
      <div className="ticket-list-header">
        <h1>Tickets</h1>
        <div className="header-actions">
          <div className="search-container">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 14L10 10M11.3333 6.66667C11.3333 9.244 9.244 11.3333 6.66667 11.3333C4.08934 11.3333 2 4.08934 2 6.66667C2 4.08934 4.08934 2 6.66667 2C9.244 2 11.3333 4.08934 11.3333 6.66667Z" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous</option>
            <option value="ouvert">Ouvert</option>
            <option value="en cours">En cours</option>
            <option value="résolu">Résolu</option>
            <option value="fermé">Fermé</option>
          </select>
          <button onClick={fetchTickets} className="refresh-button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.5 8C13.5 9.05058 13.1725 10.0909 12.5538 10.9749C11.9352 11.8589 11.0525 12.5436 10.0241 12.9294C8.99566 13.3152 7.87099 13.3831 6.80315 13.1237C5.73531 12.8643 4.77598 12.2903 4.05025 11.4785M2.5 8C2.5 6.94942 2.82749 5.90914 3.44615 5.02513C4.06481 4.14112 4.94753 3.45639 5.97595 3.07061C7.00438 2.68482 8.12904 2.61688 9.19688 2.87629C10.2647 3.1357 11.224 3.70974 11.9497 4.52153M13.5 3V6.5H10M2.5 13V9.5H6" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="ticket-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('title')}>Titre</th>
              <th onClick={() => requestSort('description')}>Description</th>
              <th onClick={() => requestSort('clientConcerned')}>Client</th>
              <th onClick={() => requestSort('assignedUsers')}>Assigné à</th>
              <th onClick={() => requestSort('priority')}>Priorité</th>
              <th onClick={() => requestSort('status')}>Statut</th>
              <th onClick={() => requestSort('dueDate')}>Échéance</th>
              <th onClick={() => requestSort('reminderDate')}>Rappel</th>
              <th onClick={() => requestSort('createdAt')}>Créé le</th>
              <th onClick={() => requestSort('updatedAt')}>Modifié le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTickets.length === 0 ? (
              <tr className="no-tickets-row">
                <td colSpan="11">Aucun ticket trouvé</td>
              </tr>
            ) : (
              sortedTickets.map((ticket) => (
                <tr key={ticket._id} className="ticket-row">
                  <td>
                    <div className="ticket-title" onClick={() => openTicketDetail(ticket)}>
                      <div className="ticket-icon">{ticket.title?.charAt(0)?.toUpperCase()}</div>
                      <span>{ticket.title}</span>
                    </div>
                  </td>
                  <td className="ticket-description">{ticket.description?.substring(0, 50)}{ticket.description?.length > 50 ? '...' : ''}</td>
                  <td>{ticket.clientConcerned}</td>
                  <td>
                    {ticket.assignedUsers?.length > 0 ? 
                      ticket.assignedUsers.map((user, index) => (
                        <span key={index} className="assigned-user">
                          {getUserName(user)}
                        </span>
                      )) : 
                      'Non assigné'}
                  </td>
                  <td>
                    <span className={`priority-badge ${getPriorityClass(ticket.priority)}`}>
                      {ticket.priority === 'faible' ? 'Faible' :
                       ticket.priority === 'moyenne' ? 'Moyenne' :
                       ticket.priority === 'élevée' ? 'Élevée' :
                       ticket.priority === 'critique' ? 'Critique' : ticket.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(ticket.status)}`}>
                      {ticket.status === 'ouvert' ? 'Ouvert' :
                       ticket.status === 'en cours' ? 'En cours' :
                       ticket.status === 'résolu' ? 'Résolu' :
                       ticket.status === 'fermé' ? 'Fermé' : ticket.status}
                    </span>
                  </td>
                  <td>{formatDate(ticket.dueDate)}</td>
                  <td>{formatDate(ticket.reminderDate)}</td>
                  <td>{formatDate(ticket.createdAt)}</td>
                  <td>{formatDate(ticket.updatedAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="view-button"
                        onClick={() => openTicketDetail(ticket)}
                        title="Voir"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12Z" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 8V8.01" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M15 8C13.5 11 10.5 13 8 13C5.5 13 2.5 11 1 8C2.5 5 5.5 3 8 3C10.5 3 13.5 5 15 8Z" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button 
                        className="edit-button"
                        onClick={() => {
                          openTicketDetail(ticket);
                          setIsEditing(true);
                        }}
                        title="Modifier"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 13.3333H14M11 2.33333C11.2652 2.06812 11.6249 1.91905 12 1.91905C12.1857 1.91905 12.3696 1.9557 12.5412 2.02691C12.7128 2.09812 12.8687 2.20243 13 2.33333C13.1313 2.46424 13.2356 2.61916 13.3068 2.78975C13.378 2.96034 13.4147 3.14325 13.4147 3.328C13.4147 3.51275 13.378 3.69566 13.3068 3.86625C13.2356 4.03684 13.1313 4.19176 13 4.32266L4.66667 12.6667L2 13.3333L2.66667 10.6667L11 2.33333Z" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => deleteTicket(ticket._id)}
                        title="Supprimer"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 4H3.33333H14" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M5.3335 4V2.66667C5.3335 2.31305 5.47397 1.97391 5.72402 1.72386C5.97407 1.47381 6.31321 1.33334 6.66683 1.33334H9.3335C9.68712 1.33334 10.0263 1.47381 10.2763 1.72386C10.5264 1.97391 10.6668 2.31305 10.6668 2.66667V4M12.6668 4V13.3333C12.6668 13.687 12.5264 14.0261 12.2763 14.2761C12.0263 14.5262 11.6871 14.6667 11.3335 14.6667H4.66683C4.31321 14.6667 3.97407 14.5262 3.72402 14.2761C3.47397 14.0261 3.3335 13.687 3.3335 13.3333V4H12.6668Z" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="ticket-detail-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{isEditing ? "Modifier le ticket" : "Détails du ticket"}</h2>
              <button className="close-button" onClick={closeTicketDetail}>×</button>
            </div>
            <div className="modal-body">
              {isEditing ? (
                <form onSubmit={saveTicketChanges} className="edit-form">
                  <div className="form-group">
                    <label htmlFor="title">Titre</label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={editFormData.title || ''}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      name="description"
                      id="description"
                      value={editFormData.description || ''}
                      onChange={handleEditChange}
                      rows="4"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="clientConcerned">Client</label>
                    <input
                      type="text"
                      name="clientConcerned"
                      id="clientConcerned"
                      value={editFormData.clientConcerned || ''}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="priority">Priorité</label>
                      <select
                        name="priority"
                        id="priority"
                        value={editFormData.priority || ''}
                        onChange={handleEditChange}
                      >
                        <option value="faible">Faible</option>
                        <option value="moyenne">Moyenne</option>
                        <option value="élevée">Élevée</option>
                        <option value="critique">Critique</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="status">Statut</label>
                      <select
                        name="status"
                        id="status"
                        value={editFormData.status || ''}
                        onChange={handleEditChange}
                      >
                        <option value="ouvert">Ouvert</option>
                        <option value="en cours">En cours</option>
                        <option value="résolu">Résolu</option>
                        <option value="fermé">Fermé</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="dueDate">Échéance</label>
                      <input
                        type="datetime-local"
                        name="dueDate"
                        id="dueDate"
                        value={editFormData.dueDate ? new Date(editFormData.dueDate).toISOString().slice(0, 16) : ''}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="reminderDate">Rappel</label>
                      <input
                        type="datetime-local"
                        name="reminderDate"
                        id="reminderDate"
                        value={editFormData.reminderDate ? new Date(editFormData.reminderDate).toISOString().slice(0, 16) : ''}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="cancel-button" onClick={() => setIsEditing(false)}>Annuler</button>
                    <button type="submit" className="save-button">Enregistrer</button>
                  </div>
                </form>
              ) : (
                <div className="ticket-details">
                  <div className="detail-row">
                    <div className="detail-label">Titre:</div>
                    <div className="detail-value">{selectedTicket.title}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Description:</div>
                    <div className="detail-value">{selectedTicket.description}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Client:</div>
                    <div className="detail-value">{selectedTicket.clientConcerned}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Assigné à:</div>
                    <div className="detail-value">
                      {selectedTicket.assignedUsers?.length > 0 ? 
                        selectedTicket.assignedUsers.map((user, index) => (
                          <span key={index} className="assigned-user">
                            {getUserName(user)}
                          </span>
                        )) : 
                        'Non assigné'}
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Priorité:</div>
                    <div className="detail-value">
                      <span className={`priority-badge ${getPriorityClass(selectedTicket.priority)}`}>
                        {selectedTicket.priority === 'faible' ? 'Faible' :
                         selectedTicket.priority === 'moyenne' ? 'Moyenne' :
                         selectedTicket.priority === 'élevée' ? 'Élevée' :
                         selectedTicket.priority === 'critique' ? 'Critique' : selectedTicket.priority}
                      </span>
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Statut:</div>
                    <div className="detail-value">
                      <span className={`status-badge ${getStatusClass(selectedTicket.status)}`}>
                        {selectedTicket.status === 'ouvert' ? 'Ouvert' :
                         selectedTicket.status === 'en cours' ? 'En cours' :
                         selectedTicket.status === 'résolu' ? 'Résolu' :
                         selectedTicket.status === 'fermé' ? 'Fermé' : selectedTicket.status}
                      </span>
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Échéance:</div>
                    <div className="detail-value">{formatDate(selectedTicket.dueDate)}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Rappel:</div>
                    <div className="detail-value">{formatDate(selectedTicket.reminderDate)}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Créé le:</div>
                    <div className="detail-value">{formatDate(selectedTicket.createdAt)}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Modifié le:</div>
                    <div className="detail-value">{formatDate(selectedTicket.updatedAt)}</div>
                  </div>
                  <div className="detail-actions">
                    <button className="edit-button" onClick={toggleEdit}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 13.3333H14M11 2.33333C11.2652 2.06812 11.6249 1.91905 12 1.91905C12.1857 1.91905 12.3696 1.9557 12.5412 2.02691C12.7128 2.09812 12.8687 2.20243 13 2.33333C13.1313 2.46424 13.2356 2.61916 13.3068 2.78975C13.378 2.96034 13.4147 3.14325 13.4147 3.328C13.4147 3.51275 13.378 3.69566 13.3068 3.86625C13.2356 4.03684 13.1313 4.19176 13 4.32266L4.66667 12.6667L2 13.3333L2.66667 10.6667L11 2.33333Z" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Modifier
                    </button>
                    <button className="delete-button" onClick={() => deleteTicket(selectedTicket._id)}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 4H3.33333H14" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5.3335 4V2.66667C5.3335 2.31305 5.47397 1.97391 5.72402 1.72386C5.97407 1.47381 6.31321 1.33334 6.66683 1.33334H9.3335C9.68712 1.33334 10.0263 1.47381 10.2763 1.72386C10.5264 1.97391 10.6668 2.31305 10.6668 2.66667V4M12.6668 4V13.3333C12.6668 13.687 12.5264 14.0261 12.2763 14.2761C12.0263 14.5262 11.6871 14.6667 11.3335 14.6667H4.66683C4.31321 14.6667 3.97407 14.5262 3.72402 14.2761C3.47397 14.0261 3.3335 13.687 3.3335 13.3333V4H12.6668Z" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketList;