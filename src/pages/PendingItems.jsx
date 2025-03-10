import React, { useEffect, useState } from 'react';
import api from '../services/api';
import TicketModal from '../components/TicketModal';
import { Box, SimpleGrid, Text, Heading, Flex, Checkbox } from '@chakra-ui/react';

const PendingItems = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClosed, setShowClosed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ticketsResponse, servicesResponse] = await Promise.all([
          api.get('/tickets/my-assigned'),
          api.get('/services'),
        ]);
        const allTickets = ticketsResponse.data || [];
        setTickets(allTickets);
        setFilteredTickets(allTickets.filter(ticket => !['resuelto', 'cerrado'].includes(ticket.status)));
        setServices(servicesResponse.data);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setTickets([]);
        setFilteredTickets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setFilteredTickets(
      showClosed
        ? tickets
        : tickets.filter(ticket => !['resuelto', 'cerrado'].includes(ticket.status))
    );
  }, [showClosed, tickets]);

  const openTicket = (ticketId) => {
    const ticket = tickets.find(t => t._id === ticketId);
    if (ticket) {
      setSelectedTicket(ticket);
    } else {
      console.error('Ticket no encontrado en el estado local');
    }
  };

  const closeTicket = () => setSelectedTicket(null);

  const handleSave = async (ticketData) => {
    try {
      if (ticketData.worklog && ticketData.worklog.length > 0) {
        const lastWorklog = ticketData.worklog[ticketData.worklog.length - 1];
        if (lastWorklog.type === 'Resuelto' && ticketData.status !== 'cerrado') {
          ticketData.status = 'resuelto';
        } else if (lastWorklog.type === 'Cerrado') {
          ticketData.status = 'cerrado';
        }
      }
      await api.put(`/tickets/${ticketData._id}`, ticketData);
      
      const updatedTickets = tickets.map(t => (t._id === ticketData._id ? ticketData : t));
      setTickets(updatedTickets);
      setFilteredTickets(
        showClosed
          ? updatedTickets
          : updatedTickets.filter(t => !['resuelto', 'cerrado'].includes(t.status))
      );
      closeTicket();
    } catch (err) {
      console.error('Error al guardar ticket:', err);
    }
  };

  const toggleShowClosed = () => setShowClosed(prev => !prev);

  return (
    <Box p={4} maxW="1200px" mx="auto">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md">Tickets Asignados a Mí</Heading>
        <Checkbox
          isChecked={showClosed}
          onChange={toggleShowClosed}
          colorScheme="primary"
          bg={showClosed ? 'primary.100' : 'transparent'}
          p={2}
          borderRadius="md"
          border={showClosed ? '2px solid' : 'none'}
          borderColor="primary.300"
        >
          Mostrar Tickets Resueltos/Cerrados
        </Checkbox>
      </Flex>
      {loading ? (
        <Text>Cargando tickets...</Text>
      ) : filteredTickets.length === 0 ? (
        <Text>No hay tickets {showClosed ? 'asignados' : 'pendientes'} actualmente.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {filteredTickets.map(ticket => (
            <Box
              key={ticket._id}
              bg="white"
              p={4}
              borderRadius="md"
              shadow="sm"
              onClick={() => openTicket(ticket._id)}
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

export default PendingItems