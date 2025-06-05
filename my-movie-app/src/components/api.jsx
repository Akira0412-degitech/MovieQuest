import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // バックエンドのポートに合わせる
});

export default api;
