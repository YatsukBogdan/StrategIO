var _ = require('underscore');

/*
 * The Game object
 */

/**
 * Create new game and initialize
 */
function Game(params) {

  // pending/ongoing/checkmate/stalemate/forfeit
  this.status = 'pending';

  this.activePlayer = null;
  this.looser_color = null;
  this.players = [
    {color: null, name: null, joined: false, ready: false, inCheck: false, forfeited: false},
    {color: null, name: null, joined: false, ready: false, inCheck: false, forfeited: false}
  ];

  this.board = {
    a8: 'rt', b8: 'r9', c8: 'r8', d8: 'r7', e8: 'r6', f8: 'r6', g8: 'r5', h8: 'r5', i8: 'r4', j8: 'r4',
    a7: 'r3', b7: 'r3', c7: 'r3', d7: 'r3', e7: 'r3', f7: 'r2', g7: 'r2', h7: 'r2', i7: 'r2', j7: 'r2',
    a6: 'ry', b6: 'rs', c6: 'rs', d6: 'rb', e6: 'rb', f6: 'rb', g6: 'rb', h6: 'rb', i6: 'rb', j6: 'rf',
    a5: null,  b5: null,  c5: 'w',  d5: 'w',  e5: null,  f5: null,  g5: 'w',  h5: 'w',  i5: null,  j5: null,
    a4: null,  b4: null,  c4: 'w',  d4: 'w',  e4: null,  f4: null,  g4: 'w',  h4: 'w',  i4: null,  j4: null,
    a3: 'bf', b3: 'bb', c3: 'bb', d3: 'bb', e3: 'bb', f3: 'bb', g3: 'bb', h3: 'bs', i3: 'bs', j3: 'by',
    a2: 'b2', b2: 'b2', c2: 'b2', d2: 'b2', e2: 'b2', f2: 'b3', g2: 'b3', h2: 'b3', i2: 'b3', j2: 'b3',
    a1: 'b4', b1: 'b4', c1: 'b5', d1: 'b5', e1: 'b6', f1: 'b6', g1: 'b7', h1: 'b8', i1: 'b9', j1: 'bt'
  };

  this.capturedPieces = [];


  this.lastMove = null;
  this.validMoves = getMovesForPlayer('red', this.board, this.lastMove, 'strategy');
  this.validMoves.push.apply(this.validMoves, getMovesForPlayer('blue', this.board, this.lastMove, 'strategy'));
  this.modifiedOn = Date.now();

  // Set player colors
  // params.playerColor is the color of the player who created the game
  if (params.playerColor === 'blue') {
    this.players[0].color = 'blue';
    this.players[1].color = 'red';
  }
  else if (params.playerColor === 'red') {
    this.players[0].color = 'red';
    this.players[1].color = 'blue';
  }
}

/**
 * Add player to game, and after both players have joined activate the game.
 * Returns true on success and false on failure.
 */
Game.prototype.addPlayer = function(playerData) {

  // Check for an open spot
  var p = _.findWhere(this.players, {color: playerData.playerColor, joined: false});
  if (!p) { return false; }

  // Set player info
  p.name = playerData.playerName;
  p.joined = true;

  // If both players have joined, start the game
  if (this.players[0].joined && this.players[1].joined && this.status === 'pending') {
    this.activePlayer = _.findWhere(this.players, {color: 'blue'});
    this.status = 'strategy';
  }

  this.modifiedOn = Date.now();

  return true;
};

Game.prototype.playerReady = function(playerData) {

  // Check for an open spot
  var p = _.findWhere(this.players, {color: playerData.playerColor, ready: false});
  if (!p) { return false; }

  // Set player info
  p.ready = true;

  // If both players have joined, start the game
  if (this.players[0].ready && this.players[1].ready && this.status === 'strategy') {
    this.status = 'ongoing';
    this.validMoves = getMovesForPlayer(this.activePlayer.color, this.board, this.lastMove, this.status);
  }

  this.modifiedOn = Date.now();

  return true;
};

/**
 * Remove player from game, this does not end the game, players may come and go as they please.
 * Returns true on success and false on failure.
 */
