import axios from 'axios';

const BASE_URL = '/api/ai';

export const processText = async (text) => {
  const response = await axios.post(`${BASE_URL}/process`, { text });
  return response.data;
};

export const processImage = async (imageBase64) => {
  const response = await axios.post(`${BASE_URL}/process-image`, { imageBase64 });
  return response.data;
};

export const explainWord = async (word) => {
  const response = await axios.post(`${BASE_URL}/explain`, { word });
  return response.data;
};
