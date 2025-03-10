import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import TicketCenter from './pages/TicketCenter';
import ServiceCatalog from './pages/ServiceCatalog';
import PendingItems from './pages/PendingItems';
import Login from './pages/Login';
import api, { setLogoutHandler } from './services/api';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({ id: '', name: '', email: '', role: '' });
  const [logoutMessage, setLogoutMessage] = useState('');

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


    setLogoutHandler(handleLogout);
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
    setLogoutMessage('');
    console.log('Usuario seteado tras login:', {
      id: userData._id || userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role
    });
  };

  const handleLogout = (reason = {}) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser({ id: '', name: '', email: '', role: '' });

   
    if (reason.status === 401) {
      setLogoutMessage('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    } else if (reason.status === 404) {
      setLogoutMessage('Tu cuenta ya no existe. Contacta al administrador.');
    } else {
      setLogoutMessage(''); 
    }

    console.log('Sesión cerrada', reason.status ? `por error ${reason.status}: ${reason.message}` : 'manualmente');
  };

  return (
    <Router>
      <div className="app">
        {isAuthenticated && <Navbar onLogout={handleLogout} userName={user.name} />}
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login onLogin={handleLogin} logoutMessage={logoutMessage} /> : <Navigate to="/" />} />
          <Route path="/" element={isAuthenticated ? <TicketCenter user={user} /> : <Navigate to="/login" />} />
          <Route path="/catalogo" element={isAuthenticated ? <ServiceCatalog user={user} /> : <Navigate to="/login" />} />
          <Route path="/pendientes" element={isAuthenticated ? <PendingItems /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;