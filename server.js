const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const players = {};

io.on('connection', (socket) => {
    socket.on('createRoom', (roomCode) => {
        socket.join(roomCode);
        players[socket.id] = { room: roomCode, x: 0, y: 0, z: 0, rotY: 0 };
        socket.emit('roomCreated', roomCode);
    });

    socket.on('joinRoom', (roomCode) => {
        if (io.sockets.adapter.rooms.get(roomCode)) {
            socket.join(roomCode);
            players[socket.id] = { room: roomCode, x: 0, y: 0, z: 0, rotY: 0 };
            socket.to(roomCode).emit('playerJoined', socket.id);
            socket.emit('roomJoined', roomCode);
        } else {
            socket.emit('errorMsg', 'Комната не найдена');
        }
    });

    socket.on('updatePos', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].z = data.z;
            players[socket.id].rotY = data.rotY;
            socket.to(players[socket.id].room).emit('playerMoved', { id: socket.id, ...data });
        }
    });

    socket.on('disconnect', () => {
        if (players[socket.id]) {
            socket.to(players[socket.id].room).emit('playerLeft', socket.id);
            delete players[socket.id];
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server on port ${PORT}`));
