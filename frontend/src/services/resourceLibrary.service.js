import api, { apiForm } from './api';

const withRole = (role) => ({ headers: { 'x-rl-role': role || 'student' } });

/** Backend requires this header to save collaborative note content (attribution). */
const withRlUserName = (userName) => ({
  headers: { 'x-rl-user-name': String(userName || 'Student').trim() || 'Student' },
});

const resourceLibraryService = {
  getNotifications: () => api.get('/resource-library/notifications').then((r) => r.data),
  markNotificationRead: (id) => api.post(`/resource-library/notifications/${id}/read`).then((r) => r.data),
  markAllNotificationsRead: () => api.post('/resource-library/notifications/read-all').then((r) => r.data),
  getOverview: () => api.get('/resource-library/overview').then((r) => r.data),
  getTopQualityResources: () => api.get('/resource-library/top-quality').then((r) => r.data),
  getTopContributors: () => api.get('/resource-library/top-contributors').then((r) => r.data),
  getProgrammes: () => api.get('/resource-library/programmes').then((r) => r.data),
  createProgramme: (payload, role) => api.post('/resource-library/programmes', payload, withRole(role)).then((r) => r.data),
  updateProgramme: (id, payload, role) => api.put(`/resource-library/programmes/${id}`, payload, withRole(role)).then((r) => r.data),
  deleteProgramme: (id, role) => api.delete(`/resource-library/programmes/${id}`, withRole(role)).then((r) => r.data),
  getModules: (programmeId) => api.get('/resource-library/modules', { params: { programmeId } }).then((r) => r.data),
  createModule: (formData, role) =>
    apiForm.post('/resource-library/modules', formData, withRole(role)).then((r) => r.data),
  updateModule: (id, formData, role) =>
    apiForm.put(`/resource-library/modules/${id}`, formData, withRole(role)).then((r) => r.data),
  deleteModule: (id, role) => api.delete(`/resource-library/modules/${id}`, withRole(role)).then((r) => r.data),
  getResources: (params = {}) => api.get('/resource-library/resources', { params }).then((r) => r.data),
  uploadResource: (formData, role) =>
    apiForm.post('/resource-library/resources/upload', formData, withRole(role)).then((r) => r.data),
  getResourceById: (id, params = {}) => api.get(`/resource-library/resources/${id}`, { params }).then((r) => r.data),
  getResourceContent: (id) => api.get(`/resource-library/resources/${id}/content`).then((r) => r.data),
  updateResourceContent: (id, payload, userName) =>
    api.put(`/resource-library/resources/${id}/content`, payload, withRlUserName(userName)).then((r) => r.data),
  generateFlashcards: (payload) => api.post('/resource-library/flashcards/generate', payload).then((r) => r.data),
  updateResource: (id, payload, role) => api.put(`/resource-library/resources/${id}`, payload, withRole(role)).then((r) => r.data),
  replaceResourceAttachment: (id, formData, role) =>
    apiForm.put(`/resource-library/resources/${id}/attachment`, formData, withRole(role)).then((r) => r.data),
  deleteResource: (id, role) => api.delete(`/resource-library/resources/${id}`, withRole(role)).then((r) => r.data),
  recordView: (id) => api.post(`/resource-library/resources/${id}/view`).then((r) => r.data),
  recordDownload: (id) => api.post(`/resource-library/resources/${id}/download`).then((r) => r.data),
  submitRating: (id, payload) => api.post(`/resource-library/resources/${id}/rating`, payload).then((r) => r.data),
  addComment: (id, payload) => api.post(`/resource-library/resources/${id}/comments`, payload).then((r) => r.data),
  getRequests: (params = {}) => api.get('/resource-library/requests', { params }).then((r) => r.data),
  getRequestById: (id) => api.get(`/resource-library/requests/${id}`).then((r) => r.data),
  createRequest: (formData) => apiForm.post('/resource-library/requests', formData).then((r) => r.data),
  updateRequestStatus: (id, payload, role) => api.put(`/resource-library/requests/${id}/status`, payload, withRole(role)).then((r) => r.data),
  getRequestMessages: (id) => api.get(`/resource-library/requests/${id}/messages`).then((r) => r.data),
  addRequestMessage: (id, formData, role) =>
    apiForm.post(`/resource-library/requests/${id}/messages`, formData, withRole(role)).then((r) => r.data),
  updateRequestMessage: (requestId, messageId, payload, role) =>
    api.put(`/resource-library/requests/${requestId}/messages/${messageId}`, payload, withRole(role)).then((r) => r.data),
  deleteRequestMessage: (requestId, messageId, payload, role) =>
    api.delete(`/resource-library/requests/${requestId}/messages/${messageId}`, { data: payload, ...withRole(role) }).then((r) => r.data),
};

export default resourceLibraryService;
