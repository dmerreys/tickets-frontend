import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Flex, Text, Button, Icon } from '@chakra-ui/react'; 
import { FaHome } from 'react-icons/fa';

const Navbar = ({ onLogout, userName }) => {
  return (
    <Box bg="primary" color="white" px={4} py={3}>
      <Flex justify="space-between" align="center" maxW="1200px" mx="auto" direction={{ base: 'column', md: 'row' }}>
        <Flex align="center" mb={{ base: 2, md: 0 }}>
          <Icon as={FaHome} fontSize="xl" mr={2} />
          <Link to="/">
            <Text fontSize="lg" fontWeight="bold">Centro de Servicio al Usuario</Text>
          </Link>
        </Flex>
        <Flex gap={4} direction={{ base: 'column', md: 'row' }} align="center">
          <Link to="/"><Text _hover={{ color: 'secondary' }}>Centro de Tickets</Text></Link>
          <Link to="/catalogo"><Text _hover={{ color: 'secondary' }}>Catálogo de Servicios</Text></Link>
          <Link to="/pendientes"><Text _hover={{ color: 'secondary' }}>Tickets Pendientes</Text></Link>
          <Text>Hola, {userName}</Text>
          <Button bg="slaBreached" color="white" _hover={{ bg: '#c82333' }} onClick={onLogout} size="sm">
            Cerrar Sesión
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar;