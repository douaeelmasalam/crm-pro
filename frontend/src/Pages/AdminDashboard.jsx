import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PouchDB from 'pouchdb';
import '../styles/AdminDashboard.css';
import '../styles/Userform.css';
import CreateUserForm from '../components/CreateUserForm';
import UserList from '../components/UserList';
import ProspectForm from '../components/ProspectForm';
import CombinedClientsList from '../components/ClientsList';
import CreateTicketForm from '../components/CreateTicketForm';
import TicketList from '../components/TicketList';

// CouchDB connection setup
const remoteUsersDB = new PouchDB('http://localhost:5984/users');
const remoteTicketsDB = new PouchDB('http://localhost:5984/tickets');
const remoteClientsDB = new PouchDB('http://localhost:5984/clients');
const remoteProspectsDB = new PouchDB('http://localhost:5984/prospects');

// Local PouchDB instances for offline capabilities
const localUsersDB = new PouchDB('users');
const localTicketsDB = new PouchDB('tickets');
const localClientsDB = new PouchDB('clients');
const localProspectsDB = new PouchDB('prospects');

// Set up sync
localUsersDB.sync(remoteUsersDB, { live: true, retry: true });
localTicketsDB.sync(remoteTicketsDB, { live: true, retry: true });
localClientsDB.sync(remoteClientsDB, { live: true, retry: true });
localProspectsDB.sync(remoteProspectsDB, { live: true, retry: true });

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stats, setStats] = useState({
    users: 0,
    tickets: 0,
    openTickets: 0,
    clients: 0,
    prospects: 0
  });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchStats();
    
    if (location.state && location.state.activeSection) {
      setActiveSection(location.state.activeSection);
    }
  }, [location]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Get users count
      const usersResult = await localUsersDB.allDocs();
      const usersCount = usersResult.total_rows;
      
      // Get tickets and count open ones
      const ticketsResult = await localTicketsDB.allDocs({
        include_docs: true
      });
      const ticketsCount = ticketsResult.total_rows;
      const openTicketsCount = ticketsResult.rows.filter(row => 
        row.doc && row.doc.status === 'open'
      ).length;
      
      // Get clients count
      const clientsResult = await localClientsDB.allDocs();
      const clientsCount = clientsResult.total_rows;
      
      // Get prospects count
      const prospectsResult = await localProspectsDB.allDocs();
      const prospectsCount = prospectsResult.total_rows;
      
      setStats({
        users: usersCount,
        tickets: ticketsCount,
        openTickets: openTicketsCount,
        clients: clientsCount,
        prospects: prospectsCount
      });
      
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (id) => {
    navigate(`/admin/edit-user/${id}`);
  };

  const handleUserUpdated = () => {
    fetchStats();
    setActiveSection('users');
    navigate('/admin/dashboard', { state: { activeSection: 'users' } });
  };

  const handleProspectUpdated = () => {
    fetchStats();
    setActiveSection('prospects');
  };

  const handleClientUpdated = () => {
    fetchStats();
    setActiveSection('clients');
  };

  const handleTicketUpdated = () => {
    fetchStats();
    setActiveSection('tickets');
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <h2>Dashboard Overview</h2>
            {loading ? (
              <div className="loading">Chargement des statistiques...</div>
            ) : (
              <div className="stats-container">
                <div className="stat-card">
                  <h3>Users</h3>
                  <p className="stat-value">{stats.users}</p>
                </div>
                <div className="stat-card">
                  <h3>Tickets</h3>
                  <p className="stat-value">{stats.tickets}</p>
                  <p className="stat-sub">{stats.openTickets} open</p>
                </div>
                <div className="stat-card">
                  <h3>Clients</h3>
                  <p className="stat-value">{stats.clients}</p>
                </div>
                <div className="stat-card">
                  <h3>Prospects</h3>
                  <p className="stat-value">{stats.prospects}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'users':
        return (
          <div>
            <h2>User Data</h2>
            <UserList 
              db={localUsersDB} 
              onEditUser={handleEditUser} 
            />
          </div>
        );

      case 'createUser':
        return (
          <div>
            <h2>Create User</h2>
            <CreateUserForm 
              db={localUsersDB} 
              onUserUpdated={handleUserUpdated} 
            />
          </div>
        );

      case 'tickets':
        return (
          <div>
            <h2>Tickets</h2>
            <TicketList 
              db={localTicketsDB} 
              onTicketUpdated={handleTicketUpdated}
            />
          </div>
        );
                
      case 'createTicket':
        return (
          <div>
            <h2>Create Ticket</h2>
            <CreateTicketForm 
              db={localTicketsDB} 
              usersDb={localUsersDB} 
              onTicketUpdated={handleTicketUpdated}
            />
          </div>
        );

      case 'clients':
        return (
          <div>
            <CombinedClientsList 
              db={localClientsDB} 
              onClientUpdated={handleClientUpdated} 
            />
          </div>
        );

      case 'prospects':
        return (
          <div>
            <h2>Gestion des Prospects</h2>
            <ProspectForm 
              db={localProspectsDB} 
              clientsDb={localClientsDB}
              onProspectUpdated={handleProspectUpdated} 
            />
          </div>
        );

      case 'documents':
        return (
          <div>
            <h2>Documents</h2>
            <p>Document management will be implemented here.</p>
          </div>
        );

      default:
        return <div>Select a section</div>;
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h1>CRM-PRO</h1>
          <p>Admin Panel</p>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li 
              className={activeSection === 'dashboard' ? 'active' : ''} 
              onClick={() => setActiveSection('dashboard')}
            >
              Dashboard
            </li>
            <li 
              className={activeSection === 'users' ? 'active' : ''} 
              onClick={() => {
                setActiveSection('users');
                fetchStats();
              }}
            >
              User Data
            </li>
            <li 
              className={activeSection === 'createUser' ? 'active' : ''} 
              onClick={() => setActiveSection('createUser')}
            >
              Create/Edit User
            </li>
            <li 
              className={activeSection === 'tickets' ? 'active' : ''} 
              onClick={() => {
                setActiveSection('tickets');
                fetchStats();
              }}
            >
              Tickets
            </li>
            <li 
              className={activeSection === 'createTicket' ? 'active' : ''} 
              onClick={() => setActiveSection('createTicket')}
            >
              Create Ticket
            </li>
            <li 
              className={activeSection === 'clients' ? 'active' : ''} 
              onClick={() => {
                setActiveSection('clients');
                fetchStats();
              }}
            >
              Fiches Clients
            </li>
            <li 
              className={activeSection === 'prospects' ? 'active' : ''} 
              onClick={() => {
                setActiveSection('prospects');
                fetchStats();
              }}
            >
              Prospects
            </li>
            <li 
              className={activeSection === 'documents' ? 'active' : ''} 
              onClick={() => setActiveSection('documents')}
            >
              Documents
            </li>
          </ul>
        </nav>
      </div>

      <div className="admin-content">
        <header className="admin-header">
          <h2>Admin Dashboard</h2>
          <div className="user-info">
            <span>Admin User</span>
            <button className="logout-btn">Logout</button>
          </div>
        </header>
        <main className="content-area">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;