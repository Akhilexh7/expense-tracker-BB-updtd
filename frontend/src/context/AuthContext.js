import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        authAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('❌ Error parsing stored user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const response = await authAPI.post('/api/auth/login', { 
        email, 
        password 
      });
      
      const { token, user } = response.data;
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set default auth header
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update state
      setUser(user);
      
      console.log('✅ Login successful');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Login failed';
      
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  };

  const signup = async (username, email, password) => {
    try {
      console.log('📝 Attempting signup for:', email);
      
      await authAPI.post('/api/auth/signup', { 
        username, 
        email, 
        password 
      });
      
      console.log('✅ Signup successful');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Signup failed:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Signup failed';
      
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete authAPI.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};