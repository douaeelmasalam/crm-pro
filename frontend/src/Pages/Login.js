import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Login.module.css';

function Login({ setIsLoggedIn, setUserRole, setMessage, message }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        setIsSuccess(true);
        
        // Stockage des informations utilisateur
        localStorage.setItem('user', JSON.stringify({
          ...data.user,
          isAdmin: data.isAdmin,
          isAgent: data.isAgent
        }));

        // Ajouter un délai de 2 secondes avant la redirection
        setTimeout(() => {
          setUserRole(data.role);
          setIsLoggedIn(true);
          
          // Redirection basée sur le rôle
          if (data.isAdmin) {
            navigate('/admin/dashboard');
          } else if (data.isAgent) {
            navigate('/agent/dashboard');
          } else {
            navigate('/'); // Redirection par défaut
          }
        }, 2000);
      } else {
        const errorText = await response.text();
        setMessage(errorText);
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage("Une erreur réseau est survenue");
      setIsSuccess(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        {/* Section gauche (branding) */}
        <div className={styles.loginLeft}>
          <h1>MIACORP</h1>
          <p>SERVICES INFORMATIQUES</p>
        </div>

        {/* Section droite (formulaire) */}
        <div className={styles.loginRight}>
          <h2>Se connecter</h2>
          <form className={styles.loginForm} onSubmit={handleLogin}>
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
            <input 
              type="password" 
              placeholder="Mot de passe" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            <button type="submit">SE CONNECTER</button>
            
            {message && (
              <p className={isSuccess ? styles.successMessage : styles.errorMessage}>
                {message}
              </p>
            )}

            <div className={styles.forgotPassword}>
              <a href="/reset-password">Mot de passe oublié ?</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;