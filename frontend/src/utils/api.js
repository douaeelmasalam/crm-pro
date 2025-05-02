export const loginUser = async (email, password) => {
  try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Échec de la connexion');
      }
      
      return await response.json();
  } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
  }
};