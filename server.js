const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { Chess } = require('chess.js');
const port = process.env.PORT || 3000;

app.use(express.static('public'));
let rooms = {};

io.on('connection', (socket) => {
  socket.on('createRoom', () => {
    const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    rooms[roomId] = { game: new Chess(), players: { white: socket.id, black: null } };
    socket.join(roomId);
    socket.emit('roomCreated', roomId);
    socket.emit('playerColor', 'white');
  });

  socket.on('joinRoom', (roomId) => {
    const room = rooms[roomId];
    if (room &&!room.players.black) {
      room.players.black = socket.id;
      socket.join(roomId);
      socket.emit('playerColor', 'black');
      io.to(roomId).emit('startGame');
      io.to(roomId).emit('updateBoard', room.game.fen());
    } else {
      socket.emit('roomError', 'Room full or not found');
    }
  });

  socket.on('move', ({ roomId, from, to }) => {
    const room = rooms[roomId];
    if (!room) return;
    const move = room.game.move({ from, to, promotion: 'q' });
    if (move) {
      io.to(roomId).emit('updateBoard', room.game.fen());
      if (room.game.game_over()) {
        let result = 'Draw';
        if (room.game.in_checkmate()) {
          result = room.game.turn() === 'w'? 'Black a chak!' : 'White a chak!';
        }
        io.to(roomId).emit('gameOver', result);
      }
    }
  });
});

http.listen(port, () => console.log('Server running on ' + port));
