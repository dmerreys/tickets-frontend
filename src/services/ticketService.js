import api from './api';

export const getTickets = () => api.get('/tickets'); // /api/tickets
export const getMyTickets = () => api.get('/tickets/my-tickets'); // /api/tickets/my-tickets
export const getTicketById = (id) => api.get(`/tickets/${id}`); // /api/tickets/:id
export const createTicket = (ticketData) => api.post('/tickets', ticketData); // /api/tickets
export const updateTicket = (id, ticketData) => api.put(`/tickets/${id}`, ticketData); // /api/tickets/:id
export const addWorklog = (id, worklogData) => api.post(`/tickets/${id}/worklog`, worklogData); // /api/tickets/:id/worklog
export const getServices = () => api.get('/tickets/services'); // /api/tickets/services