Game.prototype.removePlayer = function(playerData) {

  // Find player in question
  var p = _.findWhere(this.players, {color: playerData.playerColor});
  if (!p) { return false; }

  // Set player info
  p.joined = false;

  this.modifiedOn = Date.now();

  return true;
};

/**
 * Apply move and regenerate game state.
 * Returns true on success and false on failure.
 */
Game.prototype.move = function(moveString) {
  // Test if move is valid
  var move = parseMoveString(moveString);
  var validMove = _.findWhere(this.validMoves, move);
  if (!validMove && move.type !== 'spotterCapture') { return false; }

  // Apply move
  switch (move.type) {
    case 'move' :
      this.board[move.endSquare] = move.pieceCode;
      this.board[move.startSquare] = null;
      break;

    case 'capture' :
      move.capturePiece = this.board[move.captureSquare];
      if (this.board[move.startSquare][1] === '3' && this.board[move.captureSquare][1] === 'b') {
        this.board[move.captureSquare] = null;
        this.board[move.endSquare] = move.pieceCode;
        this.board[move.startSquare] = null;
      } else if (this.board[move.captureSquare][1] === 'b') {
        this.capturedPieces.push(this.board[move.startSquare]);
        this.capturedPieces.push(this.board[move.captureSquare]);
        this.board[move.startSquare] = null;
        this.board[move.captureSquare] = null;
      } else if (this.board[move.captureSquare][1] === 'f') {
        this.capturedPieces.push(this.board[move.captureSquare]);
        this.board[move.captureSquare] = null;
        this.board[move.endSquare] = move.pieceCode;
        this.board[move.startSquare] = null;
        this.status = 'checkmate';
        this.looser_color = 'blue';
        if (this.board[move.captureSquare][0] === 'r') {
          this.looser_color = 'red'
        }
      } else if (this.board[move.startSquare][1] === 'y' && this.board[move.captureSquare][1] === 't') {
        this.board[move.captureSquare] = null;
        this.board[move.endSquare] = move.pieceCode;
        this.board[move.startSquare] = null;
      } else if (this.board[move.captureSquare][1] === 's' || this.board[move.captureSquare][1] === 'y') {
        this.board[move.captureSquare] = null;
        this.board[move.endSquare] = move.pieceCode;
        this.board[move.startSquare] = null;
      } else if (this.board[move.startSquare][1] === 's' || this.board[move.startSquare][1] === 'y') {
        this.capturedPieces.push(this.board[move.startSquare]);
        this.board[move.startSquare] = null;
      } else if (this.board[move.captureSquare][1] <= this.board[move.startSquare][1]) {
        this.capturedPieces.push(this.board[move.captureSquare]);
        this.board[move.captureSquare] = null;
        this.board[move.endSquare] = move.pieceCode;
        this.board[move.startSquare] = null;
      } else if (this.board[move.captureSquare][1] > this.board[move.startSquare][1]) {
        this.capturedPieces.push(this.board[move.startSquare]);
        this.board[move.startSquare] = null;
      }
      break;
    case 'spotterCapture':
      if (move.capturePiece === move.guessingPiece) {
        this.board[move.captureSquare] = null;
      }
      break;
    case 'swap':
      var tmpSquare = this.board[move.startSquare];
      this.board[move.startSquare] = this.board[move.swapSquare];
      this.board[move.swapSquare] = tmpSquare;
      break;

    default : break;
  };

  // Set this move as last move
  this.lastMove = move;

  // Get inactive player
  var inactivePlayer = _.find(this.players, function(p) {
    return (p === this.activePlayer) ? false : true;
  }, this);

  // Regenerate valid moves
  if (this.status === 'strategy') {
    this.validMoves = getMovesForPlayer('red', this.board, this.lastMove, this.status);
    this.validMoves.push.apply(this.validMoves, getMovesForPlayer('blue', this.board, this.lastMove, this.status));
  } else if (this.status === 'ongoing'){
    this.validMoves = getMovesForPlayer(inactivePlayer.color, this.board, this.lastMove, this.status);
  }


  // Test for checkmate o

  if (this.status === 'strategy') { }
  // Toggle active player
  else if (this.status === 'ongoing') { this.activePlayer = inactivePlayer; }

  this.modifiedOn = Date.now();

  return true;
};

