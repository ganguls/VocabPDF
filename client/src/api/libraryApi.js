import axios from 'axios';

const API_URL = '/api/library';

export const getLibrary = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const uploadBook = async (file) => {
  const formData = new FormData();
  formData.append('pdf', file);
  
  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateProgress = async (id, currentPage, totalPages) => {
  const response = await axios.put(`${API_URL}/${id}/progress`, {
    currentPage,
    totalPages,
  });
  return response.data;
};

export const deleteBook = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
