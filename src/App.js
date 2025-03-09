import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import TicketCenter from './pages/TicketCenter';
import ServiceCatalog from './pages/ServiceCatalog';
import PendingItems from './pages/PendingItems';
import Login from './pages/Login';
import api from './services/api';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({ id: '', name: '', email: '', role: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      console.log('Token encontrado en localStorage:', token);
      console.log('Usuario encontrado en localStorage:', storedUser);
      const parsedUser = JSON.parse(storedUser);
      setIsAuthenticated(true);
      setUser({
        id: parsedUser.id || parsedUser._id || '',
        name: parsedUser.name || 'Usuario Desconocido',
        email: parsedUser.email || '',
        role: parsedUser.role || ''
      });
      console.log('Usuario seteado desde localStorage:', parsedUser);
    } else {
      console.log('No hay token o usuario en localStorage');
    }
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('Token guardado tras login:', token);
    console.log('Datos del usuario recibidos tras login:', userData);
    setIsAuthenticated(true);
    setUser({
      id: userData._id || userData.id || '',
      name: userData.name || 'Usuario Desconocido',
      email: userData.email || '',
      role: userData.role || ''
    });
    console.log('Usuario seteado tras login:', {
      id: userData._id || userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser({ id: '', name: '', email: '', role: '' });
    console.log('Sesión cerrada');
  };

  return (
    <Router>
      <div className="app">
        {isAuthenticated && <Navbar onLogout={handleLogout} userName={user.name} />}
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/" element={isAuthenticated ? <TicketCenter user={user} /> : <Navigate to="/login" />} />
          <Route path="/catalogo" element={isAuthenticated ? <ServiceCatalog user={user} /> : <Navigate to="/login" />} />
          <Route path="/pendientes" element={isAuthenticated ? <PendingItems /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;