/**
 * Apply a player's forfeit to the game.
 * Returns true on success and false on failure.
 */
Game.prototype.forfeit = function(playerData) {

  // Find player in question
  var p = _.findWhere(this.players, {color: playerData.playerColor});
  if (!p) { return false; }

  // Set player info
  p.forfeited = true;

  // Set game status
  this.status = 'forfeit';

  this.modifiedOn = Date.now();

  return true;
};

/*
 * Private Utility Functions
 */

/**
 * Get all the valid/safe moves a player can make.
 * Returns an array of move objects on success or an empty array on failure.
 */
var getMovesForPlayer = function(playerColor, board, lastMove, status) {
  var moves = [];
  var piece, square = null;

  // Loop board
  for (square in board) {
    piece = board[square];
    // Skip empty squares and opponent's pieces
    if (!piece) { continue; }
    if (piece[0] !== playerColor[0]) { continue; }

    // Collect all moves for all of player's pieces
    switch (piece[1]) {
      case '2': moves.push.apply(moves, getMovesFor2(piece, square, board, status)); break;
      case '3': moves.push.apply(moves, getMovesForRegularElement(piece, square, board, status)); break;
      case '4': moves.push.apply(moves, getMovesForRegularElement(piece, square, board, status)); break;
      case '5': moves.push.apply(moves, getMovesForRegularElement(piece, square, board, status)); break;
      case '6': moves.push.apply(moves, getMovesForRegularElement(piece, square, board, status)); break;
      case '7': moves.push.apply(moves, getMovesForRegularElement(piece, square, board, status)); break;
      case '8': moves.push.apply(moves, getMovesForRegularElement(piece, square, board, status)); break;
      case '9': moves.push.apply(moves, getMovesForRegularElement(piece, square, board, status)); break;
      case 't': moves.push.apply(moves, getMovesForRegularElement(piece, square, board, status)); break;
      case 's': moves.push.apply(moves, getMovesForSpotter(piece, square, board, status)); break;
      case 'y': moves.push.apply(moves, getMovesForRegularElement(piece, square, board, status)); break;
      case 'b': moves.push.apply(moves, getMovesForBombFlag(piece, square, board, status)); break;
      case 'f': moves.push.apply(moves, getMovesForBombFlag(piece, square, board, status)); break;
    }
  }

  return moves;
};

/**
 * Get all the moves a pawn can make.
 * If includeUnsafe is true then moves that put the player's own king in check will be included.
 * Returns an array of move objects on success or an empty array on failure.
 */

 var getMovesForBombFlag = function(piece, square, board, status) {
   var moves = [];
   if (status === 'strategy') {
     if (piece[0] == 'b') {
       for (var i = 1; i <= 3; i++) {
         for (var j = 'a'.charCodeAt(0); j <= 'j'.charCodeAt(0); j++) {
           var destination = String.fromCharCode(j) + i;
           moves.push({type: 'swap', pieceCode: piece.substring(0,2), startSquare: square, endSquare: destination, swapSquare: destination});
         }
       }
     } else if (piece[0] == 'r') {
       for (var i = 6; i <= 8; i++) {
         for (var j = 'a'.charCodeAt(0); j <= 'j'.charCodeAt(0); j++) {
           var destination = String.fromCharCode(j) + i;
           moves.push({type: 'swap', pieceCode: piece.substring(0,2), startSquare: square, endSquare: destination, swapSquare: destination});
         }
       }
     }
   }
   return moves;
 }


