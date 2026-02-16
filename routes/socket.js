/*
 * Serve content over a socket
 */

var _ = require('lodash');
var jsonfile = require('jsonfile');
var crypto = require('crypto');

// Store game sessions: { sessionId: { gameData: {...}, clients: [] } }
var gameSessions = {};

// Generate a unique session ID
function generateSessionId() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

module.exports = function (io) {
  return function (socket) {
    var currentSessionId = null;
    
    // Create a new game session
    socket.on('session:create', function (callback) {
      var sessionId = generateSessionId();
      gameSessions[sessionId] = {
        gameData: null,
        clients: []
      };
      console.log('session:create ' + sessionId);
      if (typeof callback === 'function') {
        callback({ sessionId: sessionId });
      }
    });
    
    // Join an existing game session
    socket.on('session:join', function (data) {
      var sessionId = data.sessionId;
      console.log('session:join ' + sessionId + ' by socket ' + socket.id);
      
      if (!gameSessions[sessionId]) {
        // Create session if it doesn't exist
        gameSessions[sessionId] = {
          gameData: null,
          clients: []
        };
      }
      
      // Leave any previous session
      if (currentSessionId) {
        socket.leave(currentSessionId);
        var prevSession = gameSessions[currentSessionId];
        if (prevSession) {
          prevSession.clients = prevSession.clients.filter(function(id) { return id !== socket.id; });
        }
      }
      
      // Join the new session
      currentSessionId = sessionId;
      socket.join(sessionId);
      gameSessions[sessionId].clients.push(socket.id);
      
      // Send current game state if it exists
      if (gameSessions[sessionId].gameData) {
        socket.emit('game:state', gameSessions[sessionId].gameData);
      }
    });
    
    socket.on('game:start', function (data) {
      if (!currentSessionId) {
        console.log('game:start called without session');
        return;
      }
      
      console.log('game:start ' + data.data.id + ' in session ' + currentSessionId);
      data.game.round = 'J';
      gameSessions[currentSessionId].gameData = data;
      io.to(currentSessionId).emit('round:start', data);
    });

    socket.on('round:end', function (data) {
      if (!currentSessionId) {
        console.log('round:end called without session');
        return;
      }
      
      console.log('round:end ' + data.round + ' in session ' + currentSessionId);
      if (data.round === 'J') {
        data.round = 'DJ';
        
        // Initialize player scores if they don't exist
        var players = ['player_1', 'player_2', 'player_3', 'player_4', 'player_5', 'player_6'];
        players.forEach(function(player) {
          if (!data[player] || data[player].score === undefined) {
            data[player] = data[player] || {};
            data[player].score = 0;
          }
        });
        
        //figure out who has control
        var lowest_score = Math.min(
          data.player_1.score,
          data.player_2.score,
          data.player_3.score,
          data.player_4.score,
          data.player_5.score,
          data.player_6.score
        );
        
        if(lowest_score == data.player_1.score)
        {
        	data.control_player = 'player_1';
        }
        else if(lowest_score == data.player_2.score)
        {
        	data.control_player = 'player_2';
        }
        else if(lowest_score == data.player_3.score)
        {
        	data.control_player = 'player_3';
        }
        else if(lowest_score == data.player_4.score)
        {
        	data.control_player = 'player_4';
        }
        else if(lowest_score == data.player_5.score)
        {
        	data.control_player = 'player_5';
        }
        else
        {
        	data.control_player = 'player_6';
        }
      }
      else if (data.round === 'DJ') {
        data.round = 'FJ';
        data.control_player = undefined;
      }
      else if (data.round === 'FJ') {
        data.round = 'end';

        var session = gameSessions[currentSessionId];
        if (session && session.gameData) {
          var gameId = session.gameData.data.id;
          var file = 'games/' + gameId + '-' + new Date().getTime() + '.json';
          jsonfile.writeFile(file, data, { spaces: 2 }, function(err) {
            if (err) console.error('Error writing game file:', err);
          });
        }
      }
      
      if (gameSessions[currentSessionId]) {
        gameSessions[currentSessionId].gameData.game = data;
        io.to(currentSessionId).emit('round:start', gameSessions[currentSessionId].gameData);
      }
    })

    socket.on('board:init', function () {
      if (!currentSessionId) {
        console.log('board:init called without session');
        return;
      }
      
      console.log('board:init in session ' + currentSessionId);
      if (gameSessions[currentSessionId]) {
        socket.emit('board:init', gameSessions[currentSessionId].gameData);
      }
    });

    socket.on('game:init', function (data) {
      if (!currentSessionId) {
        console.log('game:init called without session');
        return;
      }
      
      console.log('game:init ' + data + ' in session ' + currentSessionId);
      if (gameSessions[currentSessionId]) {
        socket.emit('game:init', gameSessions[currentSessionId].gameData);
      }
    });

    socket.on('clue:start', function (data) {
      if (!currentSessionId) {
        console.log('clue:start called without session');
        return;
      }
      
      console.log('clue:start ' + data + ' in session ' + currentSessionId);
      socket.to(currentSessionId).emit('clue:start', data);
    });

    socket.on('clue:daily', function (data) {
      if (!currentSessionId) {
        console.log('clue:daily called without session');
        return;
      }
      
      console.log('clue:daily in session ' + currentSessionId);
      socket.to(currentSessionId).emit('clue:daily', data);
    });

    socket.on('clue:end', function (data) {
      if (!currentSessionId) {
        console.log('clue:end called without session');
        return;
      }
      
      console.log('clue:end in session ' + currentSessionId);
      if (gameSessions[currentSessionId]) {
        gameSessions[currentSessionId].gameData.game = data;
      }
      socket.to(currentSessionId).emit('clue:end', data);
    });
    
    // Handle disconnection
    socket.on('disconnect', function () {
      console.log('socket disconnected: ' + socket.id);
      if (currentSessionId && gameSessions[currentSessionId]) {
        gameSessions[currentSessionId].clients = gameSessions[currentSessionId].clients.filter(function(id) { 
          return id !== socket.id; 
        });
      }
    });
  };
};
