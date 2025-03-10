import React, { useState, useEffect } from 'react';
import api from '../services/api';
import TicketModal from '../components/TicketModal';
import {
  Box,
  Flex,
  Text,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  VStack,
  Checkbox,
  HStack,
  useToast,
} from '@chakra-ui/react';

const TicketCenter = ({ user }) => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    urgency: '',
    assignedTo: '',
    showClosed: true,
    createdByMe: false,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTickets: 0,
    slaBreachedCount: 0,
    slaCompliantCount: 0,
  });
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const toast = useToast();

  const fetchTickets = async (page = 1, sort = `${sortConfig.direction === 'desc' ? '-' : ''}createdAt`) => {
    try {
      setLoading(true);
      let ticketsEndpoint = filters.createdByMe
        ? '/tickets/my-tickets'
        : `/tickets?page=${page}&limit=10&sort=${sort}`;

      if (!filters.createdByMe) {
        if (filters.status) ticketsEndpoint += `&status=${filters.status}`;
        if (filters.urgency) ticketsEndpoint += `&urgency=${filters.urgency}`;
        if (filters.assignedTo) ticketsEndpoint += `&assignedTo=${filters.assignedTo === 'unassigned' ? 'null' : filters.assignedTo}`;
        if (!filters.showClosed) ticketsEndpoint += `&excludeStatus=cerrado`;
      }

      const ticketsResponse = await api.get(ticketsEndpoint);
      const ticketsData = filters.createdByMe ? ticketsResponse.data : ticketsResponse.data.tickets || [];

      setTickets(ticketsData);
      setFilteredTickets(ticketsData);

      if (!filters.createdByMe) {
        setPagination({
          currentPage: ticketsResponse.data.currentPage || 1,
          totalPages: ticketsResponse.data.totalPages || 1,
          totalTickets: ticketsResponse.data.totalTickets || ticketsData.length,
          slaBreachedCount: ticketsResponse.data.slaBreachedCount || 0,
          slaCompliantCount: ticketsResponse.data.slaCompliantCount || 0,
        });
      } else {
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalTickets: ticketsData.length,
          slaBreachedCount: ticketsData.filter(t => t.slaBreached).length,
          slaCompliantCount: ticketsData.length - ticketsData.filter(t => t.slaBreached).length,
        });
      }
    } catch (err) {
      console.error('Error al cargar tickets:', err.response?.status, err.response?.data || err.message);
      setTickets([]);
      setFilteredTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchTickets(pagination.currentPage);
      try {
        const servicesResponse = await api.get('/services');
        setServices(servicesResponse.data || []);
      } catch (serviceErr) {
        console.error('Error al cargar servicios:', serviceErr.response?.status, serviceErr.response?.data || serviceErr.message);
        setServices([]);
      }
    };
    fetchData();
  }, [pagination.currentPage, filters]);

  const totalTickets = pagination.totalTickets;
  const slaBreached = pagination.slaBreachedCount;
  const slaCompliant = pagination.slaCompliantCount;

  const openTicket = (ticketId) => {
    const ticket = tickets.find(t => t._id === ticketId);
    if (ticket) {
      setSelectedTicket(ticket);
    } else {
      console.error('Ticket no encontrado en el estado local');
    }
  };

  const closeTicket = () => {
    setSelectedTicket(null);
    setIsCreating(false);
  };

  const handleSave = async (ticketData, isCreated = false, hasWorklog = false, isClosed = false) => {
    try {
      if (isCreated) {
        const response = await api.post('/tickets', ticketData);
        toast({
          title: 'Ticket creado',
          description: `El ticket ${response.data.ticketId} se ha creado con éxito.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        });
        await fetchTickets(1);
      } else {
        await api.put(`/tickets/${ticketData._id}`, ticketData);
        if (hasWorklog) {
          const lastWorklog = ticketData.worklog[ticketData.worklog.length - 1];
          if (lastWorklog.type === 'Resuelto') {
            toast({
              title: 'Ticket resuelto',
              description: `El ticket ${ticketData.ticketId} ha sido resuelto.`,
              status: 'success',
              duration: 3000,
              isClosable: true,
              position: 'top-right',
            });
          } else if (lastWorklog.type === 'Cerrado') {
            toast({
              title: 'Ticket cerrado',
              description: `El ticket ${ticketData.ticketId} ha sido cerrado.`,
              status: 'success',
              duration: 3000,
              isClosable: true,
              position: 'top-right',
            });
          } else {
            toast({
              title: 'Registro de trabajo añadido',
              description: `Se agregó un registro al ticket ${ticketData.ticketId}.`,
              status: 'info',
              duration: 3000,
              isClosable: true,
              position: 'top-right',
            });
          }
        } else if (isClosed) {
          toast({
            title: 'Ticket cerrado',
            description: `El ticket ${ticketData.ticketId} ha sido cerrado.`,
            status: 'success',
            duration: 3000,
            isClosable: true,
            position: 'top-right',
          });
        } else {
          toast({
            title: 'Ticket actualizado',
            description: `El ticket ${ticketData.ticketId} se ha actualizado con éxito.`,
            status: 'success',
            duration: 3000,
            isClosable: true,
            position: 'top-right',
          });
        }
        await fetchTickets(pagination.currentPage);
      }
      closeTicket();
    } catch (err) {
      const errorMsg = err.response?.data?.msg || err.message;
      console.error('Error al guardar ticket:', errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
      throw new Error(errorMsg);
    }
  };

  const handleNewTicket = () => {
    setIsCreating(true);
    setSelectedTicket({
      title: '',
      description: '',
      service: '',
      priority: 'media',
      urgency: 'Media',
      createdBy: user?._id || '',
      email: user?.email || '',
      phone: '',
      organization: '',
      impact: '',
      severity: '',
      additionalInfo: '',
      contact: '',
      teamviewer: '',
      provider: '',
      system: '',
      closeCode: '',
      relatedTickets: [],
      status: 'abierto',
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFilters(prev => ({ ...prev, [name]: checked }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleSort = (key) => {
    const newDirection = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction: newDirection });
    if (key === 'createdAt') {
      fetchTickets(pagination.currentPage, `${newDirection === 'desc' ? '-' : ''}createdAt`);
    }
  };

  const uniqueTechnicians = [...new Set(tickets.map(t => t.assignedTo?.name).filter(Boolean))];

  return (
    <Box p={{ base: 2, md: 4 }} maxW="1200px" mx="auto">
      <Flex justify="space-between" mb={6} flexWrap="wrap" gap={4}>
        <Heading size="md">Tickets Totales: <Text as="span" color="totalTickets">{totalTickets}</Text></Heading>
        <Heading size="md">SLA Incumplidos: <Text as="span" color="slaBreached">{slaBreached}</Text></Heading>
        <Heading size="md">SLA Cumplidos: <Text as="span" color="slaCompliant">{slaCompliant}</Text></Heading>
        <Button bg="secondary" color="white" _hover={{ bg: '#8c7e83' }} onClick={handleNewTicket}>Nuevo Ticket</Button>
      </Flex>
      <VStack spacing={4} align="start" mb={6}>
        <Flex gap={4} flexWrap="wrap" direction={{ base: 'column', md: 'row' }}>
          <Select name="status" value={filters.status} onChange={handleFilterChange} bg="grayLight" w={{ base: '100%', md: '200px' }}>
            <option value="">Todos los Estados</option>
            <option value="abierto">Abierto</option>
            <option value="en progreso">En Progreso</option>
            <option value="resuelto">Resuelto</option>
            <option value="cerrado">Cerrado</option>
          </Select>
          <Select name="urgency" value={filters.urgency} onChange={handleFilterChange} bg="grayLight" w={{ base: '100%', md: '200px' }}>
            <option value="">Toda la Urgencia</option>
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Alta">Alta</option>
          </Select>
          <Select name="assignedTo" value={filters.assignedTo} onChange={handleFilterChange} bg="grayLight" w={{ base: '100%', md: '200px' }}>
            <option value="">Todos los Técnicos</option>
            <option value="unassigned">Sin Asignar</option>
            {uniqueTechnicians.map(tech => (
              <option key={tech} value={tech}>{tech}</option>
            ))}
          </Select>
          <Checkbox
            name="showClosed"
            isChecked={filters.showClosed}
            onChange={handleCheckboxChange}
            colorScheme="primary"
            bg={filters.showClosed ? 'primary.100' : 'transparent'}
            p={2}
            borderRadius="md"
            border={filters.showClosed ? '2px solid' : 'none'}
            borderColor="primary.300"
          >
            Mostrar Tickets Cerrados
          </Checkbox>
          <Checkbox
            name="createdByMe"
            isChecked={filters.createdByMe}
            onChange={handleCheckboxChange}
            colorScheme="primary"
            bg={filters.createdByMe ? 'primary.100' : 'transparent'}
            p={2}
            borderRadius="md"
            border={filters.createdByMe ? '2px solid' : 'none'}
            borderColor="primary.300"
          >
            Solo Mis Tickets
          </Checkbox>
        </Flex>
      </VStack>
      {loading ? (
        <Text color="primary">Cargando tickets...</Text>
      ) : filteredTickets.length === 0 ? (
        <Text color="primary">No hay tickets que coincidan con los filtros.</Text>
      ) : (
        <>
          <Box overflowX="auto" w="100%">
            <Table variant="simple" size={{ base: 'sm', md: 'md' }}>
              <Thead>
                <Tr>
                  <Th onClick={() => handleSort('ticketId')} cursor="pointer" whiteSpace="nowrap">
                    ID {sortConfig.key === 'ticketId' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </Th>
                  <Th onClick={() => handleSort('title')} cursor="pointer" whiteSpace="nowrap">
                    Título {sortConfig.key === 'title' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </Th>
                  <Th onClick={() => handleSort('status')} cursor="pointer" whiteSpace="nowrap">
                    Estado {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </Th>
                  <Th onClick={() => handleSort('slaBreached')} cursor="pointer" whiteSpace="nowrap">
                    SLA {sortConfig.key === 'slaBreached' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </Th>
                  <Th onClick={() => handleSort('createdBy')} cursor="pointer" whiteSpace="nowrap">
                    Solicitante {sortConfig.key === 'createdBy' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </Th>
                  <Th onClick={() => handleSort('urgency')} cursor="pointer" whiteSpace="nowrap">
                    Urgencia {sortConfig.key === 'urgency' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </Th>
                  <Th onClick={() => handleSort('assignedTo')} cursor="pointer" whiteSpace="nowrap">
                    Asignado {sortConfig.key === 'assignedTo' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </Th>
                  <Th onClick={() => handleSort('createdAt')} cursor="pointer" whiteSpace="nowrap">
                    Abierto {sortConfig.key === 'createdAt' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </Th>
                  <Th onClick={() => handleSort('lastResolution')} cursor="pointer" whiteSpace="nowrap">
                    Última Resolución {sortConfig.key === 'lastResolution' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredTickets.map(ticket => (
                  <Tr
                    key={ticket._id}
                    onClick={() => openTicket(ticket._id)}
                    cursor="pointer"
                    _hover={{ bg: 'grayLight' }}
                  >
                    <Td whiteSpace="nowrap">{ticket.ticketId || 'Sin ID'}</Td>
                    <Td whiteSpace="nowrap" maxW={{ base: '150px', md: 'auto' }} isTruncated>{ticket.title}</Td>
                    <Td whiteSpace="nowrap">{ticket.status}</Td>
                    <Td whiteSpace="nowrap" color={ticket.slaBreached ? 'slaBreached' : 'slaCompliant'}>
                      {ticket.slaBreached ? 'Incumplido' : 'Cumplido'}
                    </Td>
                    <Td whiteSpace="nowrap" maxW={{ base: '100px', md: 'auto' }} isTruncated>{ticket.createdBy?.name || 'Desconocido'}</Td>
                    <Td whiteSpace="nowrap">{ticket.urgency}</Td>
                    <Td whiteSpace="nowrap" maxW={{ base: '100px', md: 'auto' }} isTruncated>{ticket.assignedTo?.name || 'Sin asignar'}</Td>
                    <Td whiteSpace="nowrap">{new Date(ticket.createdAt).toLocaleDateString()}</Td>
                    <Td whiteSpace="nowrap" maxW={{ base: '150px', md: 'auto' }} isTruncated>
                      {ticket.worklog?.length > 0 ? ticket.worklog[ticket.worklog.length - 1].solution || 'N/A' : 'N/A'}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
          <HStack justify="center" mt={4} spacing={4}>
            <Button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              isDisabled={pagination.currentPage === 1 || filters.createdByMe}
              bg="grayMedium"
              color="white"
              _hover={{ bg: '#6f7376' }}
              size={{ base: 'sm', md: 'md' }}
            >
              Anterior
            </Button>
            <Text color="primary" fontSize={{ base: 'sm', md: 'md' }}>
              Página {pagination.currentPage} de {pagination.totalPages}
            </Text>
            <Button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              isDisabled={pagination.currentPage === pagination.totalPages || filters.createdByMe}
              bg="grayMedium"
              color="white"
              _hover={{ bg: '#6f7376' }}
              size={{ base: 'sm', md: 'md' }}
            >
              Siguiente
            </Button>
          </HStack>
        </>
      )}
      {(selectedTicket || isCreating) && (
        <TicketModal ticket={selectedTicket} onSave={handleSave} onClose={closeTicket} services={services} isCreating={isCreating} user={user} />
      )}
    </Box>
  );
};

export default TicketCenter;