var getMovesForRegularElement = function(piece, square, board, status) {
  var moves = [];
  if (status === 'strategy') {
    if (piece[0] == 'b') {
      for (var i = 1; i <= 3; i++) {
        for (var j = 'a'.charCodeAt(0); j <= 'j'.charCodeAt(0); j++) {
          var destination = String.fromCharCode(j) + i;
          moves.push({type: 'swap', pieceCode: piece.substring(0,2), startSquare: square, endSquare: destination, swapSquare: destination});
        }
      }
    } else if (piece[0] == 'r') {
      for (var i = 6; i <= 8; i++) {
        for (var j = 'a'.charCodeAt(0); j <= 'j'.charCodeAt(0); j++) {
          var destination = String.fromCharCode(j) + i;
          moves.push({type: 'swap', pieceCode: piece.substring(0,2), startSquare: square, endSquare: destination, swapSquare: destination});
        }
      }
    }
  } else if (status === 'ongoing') {
    var moveTransforms = [
      {x:0, y:1},
      {x:1, y:0},
      {x:-1, y:0},
      {x:0, y:-1},
    ];

    var captureTransforms = [
      {x:0, y:1},
      {x:1, y:0},
      {x:-1, y:0},
      {x:0, y:-1},
    ];

    var destination, move, capture = null;

    // Loop moves
    for (var i=0; i < moveTransforms.length; i++) {
      // Get destination square for move
      destination = transformSquare(square, moveTransforms[i]);
      if (!destination) { continue; }

      // If destination square is empty
      if (board[destination] === null ) {
        moves.push({type: 'move', pieceCode: piece.substring(0,2), startSquare: square, endSquare: destination});
      }
      // If destination square is occupied
      else {
        continue;
      }
    }

    for (var i=0; i < captureTransforms.length; i++) {
      // Get destination square for move
      destination = transformSquare(square, captureTransforms[i]);
      if (!destination) { continue; }

      // If destination square is empty

      if (!board[destination]) {
        continue;
      } else if (board[destination][0] !== piece[0] && board[destination] !== 'w') {
        moves.push({type: 'capture', pieceCode: piece.substring(0,2), startSquare: square, endSquare: destination, captureSquare: destination});
      }
      // If destination square is occupied
      else {
        continue;
      }
    }
  }

  return moves;
};

var getMovesFor2 = function(piece, square, board, status) {
  var moves = [];
  if (status === 'strategy') {
    if (piece[0] == 'b') {
      for (var i = 1; i <= 3; i++) {
        for (var j = 'a'.charCodeAt(0); j <= 'j'.charCodeAt(0); j++) {
          var destination = String.fromCharCode(j) + i;
          moves.push({type: 'swap', pieceCode: piece.substring(0,2), startSquare: square, endSquare: destination, swapSquare: destination});
        }
      }
    } else if (piece[0] == 'r') {
      for (var i = 6; i <= 8; i++) {
        for (var j = 'a'.charCodeAt(0); j <= 'j'.charCodeAt(0); j++) {
          var destination = String.fromCharCode(j) + i;
          moves.push({type: 'swap', pieceCode: piece.substring(0,2), startSquare: square, endSquare: destination, swapSquare: destination});
        }
      }
    }
  } else if (status === 'ongoing') {
    var moveTransforms = [
      [
        {x:0, y:1},
        {x:0, y:2},
        {x:0, y:3},
        {x:0, y:4},
        {x:0, y:5},
        {x:0, y:6},
        {x:0, y:7}
      ],
      [
        {x:0, y:-1},
        {x:0, y:-2},
        {x:0, y:-3},
        {x:0, y:-4},
        {x:0, y:-5},
        {x:0, y:-6},
        {x:0, y:-7}
      ],
      [
        {x:1, y:0},
        {x:2, y:0},
        {x:3, y:0},
        {x:4, y:0},
        {x:5, y:0},
        {x:6, y:0},
        {x:7, y:0},
        {x:8, y:0},
        {x:9, y:0}
      ],
      [
        {x:-1, y:0},
        {x:-2, y:0},
        {x:-3, y:0},
        {x:-4, y:0},
        {x:-5, y:0},
        {x:-6, y:0},
        {x:-7, y:0},
        {x:-8, y:0},
        {x:-9, y:0}
      ]
    ];

    var captureTransforms = [
      [
        {x:0, y:1},
        {x:0, y:2},
        {x:0, y:3},
        {x:0, y:4},
        {x:0, y:5},
        {x:0, y:6},
        {x:0, y:7}
      ],
      [
        {x:0, y:-1},
        {x:0, y:-2},
        {x:0, y:-3},
        {x:0, y:-4},
        {x:0, y:-5},
        {x:0, y:-6},
        {x:0, y:-7}
      ],
      [
        {x:1, y:0},
        {x:2, y:0},
        {x:3, y:0},
        {x:4, y:0},
        {x:5, y:0},
        {x:6, y:0},
        {x:7, y:0},
        {x:8, y:0},
        {x:9, y:0}
      ],
      [
        {x:-1, y:0},
        {x:-2, y:0},
        {x:-3, y:0},
        {x:-4, y:0},
        {x:-5, y:0},
        {x:-6, y:0},
        {x:-7, y:0},
        {x:-8, y:0},
        {x:-9, y:0}
      ]
    ];

    var destination, move, capture = null;

    // Loop moves
    for (var i=0; i < moveTransforms.length; i++) {
      for (var j = 0; j < moveTransforms[i].length; j++) {
        // Get destination square for move
        destination = transformSquare(square, moveTransforms[i][j]);
        if (!destination) { break; }

        // If destination square is empty
        if (board[destination] === null ) {
          moves.push({type: 'move', pieceCode: piece.substring(0,2), startSquare: square, endSquare: destination});
        }
        // If destination square is occupied
        else {
          break;
        }
      }
    }

    for (var i = 0; i < captureTransforms.length; i++) {
      for (var j = 0; j < captureTransforms[i].length; j++) {
        // Get destination square for move
        destination = transformSquare(square, captureTransforms[i][j]);
        if (!destination) { break; }

        // If destination square is empty
        if (!board[destination]) {
          continue;
        } else if (board[destination][0] !== piece[0] && board[destination] !== 'w') {
          moves.push({type: 'capture', pieceCode: piece.substring(0,2), startSquare: square, endSquare: destination, captureSquare: destination});
          break;
        } else {
          break;
        }
      }
    }
  }

  return moves;
};

