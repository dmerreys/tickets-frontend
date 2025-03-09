import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, VStack, Text, Heading } from '@chakra-ui/react';
import api from '../services/api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('Respuesta de login:', response.data);
      onLogin(response.data.token, response.data.user); // Pasamos token y user
    } catch (err) {
      console.error('Error en login:', err.response?.data?.msg || err.message);
      setError(err.response?.data?.msg || 'Error al iniciar sesión');
    }
  };

  return (
    <Box
      maxW="400px"
      mx="auto"
      mt={10}
      p={6}
      bg="background" // Fondo personalizado del tema
      borderWidth={1}
      borderRadius="md"
      boxShadow="lg"
      borderColor="grayLight" // Borde gris claro
    >
      <Heading mb={6} textAlign="center" color="primary">
        Iniciar Sesión
      </Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl id="email" isRequired>
            <FormLabel color="primary">Correo Electrónico</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              bg="grayLight"
              borderColor="grayMedium"
              _hover={{ borderColor: 'secondary' }}
              _focus={{ borderColor: 'primary', boxShadow: '0 0 0 1px #655560' }}
            />
          </FormControl>
          <FormControl id="password" isRequired>
            <FormLabel color="primary">Contraseña</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              bg="grayLight"
              borderColor="grayMedium"
              _hover={{ borderColor: 'secondary' }}
              _focus={{ borderColor: 'primary', boxShadow: '0 0 0 1px #655560' }}
            />
          </FormControl>
          {error && <Text color="slaBreached">{error}</Text>}
          <Button
            type="submit"
            bg="secondary"
            color="white"
            width="full"
            _hover={{ bg: '#8c7e83' }}
            _active={{ bg: 'primary' }}
          >
            Iniciar Sesión
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default Login;