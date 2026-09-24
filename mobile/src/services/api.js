import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

console.log('[API Init] Target Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // If uploading FormData, delete explicit Content-Type to let Axios / browser / React Native
      // compute the correct multipart boundary automatically
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
    } catch (error) {
      console.error('Error fetching token from storage:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unpack data and handle errors gracefully
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = error.response?.data?.message;
    
    if (!message) {
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        message = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else {
        message = error.message || 'Something went wrong. Please check your connection and try again.';
      }
    }
    const customErr = new Error(message);
    customErr.response = error.response;
    customErr.status = error.response?.status;
    customErr.code = error.code;
    return Promise.reject(customErr);
  }
);

export default api;