var getMovesForSpotter = function(piece, square, board, status) {
  var moves = [];
  if (status === 'strategy') {
    if (piece[0] == 'b') {
      for (var i = 1; i <= 3; i++) {
        for (var j = 'a'.charCodeAt(0); j <= 'j'.charCodeAt(0); j++) {
          var destination = String.fromCharCode(j) + i;
          moves.push({type: 'swap', pieceCode: piece.substring(0,2), startSquare: square, endSquare: destination, swapSquare: destination});
        }
      }
    } else if (piece[0] == 'r') {
      for (var i = 6; i <= 8; i++) {
        for (var j = 'a'.charCodeAt(0); j <= 'j'.charCodeAt(0); j++) {
          var destination = String.fromCharCode(j) + i;
          moves.push({type: 'swap', pieceCode: piece.substring(0,2), startSquare: square, endSquare: destination, swapSquare: destination});
        }
      }
    }
  } else if (status === 'ongoing') {
    for (var cap_square in board) {
      if (board[cap_square]){
        if (piece[0] !== board[cap_square][0] && board[cap_square] !== 'w') {
          moves.push({
            type: 'spotterCapture',
            pieceCode: piece.substring(0,2),
            startSquare: square,
            endSquare: cap_square,
            captureSquare: cap_square,
            guessingPiece: '2',
            capturePiece: board[cap_square][1]
          });
          moves.push({type: 'spotterCapture', pieceCode: piece.substring(0,2), startSquare: square, endSquare: cap_square, captureSquare: cap_square, guessingPiece: '3', capturePiece: board[cap_square][1]});
          moves.push({type: 'spotterCapture', pieceCode: piece.substring(0,2), startSquare: square, endSquare: cap_square, captureSquare: cap_square, guessingPiece: '4', capturePiece: board[cap_square][1]});
          moves.push({type: 'spotterCapture', pieceCode: piece.substring(0,2), startSquare: square, endSquare: cap_square, captureSquare: cap_square, guessingPiece: '5', capturePiece: board[cap_square][1]});
          moves.push({type: 'spotterCapture', pieceCode: piece.substring(0,2), startSquare: square, endSquare: cap_square, captureSquare: cap_square, guessingPiece: '6', capturePiece: board[cap_square][1]});
          moves.push({type: 'spotterCapture', pieceCode: piece.substring(0,2), startSquare: square, endSquare: cap_square, captureSquare: cap_square, guessingPiece: '7', capturePiece: board[cap_square][1]});
          moves.push({type: 'spotterCapture', pieceCode: piece.substring(0,2), startSquare: square, endSquare: cap_square, captureSquare: cap_square, guessingPiece: '8', capturePiece: board[cap_square][1]});
          moves.push({type: 'spotterCapture', pieceCode: piece.substring(0,2), startSquare: square, endSquare: cap_square, captureSquare: cap_square, guessingPiece: '9', capturePiece: board[cap_square][1]});
          moves.push({type: 'spotterCapture', pieceCode: piece.substring(0,2), startSquare: square, endSquare: cap_square, captureSquare: cap_square, guessingPiece: 't', capturePiece: board[cap_square][1]});
          moves.push({type: 'spotterCapture', pieceCode: piece.substring(0,2), startSquare: square, endSquare: cap_square, captureSquare: cap_square, guessingPiece: 's', capturePiece: board[cap_square][1]});
          moves.push({type: 'spotterCapture', pieceCode: piece.substring(0,2), startSquare: square, endSquare: cap_square, captureSquare: cap_square, guessingPiece: 'y', capturePiece: board[cap_square][1]});
        }
      }
    }
  }

  return moves;
};

