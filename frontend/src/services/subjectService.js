import api from './api';

const API_URL = '/subjects';

const getAllSubjects = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

const getSubjectById = async (id) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

const createSubject = async (subjectData) => {
  const response = await api.post(API_URL, subjectData);
  return response.data;
};

const createModule = async (subjectId, moduleData) => {
  const response = await api.post(`${API_URL}/${subjectId}/modules`, moduleData);
  return response.data;
};

const addStudent = async (subjectId, studentId) => {
  const response = await api.post(`${API_URL}/${subjectId}/students`, { studentId });
  return response.data;
};

const updateSubject = async (id, data) => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};

const deleteSubject = async (id) => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response.data;
};

const updateMaterialPages = async (subjectId, materialId, totalPages) => {
  const response = await api.patch(`${API_URL}/${subjectId}/materials/${materialId}/pages`, { totalPages });
  return response.data;
};

const uploadMaterial = async (subjectId, formData) => {
  const response = await api.post(`${API_URL}/${subjectId}/materials`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export default {
  getAllSubjects,
  getSubjectById,
  createSubject,
  deleteSubject,
  updateSubject,
  createModule,
  addStudent,
  uploadMaterial,
  updateMaterialPages,
};
