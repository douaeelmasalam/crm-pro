import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import '../styles/CreateTicketForm.css';

function CreateTicketForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('faible');
  const [clientConcerned, setClientConcerned] = useState('');
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [status, setStatus] = useState('ouvert');
  const [dueDate, setDueDate] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [userOptions, setUserOptions] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const priorityOptions = ['faible', 'moyenne', 'élevée', 'critique'];
  const statusOptions = ['ouvert', 'en cours', 'résolu', 'fermé'];

  // Charger les utilisateurs depuis la base de données
  useEffect(() => {
    fetch('http://localhost:3001/api/users') // adapte cette URL à ton backend
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(user => ({
          value: user._id || user.id,
          label: user.username || user.name
        }));
        setUserOptions(formatted);
      })
      .catch(err => console.error('Erreur lors du chargement des utilisateurs:', err));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('http://localhost:3001/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          priority,
          clientConcerned,
          assignedUsers: assignedUsers.map(u => u.value),
          status,
          dueDate,
          reminderDate
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Ticket créé avec succès:', data);
        setFeedback({ type: 'success', message: 'Ticket créé avec succès' });

        // Réinitialiser le formulaire
        setTitle('');
        setDescription('');
        setPriority('faible');
        setClientConcerned('');
        setAssignedUsers([]);
        setStatus('ouvert');
        setDueDate('');
        setReminderDate('');
      } else {
        const errorData = await response.json();
        console.error('Erreur lors de la création du ticket:', errorData);
        setFeedback({ type: 'error', message: errorData.message || 'Erreur lors de la création du ticket.' });
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      setFeedback({ type: 'error', message: 'Erreur réseau. Veuillez réessayer.' });
    }
  };

  return (
    <div className="create-ticket-form">
      <h2>Créer un nouveau ticket</h2>
      {feedback && <div className={`feedback ${feedback.type}`}>{feedback.message}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Titre *</label>
          <input type="text" id="title" name="title" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea id="description" name="description" value={description} onChange={e => setDescription(e.target.value)} rows="5" required />
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priorité *</label>
          <select id="priority" name="priority" value={priority} onChange={e => setPriority(e.target.value)} required>
            {priorityOptions.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="clientConcerned">Client concerné *</label>
          <input type="text" id="clientConcerned" name="clientConcerned" value={clientConcerned} onChange={e => setClientConcerned(e.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="assignedUsers">Utilisateurs assignés</label>
          <Select
            id="assignedUsers"
            options={userOptions}
            value={assignedUsers}
            onChange={setAssignedUsers}
            isMulti
            placeholder="Sélectionnez un ou plusieurs utilisateurs"
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">Statut *</label>
          <select id="status" name="status" value={status} onChange={e => setStatus(e.target.value)} required>
            {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="dueDate">Date de fin</label>
          <input type="date" id="dueDate" name="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="reminderDate">Date de rappel</label>
          <input type="date" id="reminderDate" name="reminderDate" value={reminderDate} onChange={e => setReminderDate(e.target.value)} />
        </div>

        <button type="submit">Créer le ticket</button>
      </form>
    </div>
  );
}

export default CreateTicketForm;