const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Your Next.js app URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle insurance claim events
  socket.on('insurance_claim_submission', (data) => {
    console.log('Insurance claim submitted:', data);
    // Broadcast to all connected clients
    io.emit('insurance_claim_response', {
      type: 'claim_processed',
      message: 'Insurance claim has been processed',
      timestamp: new Date().toISOString(),
      data: data
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
