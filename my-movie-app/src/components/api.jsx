import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:3000', // バックエンドのポートに合わせる
});

export default api;
