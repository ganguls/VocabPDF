import axios from 'axios';

const BASE_URL = '/api/ai';

export const processText = async (text) => {
  const response = await axios.post(`${BASE_URL}/process`, { text });
  return response.data;
};
