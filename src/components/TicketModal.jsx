import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  Select,
  Textarea,
  Button,
  VStack,
  Text,
  Heading,
  Flex,
  IconButton,
  CloseButton,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';

const TicketModal = ({ ticket, onSave, onClose, services, isCreating, user }) => {
  const [formData, setFormData] = useState({
    ...ticket,
    createdBy: ticket.createdBy || user?._id || '',
    email: ticket.email || user?.email || '',
    relatedTickets: ticket.relatedTickets || [],
  });
  const [activeTab, setActiveTab] = useState(0);
  const [worklog, setWorklog] = useState({ type: '', timeSpent: '', workDate: '', contact: '', solution: '', cause: '', resolution: '' });
  const [relatedTicketId, setRelatedTicketId] = useState('');
  const [relatedTicketsDetails, setRelatedTicketsDetails] = useState([]);
  const [error, setError] = useState(null);
  const [creatorName, setCreatorName] = useState(user?.name || 'Desconocido'); // Nombre del creador

  useEffect(() => {
    const fetchCreatorName = async () => {
      if (!isCreating && ticket.createdBy && typeof ticket.createdBy === 'object' && ticket.createdBy._id) {
        setCreatorName(ticket.createdBy.name || 'Desconocido');
      } else if (!isCreating && ticket.createdBy) {
        try {
          const response = await api.get(`/users/${ticket.createdBy}`);
          setCreatorName(response.data.name || 'Desconocido');
        } catch (err) {
          console.error('Error al obtener el nombre del creador:', err);
          setCreatorName('Desconocido');
        }
      } else {
        setCreatorName(user?.name || 'Desconocido');
      }
    };

    fetchCreatorName();

    if (isCreating) {
      setFormData({
        title: ticket.title || '',
        description: '',
        service: ticket.service || '',
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
    } else {
      setFormData({
        ...ticket,
        createdBy: ticket.createdBy?._id || ticket.createdBy || user?._id || '',
        email: ticket.email || user?.email || '',
        relatedTickets: ticket.relatedTickets || [],
      });
      fetchRelatedTickets(ticket.relatedTickets || []);
    }
  }, [isCreating, user, ticket]);

  const fetchRelatedTickets = async (ticketIds) => {
    try {
      const details = await Promise.all(
        ticketIds.map(id =>
          api.get(`/tickets/${id}`).then(res => res.data).catch(err => {
            console.error(`Error al obtener ticket ${id}:`, err.response?.status, err.response?.data);
            return null;
          })
        )
      );
      const validDetails = details.filter(detail => detail !== null);
      setRelatedTicketsDetails(validDetails);
    } catch (err) {
      console.error('Error general al cargar tickets relacionados:', err);
      setRelatedTicketsDetails([]);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleWorklogChange = (e) => setWorklog({ ...worklog, [e.target.name]: e.target.value });
  const handleRelatedTicketChange = (e) => setRelatedTicketId(e.target.value);

  const addRelatedTicket = () => {
    if (relatedTicketId && !formData.relatedTickets.includes(relatedTicketId)) {
      const updatedRelatedTickets = [...formData.relatedTickets, relatedTicketId];
      setFormData(prev => ({ ...prev, relatedTickets: updatedRelatedTickets }));
      fetchRelatedTickets(updatedRelatedTickets);
      setRelatedTicketId('');
      console.log('Ticket relacionado añadido:', relatedTicketId);
    }
  };

  const removeRelatedTicket = (ticketId) => {
    const updatedRelatedTickets = formData.relatedTickets.filter(id => id !== ticketId);
    setFormData(prev => ({ ...prev, relatedTickets: updatedRelatedTickets }));
    setRelatedTicketsDetails(prev => prev.filter(t => t._id !== ticketId));
    console.log('Ticket relacionado eliminado:', ticketId);
  };

  const handleSave = async () => {
    console.log('Guardando ticket con datos:', formData);
    setError(null);
    try {
      if (isCreating) {
        await onSave(formData);
      } else if (activeTab === 1 && worklog.type) {
        const response = await api.post(`/tickets/${formData._id}/worklog`, worklog);
        onSave(response.data);
        setWorklog({ type: '', timeSpent: '', workDate: '', contact: '', solution: '', cause: '', resolution: '' });
      } else {
        await onSave(formData);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.msg || err.message;
      console.error('Error al guardar ticket:', errorMsg);
      setError(errorMsg);
    }
  };

  const handleOutsideClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      w="100vw"
      h="100vh"
      bg="rgba(0,0,0,0.5)"
      zIndex={1000}
      display="flex"
      justifyContent="center"
      alignItems="center"
      onClick={handleOutsideClick}
    >
      <Box bg="white" p={6} borderRadius="md" maxW={{ base: '90%', md: '600px' }} maxH="80vh" overflowY="auto" position="relative">
        <IconButton
          aria-label="Cerrar modal"
          icon={<CloseButton />}
          size="sm"
          position="absolute"
          top={2}
          right={2}
          onClick={onClose}
        />
        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            {error}
          </Alert>
        )}
        <Tabs index={activeTab} onChange={(index) => setActiveTab(index)}>
          <TabList>
            <Tab>Detalles</Tab>
            {!isCreating && <Tab>Registro de Trabajo</Tab>}
          </TabList>
          <TabPanels>
            <TabPanel>
              <VStack spacing={4}>
                <Heading size="md">Información del Solicitante</Heading>
                <Text fontWeight="bold">Nombre del Solicitante</Text>
                <Text>{creatorName}</Text>
                <Text fontWeight="bold">Teléfono</Text>
                <Input name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="Teléfono" bg="grayLight" />
                <Text fontWeight="bold">Correo Electrónico</Text>
                <Input name="email" value={formData.email || ''} onChange={handleChange} placeholder="Correo" bg="grayLight" isDisabled={isCreating} />
                <Text fontWeight="bold">Organización</Text>
                <Input name="organization" value={formData.organization || ''} onChange={handleChange} placeholder="Organización" bg="grayLight" />

                <Heading size="md">Detalles del Ticket</Heading>
                <Text fontWeight="bold">ID del Ticket</Text>
                <Text>{formData.ticketId || 'Se generará al guardar'}</Text>
                <Text fontWeight="bold">Título</Text>
                <Input name="title" value={formData.title || ''} onChange={handleChange} placeholder="Título" bg="grayLight" />
                <Text fontWeight="bold">Descripción</Text>
                <Textarea name="description" value={formData.description || ''} onChange={handleChange} placeholder="Descripción" bg="grayLight" />
                <Text fontWeight="bold">Servicio</Text>
                <Select name="service" value={formData.service || ''} onChange={handleChange} bg="grayLight" disabled={!isCreating}>
                  <option value="">Seleccionar Servicio</option>
                  {services.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </Select>
                <Text fontWeight="bold">Impacto</Text>
                <Select name="impact" value={formData.impact || ''} onChange={handleChange} bg="grayLight">
                  <option value="">Seleccionar Impacto</option>
                  <option value="Bajo">Bajo</option>
                  <option value="Medio">Medio</option>
                  <option value="Alto">Alto</option>
                </Select>
                <Text fontWeight="bold">Urgencia</Text>
                <Select name="urgency" value={formData.urgency || ''} onChange={handleChange} bg="grayLight">
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </Select>
                <Text fontWeight="bold">Prioridad</Text>
                <Select name="priority" value={formData.priority || ''} onChange={handleChange} bg="grayLight">
                  <option value="">Seleccionar Prioridad</option>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </Select>
                <Text fontWeight="bold">Severidad</Text>
                <Input name="severity" value={formData.severity || ''} onChange={handleChange} placeholder="Severidad" bg="grayLight" />
                <Text fontWeight="bold">Información Adicional</Text>
                <Input name="additionalInfo" value={formData.additionalInfo || ''} onChange={handleChange} placeholder="Info Adicional" bg="grayLight" />
                <Text fontWeight="bold">Contacto</Text>
                <Input name="contact" value={formData.contact || ''} onChange={handleChange} placeholder="Contacto" bg="grayLight" />
                <Text fontWeight="bold">TeamViewer/Contraseña</Text>
                <Input name="teamviewer" value={formData.teamviewer || ''} onChange={handleChange} placeholder="TeamViewer/Contraseña" bg="grayLight" />
                <Text fontWeight="bold">Proveedor</Text>
                <Input name="provider" value={formData.provider || ''} onChange={handleChange} placeholder="Proveedor" bg="grayLight" />
                <Text fontWeight="bold">Sistema en Falla</Text>
                <Input name="system" value={formData.system || ''} onChange={handleChange} placeholder="Sistema en Falla" bg="grayLight" />
                <Text fontWeight="bold">Código de Cierre</Text>
                <Input name="closeCode" value={formData.closeCode || ''} onChange={handleChange} placeholder="Código de Cierre" bg="grayLight" />
                <Text fontWeight="bold">Estado</Text>
                <Text>{formData.status || 'En cola'}</Text>
                <Text fontWeight="bold">Asignado a</Text>
                <Text>{formData.assignedTo?.name || 'Sin asignar'}</Text>
                <Text fontWeight="bold">Fecha de Creación</Text>
                <Text>{formData.createdAt ? new Date(formData.createdAt).toLocaleString() : 'N/A'}</Text>
                <Text fontWeight="bold">Última Actualización</Text>
                <Text>{formData.updatedAt ? new Date(formData.updatedAt).toLocaleString() : 'N/A'}</Text>

                <Heading size="md">Tickets Relacionados</Heading>
                <Text fontWeight="bold">Agregar Ticket Relacionado</Text>
                <Flex gap={2}>
                  <Input
                    value={relatedTicketId}
                    onChange={handleRelatedTicketChange}
                    placeholder="ID del Ticket Relacionado (ej. 67ccc6d6ceb5e7601a9b8e79)"
                    bg="grayLight"
                  />
                  <Button onClick={addRelatedTicket} bg="secondary" color="white" _hover={{ bg: '#8c7e83' }}>
                    Agregar
                  </Button>
                </Flex>
                <Box w="100%">
                  <Text fontWeight="bold" mb={2}>Tickets Relacionados:</Text>
                  {relatedTicketsDetails.length > 0 ? (
                    relatedTicketsDetails.map((ticket, index) => (
                      <Flex key={index} justify="space-between" align="center" mb={1}>
                        <Text>{ticket.ticketId} - {ticket.title}</Text>
                        <Button size="sm" colorScheme="red" onClick={() => removeRelatedTicket(ticket._id)}>
                          Eliminar
                        </Button>
                      </Flex>
                    ))
                  ) : (
                    <Text color="gray.500">No hay tickets relacionados.</Text>
                  )}
                </Box>
              </VStack>
            </TabPanel>
            {!isCreating && (
              <TabPanel>
                <VStack spacing={4}>
                  <Heading size="md">Nuevo Registro de Trabajo</Heading>
                  <Text fontWeight="bold">Tipo de Registro</Text>
                  <Select name="type" value={worklog.type} onChange={handleWorklogChange} bg="grayLight">
                    <option value="">Seleccionar Tipo</option>
                    <option value="Resuelto">Resuelto</option>
                    <option value="Trabajo">Trabajo</option>
                    <option value="Primer Contacto">Primer Contacto</option>
                    <option value="Nota del Cliente">Nota del Cliente</option>
                    <option value="Actualizar">Actualizar</option>
                  </Select>
                  <Text fontWeight="bold">Tiempo Invertido</Text>
                  <Input name="timeSpent" value={worklog.timeSpent} onChange={handleWorklogChange} placeholder="Tiempo Invertido (min)" bg="grayLight" />
                  <Text fontWeight="bold">Fecha de Trabajo</Text>
                  <Input name="workDate" type="date" value={worklog.workDate} onChange={handleWorklogChange} bg="grayLight" />
                  <Text fontWeight="bold">Contacto</Text>
                  <Input name="contact" value={worklog.contact} onChange={handleWorklogChange} placeholder="Contacto" bg="grayLight" />
                  <Text fontWeight="bold">Solución</Text>
                  <Textarea name="solution" value={worklog.solution} onChange={handleWorklogChange} placeholder="Solución" bg="grayLight" />
                  <Text fontWeight="bold">Causa</Text>
                  <Textarea name="cause" value={worklog.cause} onChange={handleWorklogChange} placeholder="Causa" bg="grayLight" />
                  <Text fontWeight="bold">Resolución</Text>
                  <Textarea name="resolution" value={worklog.resolution} onChange={handleWorklogChange} placeholder="Resolución" bg="grayLight" />
                  {formData.worklog && formData.worklog.length > 0 && (
                    <Box w="100%">
                      <Heading size="sm" mb={2}>Registros Anteriores</Heading>
                      {formData.worklog.map((log, index) => (
                        <Box key={index} p={2} borderWidth={1} borderRadius="md" mb={2}>
                          <Text>Tipo: {log.type} | Tiempo: {log.timeSpent} min | Fecha: {new Date(log.workDate).toLocaleString()}</Text>
                          <Text>Solución: {log.solution || 'N/A'}</Text>
                          <Text>Causa: {log.cause || 'N/A'}</Text>
                          <Text>Resolución: {log.resolution || 'N/A'}</Text>
                        </Box>
                      ))}
                    </Box>
                  )}
                </VStack>
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
        <Flex justify="space-between" mt={4}>
          <Button bg="primary" color="white" _hover={{ bg: '#4e4148' }} onClick={handleSave}>Guardar</Button>
          <Button bg="grayMedium" color="white" _hover={{ bg: '#6f7376' }} onClick={onClose}>Cerrar</Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default TicketModal;