/**
 * Determine if a player's king is in check or not.
 * Returns true or false.
 */
var transformSquare = function(square, transform) {
  var alpha2num = function(a) {
    switch (a) {
      case 'a': return 1;
      case 'b': return 2;
      case 'c': return 3;
      case 'd': return 4;
      case 'e': return 5;
      case 'f': return 6;
      case 'g': return 7;
      case 'h': return 8;
      case 'i': return 9;
      case 'j': return 10;
      default : return 11; // out of bounds
    }
  };

  var num2alpha = function(n) {
    switch (n) {
       case 1: return 'a';
       case 2: return 'b';
       case 3: return 'c';
       case 4: return 'd';
       case 5: return 'e';
       case 6: return 'f';
       case 7: return 'g';
       case 8: return 'h';
       case 9: return 'i';
       case 10: return 'j';
      default: return 'k'; // out of bounds
    }
  };

  // Parse square
  var file = square[0];
  var rank = parseInt(square[1], 10);

  // Apply transform
  var destFile = alpha2num(file) + transform.x;
  var destRank = rank + transform.y;

  // Check boundaries
  if (destFile < 1 || destFile > 10) { return false; }
  if (destRank < 1 || destRank > 10) { return false; }

  // Return new square
  return num2alpha(destFile) + destRank;
};

/**
 * Parse a move string and convert it to an object.
 * Returns the move object on success or null on failure.
 */
var parseMoveString = function(moveString) {

  // Moves
  if (moveString[4] === '-') {
    return {
      type        : 'move',
      pieceCode   : moveString.substring(0, 2),
      startSquare : moveString.substring(2, 4),
      endSquare   : moveString.substring(5, 7)
    }
  }
  // Captures
  else if (moveString[4] === 'x') {

    return {
      type          : 'capture',
      pieceCode     : moveString.substring(0, 2),
      startSquare   : moveString.substring(2, 4),
      endSquare     : moveString.substring(5, 7),
      captureSquare : moveString.substring(5, 7)
    }
  } else if (moveString[4] === '.') {

    return {
      type          : 'swap',
      pieceCode     : moveString.substring(0, 2),
      startSquare   : moveString.substring(2, 4),
      endSquare     : moveString.substring(5, 7),
      swapSquare    : moveString.substring(5, 7)
    }
  } else if (moveString[4] === 's') {

    return {
      type          : 'spotterCapture',
      pieceCode     : moveString.substring(0, 2),
      startSquare   : moveString.substring(2, 4),
      endSquare     : moveString.substring(5, 7),
      captureSquare : moveString.substring(5, 7),
      guessingPiece : moveString.substring(8, 9),
      capturePiece  : moveString.substring(7, 8)
    }
  } else {
    return null;
  }
};

// Export the game object
module.exports = Game;
