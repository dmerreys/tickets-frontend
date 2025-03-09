import React, { useEffect, useState } from 'react';
import api from '../services/api';
import TicketModal from '../components/TicketModal';
import { Box, SimpleGrid, Text, Heading, Flex } from '@chakra-ui/react';

const PendingItems = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ticketsResponse, servicesResponse] = await Promise.all([
          api.get('/tickets/my-assigned'),
          api.get('/services'),
        ]);
        // Filtramos los tickets para excluir los cerrados
        const openTickets = (ticketsResponse.data || []).filter(ticket => ticket.status !== 'cerrado');
        setTickets(openTickets);
        setServices(servicesResponse.data);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openTicket = (ticketId) => setSelectedTicket(tickets.find(t => t._id === ticketId));
  const closeTicket = () => setSelectedTicket(null);

  const handleSave = async (ticketData) => {
    await api.put(`/tickets/${ticketData._id}`, ticketData);
    setTickets(prevTickets => {
      const updatedTickets = prevTickets.map(t => (t._id === ticketData._id ? ticketData : t));
      return updatedTickets.filter(t => t.status !== 'cerrado');
    });
    closeTicket();
  };

  return (
    <Box p={4} maxW="1200px" mx="auto">
      <Heading mb={6}>Tickets Asignados a Mí</Heading>
      {loading ? (
        <Text>Cargando tickets...</Text>
      ) : tickets.length === 0 ? (
        <Text>No hay tickets abiertos asignados actualmente.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {tickets.map(ticket => (
            <Box
              key={ticket._id}
              bg="white"
              p={4}
              borderRadius="md"
              shadow="sm"
              onDoubleClick={() => openTicket(ticket._id)}
              cursor="pointer"
              _hover={{ bg: 'grayLight' }}
            >
              <Flex justify="space-between" fontWeight="bold">
                <Text>{ticket.title}</Text>
                <Text>#{ticket._id}</Text>
              </Flex>
              <Flex justify="space-between" mt={2} color="grayMedium">
                <Text>{ticket.status}</Text>
                <Text color={ticket.slaBreached ? 'slaBreached' : 'slaCompliant'}>
                  {ticket.slaBreached ? 'SLA Incumplido' : 'SLA Cumplido'}
                </Text>
              </Flex>
              <Flex justify="space-between" mt={2} fontSize="sm">
                <Text>Solicitado por: {ticket.createdBy?.name || 'Desconocido'}</Text>
                <Text>Urgencia: {ticket.urgency}</Text>
              </Flex>
            </Box>
          ))}
        </SimpleGrid>
      )}
      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          onSave={handleSave}
          onClose={closeTicket}
          services={services}
          isCreating={false}
        />
      )}
    </Box>
  );
};

export default PendingItems;