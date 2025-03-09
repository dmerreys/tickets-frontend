import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import App from './App';
import './index.css';

// Definir tema con paleta personalizada
const theme = extendTheme({
  colors: {
    primary: '#655560',    // Morado oscuro
    secondary: '#A4969B',  // Rosa grisáceo
    background: '#FCF7FF', // Blanco suave
    grayLight: '#C4CAD0',  // Gris claro
    grayMedium: '#878C8F', // Gris medio
    slaCompliant: '#28a745', // Verde
    slaBreached: '#dc3545',  // Rojo
    totalTickets: '#007bff', // Azul
  },
  styles: {
    global: {
      body: {
        bg: 'background',
        color: 'primary',
      },
    },
  },
});

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);