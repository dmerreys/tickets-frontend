import React, { useEffect, useState } from 'react';
import api from '../services/api';
import TicketModal from '../components/TicketModal';
import { Box, SimpleGrid, Text, Heading, useToast } from '@chakra-ui/react';

const ServiceCatalog = ({ user }) => {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await api.get('/services'); 
        setServices(response.data || []);
      } catch (err) {
        console.error('Error al cargar servicios:', err.response?.data || err.message);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleServiceClick = (service) => {
    setSelectedService({
      service: service._id,
      title: `Solicitud de ${service.name}`,
      description: '',
      email: user?.email || '',
      createdBy: user?._id || '',
      priority: 'media',
      urgency: 'Media',
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

  const handleSave = async (ticketData) => {
    try {
      const response = await api.post('/tickets', ticketData);
      console.log('Ticket creado desde ServiceCatalog:', response.data);
      toast({
        title: 'Ticket creado',
        description: `El ticket ${response.data.ticketId} se ha creado con éxito.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      setSelectedService(null);
    } catch (err) {
      const errorMsg = err.response?.data?.msg || err.message;
      console.error('Error al guardar ticket en ServiceCatalog:', errorMsg);
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

  const handleClose = () => setSelectedService(null);

  return (
    <Box p={4} maxW="1200px" mx="auto">
      <Heading mb={6}>Catálogo de Servicios</Heading>
      {loading ? (
        <Text>Cargando servicios...</Text>
      ) : services.length === 0 ? (
        <Text>No hay servicios disponibles.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {services.map(service => (
            <Box
              key={service._id}
              bg="white"
              p={4}
              borderRadius="md"
              shadow="sm"
              onClick={() => handleServiceClick(service)}
              cursor="pointer"
              _hover={{ bg: 'grayLight' }}
            >
              <Text fontWeight="bold" color="primary">{service.name}</Text>
              <Text color="grayMedium">{service.description}</Text>
              <Text>Categoría: {service.category}</Text>
              <Text>SLA: Respuesta {service.sla.responseTime}h, Resolución {service.sla.resolutionTime}h</Text>
              <Text>Popularidad: {service.popularity}</Text>
            </Box>
          ))}
        </SimpleGrid>
      )}
      {selectedService && (
        <TicketModal
          ticket={selectedService}
          onSave={handleSave}
          onClose={handleClose}
          services={services}
          isCreating={true}
          user={user}
        />
      )}
    </Box>
  );
};

export default ServiceCatalog;