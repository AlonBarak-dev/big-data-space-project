const io = require('socket.io-client');

// Socket.IO setup
const socket = io('http://localhost:8080');

socket.on('connect', () => {
  console.log('Connected to the first server.');
});

socket.on('new-message', (message) => {
  console.log('Received new message from Kafka:', message);
});

socket.on('disconnect', () => {
  console.log('Disconnected from the first server.');
});