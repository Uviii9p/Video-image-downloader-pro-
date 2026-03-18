import axios from 'axios';

const API_BASE = (window.location.protocol === 'file:')
  ? 'http://localhost:4000'
  : '';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeUrl = async (url) => {
  const { data } = await api.post('/api/analyze', { url });
  return data;
};

export const getPlaylist = async (url) => {
  const { data } = await api.post('/api/playlist', { url });
  return data;
};
