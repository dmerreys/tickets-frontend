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
  });
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' }); // Orden por defecto: más nuevo a más antiguo

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const ticketsEndpoint = filters.createdByMe
          ? '/tickets/my-tickets'
          : `/tickets?page=${pagination.currentPage}&limit=10`;

        console.log('Solicitando tickets desde:', ticketsEndpoint);
        const ticketsResponse = await api.get(ticketsEndpoint);
        console.log('Respuesta completa de tickets:', ticketsResponse.data);

        const ticketsData = filters.createdByMe ? ticketsResponse.data : ticketsResponse.data.tickets || [];
        console.log('Tickets procesados:', ticketsData);

        setTickets(ticketsData);
        setFilteredTickets(ticketsData);

        try {
          const servicesResponse = await api.get('/services');
          console.log('Servicios cargados:', servicesResponse.data);
          setServices(servicesResponse.data || []);
        } catch (serviceErr) {
          console.error('Error al cargar servicios en TicketCenter:', serviceErr.response?.status, serviceErr.response?.data || serviceErr.message);
          setServices([]);
        }

        if (!filters.createdByMe) {
          setPagination({
            currentPage: ticketsResponse.data.currentPage || 1,
            totalPages: ticketsResponse.data.totalPages || 1,
            totalTickets: ticketsResponse.data.totalTickets || ticketsData.length,
          });
        } else {
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalTickets: ticketsData.length,
          });
        }
      } catch (err) {
        console.error('Error al cargar tickets:', err.response?.status, err.response?.data || err.message);
        setTickets([]);
        setFilteredTickets([]);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [pagination.currentPage, filters.createdByMe]);

  useEffect(() => {
    let result = [...tickets];
    if (filters.status) {
      console.log('Filtrando por estado:', filters.status);
      result = result.filter(t => t.status === filters.status);
    }
    if (filters.urgency) {
      console.log('Filtrando por urgencia:', filters.urgency);
      result = result.filter(t => t.urgency === filters.urgency);
    }
    if (filters.assignedTo) {
      console.log('Filtrando por asignado:', filters.assignedTo);
      result = result.filter(t => (filters.assignedTo === 'unassigned' ? !t.assignedTo : t.assignedTo?.name === filters.assignedTo));
    }
    if (!filters.showClosed) {
      console.log('Excluyendo tickets cerrados');
      result = result.filter(t => t.status !== 'cerrado');
    }

    // Aplicar ordenamiento
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Manejar casos especiales para objetos anidados y fechas
        if (sortConfig.key === 'createdBy') {
          aValue = a.createdBy?.name || 'Desconocido';
          bValue = b.createdBy?.name || 'Desconocido';
        } else if (sortConfig.key === 'assignedTo') {
          aValue = a.assignedTo?.name || 'Sin asignar';
          bValue = b.assignedTo?.name || 'Sin asignar';
        } else if (sortConfig.key === 'createdAt') {
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
        } else if (sortConfig.key === 'lastResolution') {
          aValue = a.worklog?.length > 0 ? a.worklog[a.worklog.length - 1].solution || 'N/A' : 'N/A';
          bValue = b.worklog?.length > 0 ? b.worklog[b.worklog.length - 1].solution || 'N/A' : 'N/A';
        } else if (sortConfig.key === 'slaBreached') {
          aValue = a.slaBreached ? 'Incumplido' : 'Cumplido';
          bValue = b.slaBreached ? 'Incumplido' : 'Cumplido';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredTickets(result);
    console.log('Tickets filtrados y ordenados:', result);
  }, [filters, tickets, sortConfig]);

  const totalTickets = pagination.totalTickets;
  const slaBreached = tickets.filter(t => t.slaBreached).length;
  const slaCompliant = totalTickets - slaBreached;

  const openTicket = async (ticketId) => {
    try {
      console.log('Abriendo ticket con ID:', ticketId);
      const response = await api.get(`/tickets/${ticketId}`);
      console.log('Ticket obtenido:', response.data);
      setSelectedTicket(response.data);
    } catch (err) {
      console.error('Error al abrir ticket:', err.response?.data || err.message);
    }
  };

  const closeTicket = () => {
    setSelectedTicket(null);
    setIsCreating(false);
  };

  const handleSave = async (ticketData) => {
    try {
      if (isCreating) {
        const response = await api.post('/tickets', ticketData);
        setTickets([response.data, ...tickets]); // Agregar al inicio para mantener orden descendente
        setFilteredTickets([response.data, ...filteredTickets]);
        console.log('Ticket creado:', response.data);
      } else {
        const response = await api.put(`/tickets/${ticketData._id}`, ticketData);
        const updatedTickets = tickets.map(t => (t._id === ticketData._id ? response.data : t));
        setTickets(updatedTickets);
        setFilteredTickets(updatedTickets.filter(t =>
          (!filters.status || t.status === filters.status) &&
          (!filters.urgency || t.urgency === filters.urgency) &&
          (!filters.assignedTo || (filters.assignedTo === 'unassigned' ? !t.assignedTo : t.assignedTo?.name === filters.assignedTo)) &&
          (filters.showClosed || t.status !== 'cerrado')
        ));
        console.log('Ticket actualizado:', response.data);
      }
      closeTicket();
    } catch (err) {
      const errorMsg = err.response?.data?.msg || err.message;
      console.error('Error al guardar ticket:', errorMsg);
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
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFilters(prev => ({ ...prev, [name]: checked }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const uniqueTechnicians = [...new Set(tickets.map(t => t.assignedTo?.name).filter(Boolean))];

  return (
    <Box p={4} maxW="1200px" mx="auto">
      <Flex justify="space-between" mb={6} flexWrap="wrap" gap={4}>
        <Heading size="md">Tickets Totales: <Text as="span" color="totalTickets">{totalTickets}</Text></Heading>
        <Heading size="md">SLA Incumplidos: <Text as="span" color="slaBreached">{slaBreached}</Text></Heading>
        <Heading size="md">SLA Cumplidos: <Text as="span" color="slaCompliant">{slaCompliant}</Text></Heading>
        <Button bg="secondary" color="white" _hover={{ bg: '#8c7e83' }} onClick={handleNewTicket}>Nuevo Ticket</Button>
      </Flex>
      <VStack spacing={4} align="start" mb={6}>
        <Flex gap={4} flexWrap="wrap">
          <Select name="status" value={filters.status} onChange={handleFilterChange} bg="grayLight" w="200px">
            <option value="">Todos los Estados</option>
            <option value="abierto">Abierto</option>
            <option value="en progreso">En Progreso</option>
            <option value="resuelto">Resuelto</option>
            <option value="cerrado">Cerrado</option>
          </Select>
          <Select name="urgency" value={filters.urgency} onChange={handleFilterChange} bg="grayLight" w="200px">
            <option value="">Toda la Urgencia</option>
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Alta">Alta</option>
          </Select>
          <Select name="assignedTo" value={filters.assignedTo} onChange={handleFilterChange} bg="grayLight" w="200px">
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
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th onClick={() => handleSort('ticketId')} cursor="pointer">
                  ID {sortConfig.key === 'ticketId' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </Th>
                <Th onClick={() => handleSort('title')} cursor="pointer">
                  Título {sortConfig.key === 'title' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </Th>
                <Th onClick={() => handleSort('status')} cursor="pointer">
                  Estado {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </Th>
                <Th onClick={() => handleSort('slaBreached')} cursor="pointer">
                  SLA {sortConfig.key === 'slaBreached' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </Th>
                <Th onClick={() => handleSort('createdBy')} cursor="pointer">
                  Solicitante {sortConfig.key === 'createdBy' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </Th>
                <Th onClick={() => handleSort('urgency')} cursor="pointer">
                  Urgencia {sortConfig.key === 'urgency' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </Th>
                <Th onClick={() => handleSort('assignedTo')} cursor="pointer">
                  Asignado {sortConfig.key === 'assignedTo' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </Th>
                <Th onClick={() => handleSort('createdAt')} cursor="pointer">
                  Abierto {sortConfig.key === 'createdAt' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </Th>
                <Th onClick={() => handleSort('lastResolution')} cursor="pointer">
                  Última Resolución {sortConfig.key === 'lastResolution' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredTickets.map(ticket => (
                <Tr
                  key={ticket._id}
                  onDoubleClick={() => openTicket(ticket._id)}
                  cursor="pointer"
                  _hover={{ bg: 'grayLight' }}
                >
                  <Td>{ticket.ticketId || 'Sin ID'}</Td>
                  <Td>{ticket.title}</Td>
                  <Td>{ticket.status}</Td>
                  <Td color={ticket.slaBreached ? 'slaBreached' : 'slaCompliant'}>
                    {ticket.slaBreached ? 'Incumplido' : 'Cumplido'}
                  </Td>
                  <Td>{ticket.createdBy?.name || 'Desconocido'}</Td>
                  <Td>{ticket.urgency}</Td>
                  <Td>{ticket.assignedTo?.name || 'Sin asignar'}</Td>
                  <Td>{new Date(ticket.createdAt).toLocaleDateString()}</Td>
                  <Td>{ticket.worklog?.length > 0 ? ticket.worklog[ticket.worklog.length - 1].solution || 'N/A' : 'N/A'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <HStack justify="center" mt={4}>
            <Button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              isDisabled={pagination.currentPage === 1 || filters.createdByMe}
              bg="grayMedium"
              color="white"
              _hover={{ bg: '#6f7376' }}
            >
              Anterior
            </Button>
            <Text color="primary">Página {pagination.currentPage} de {pagination.totalPages}</Text>
            <Button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              isDisabled={pagination.currentPage === pagination.totalPages || filters.createdByMe}
              bg="grayMedium"
              color="white"
              _hover={{ bg: '#6f7376' }}
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