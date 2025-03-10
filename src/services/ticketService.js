import api from './api';

export const getTickets = () => api.get('/tickets'); 
export const getMyTickets = () => api.get('/tickets/my-tickets'); 
export const getTicketById = (id) => api.get(`/tickets/${id}`); 
export const createTicket = (ticketData) => api.post('/tickets', ticketData); 
export const updateTicket = (id, ticketData) => api.put(`/tickets/${id}`, ticketData);
export const addWorklog = (id, worklogData) => api.post(`/tickets/${id}/worklog`, worklogData); 
export const getServices = () => api.get('/tickets/services');