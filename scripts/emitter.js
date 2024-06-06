const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }

});
const filePath = path.join(__dirname, '../output/compiled.js');

// Watch for changes in the file
console.log("Watching...")
fs.watch(filePath, (eventType, filename) => {
  console.log("Some file changed");
  if (filename && eventType === 'change') {
    
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        return;
      }
      io.emit('file-changed', data);
    });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }
    io.emit('file-changed', data);
  });
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});

