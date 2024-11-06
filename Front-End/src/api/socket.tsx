// src/socket.js
import { io } from 'socket.io-client';

// Connect to the backend server
const socket = io('http://localhost:9000', {
  withCredentials: true,
  transports: ['websocket'],
});

export default socket;
