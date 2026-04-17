import axios from 'axios';

const BASE_URL = '/api/vocab';

export const getVocab = async () => {
  const response = await axios.get(BASE_URL);
  return response.data;
};

export const checkWords = async (wordList) => {
  const words = wordList.join(',');
  const response = await axios.get(`${BASE_URL}/check`, { params: { words } });
  return response.data;
};

export const saveWords = async (words) => {
  const response = await axios.post(`${BASE_URL}/save`, { words });
  return response.data;
};
