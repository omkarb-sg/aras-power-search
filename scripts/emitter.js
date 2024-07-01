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

`
// ==UserScript==
// @name        aras-power-search emitter
// @namespace   aras-power-tools
// @match       *://*/*/Client/*
// @grant       none
// @version     1.0
// @author      Tushar KUNTAWAR
// @require     https://cdn.socket.io/4.0.0/socket.io.min.js
// ==/UserScript==

(function() {
  'use strict';
  if (window !== window.top || !window.top.aras) {
    return
  }
  const socket = io('http://localhost:3000');

  eval(localStorage.getItem("_aras_power_search_code") || \`top.aras.getNotifyByContext(window)('Nothing in LS', { type: 'error' })\`) ;
    socket.on('file-changed', (data) => {
      aras.AlertSuccess("Reloading");
      localStorage.setItem("_aras_power_search_code", data);
      window.location.reload();
    });

    console.log('Violentmonkey script running and listening for file changes...');
})();
`





