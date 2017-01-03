var Client = (function(window) {

  var socket      = null;
  var gameState   = null;

  var gameID      = null;
  var playerColor = null;
  var playerName  = null;

  var container   = null;
  var messages    = null;
  var board       = null;
  var squares     = null;

  var gameClasses = null;

  var selection   = null;

  var gameOverMessage     = null;
  var pawnPromotionPrompt = null;
  var forfeitPrompt       = null;
  var spotterChoosePropmpt = null;
  var spotterChoosedPiece = null;


  /**
   * Initialize the UI
   */
  var init = function(config) {
    gameID      = config.gameID;
    playerColor = config.playerColor;
    playerName  = config.playerName;

    container   = $('#game');
    messages    = $('#messages');
    board       = $('#board');
    squares     = board.find('.square');

    gameOverMessage     = $('#game-over');
    forfeitPrompt       = $('#forfeit-game');
    spotterChoosePropmpt = $('#spotter-choose-piece');
    spotterChoosedPiece = '1';
    gameClasses = "blue red spy spotter bomb flag el2 el3 el4 el5 el6 el7 el8 el9 el10 not-moved empty selected water opponent " +
                  "valid-move valid-capture valid-en-passant-capture valid-castle last-move";

    // Create socket connection
    socket = io.connect();

    // Define board based on player's perspective
    assignSquares();

    // Attach event handlers
    attachDOMEventHandlers();
    attachSocketEventHandlers();

    // Initialize modal popup windows
    gameOverMessage.modal({show: false, keyboard: false, backdrop: 'static'});
    forfeitPrompt.modal({show: false, keyboard: false, backdrop: 'static'});
    spotterChoosePropmpt.modal({show: false, keyboard: false, backdrop: 'static'});

    // Join game
    socket.emit('join', gameID);
  };

  /**
   * Assign square IDs and labels based on player's perspective
   */
  var assignSquares = function() {
    var fileLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    var rankLabels = [ 8, 7, 6, 5, 4, 3, 2, 1];
    var squareIDs  = [
      'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8', 'i8', 'j8',
      'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7', 'i7', 'j7',
      'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6', 'i6', 'j6',
      'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5', 'i5', 'j5',
      'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4', 'i4', 'j4',
      'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3', 'i3', 'j3',
      'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2', 'i2', 'j2',
      'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1', 'i1', 'j1'
    ];

    if (playerColor === 'red') {
      fileLabels.reverse();
      rankLabels.reverse();
      squareIDs.reverse();
    }

    // Set file and rank labels
    $('.top-edge').each(function(i) { $(this).text(fileLabels[i]); });
    $('.right-edge').each(function(i) { $(this).text(rankLabels[i]); });
    $('.bottom-edge').each(function(i) { $(this).text(fileLabels[i]); });
    $('.left-edge').each(function(i) { $(this).text(rankLabels[i]); });

    // Set square IDs
    squares.each(function(i) { $(this).attr('id', squareIDs[i]); });
  };

  /**
   * Attach DOM event handlers
   */
  var attachDOMEventHandlers = function() {

    // Highlight valid moves for white pieces
    if (playerColor === 'blue') {
      container.on('click', '.blue.spotter', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('bs', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('bs', ev.target);
          showSpotterPrompt(function(piece){
            spotterChoosedPiece = piece;
          });
        }
      });
      container.on('click', '.blue.spy', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('by', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('by', ev.target);
        }
      });
      container.on('click', '.blue.flag', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('bf', ev.target);
        }
      });
      container.on('click', '.blue.bomb', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('bb', ev.target);
        }
      });

      container.on('click', '.blue.el1', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('b1', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('b1', ev.target);
        }
      });
      container.on('click', '.blue.el2', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('b2', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('b2', ev.target);
        }
      });
      container.on('click', '.blue.el3', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('b3', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('b3', ev.target);
        }
      });
      container.on('click', '.blue.el4', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('b4', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('b4', ev.target);
        }
      });
      container.on('click', '.blue.el5', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('b5', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('b5', ev.target);
        }
      });
      container.on('click', '.blue.el6', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('b6', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('b6', ev.target);
        }
      });
      container.on('click', '.blue.el7', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('b7', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('b7', ev.target);
        }
      });
      container.on('click', '.blue.el8', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('b8', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('b8', ev.target);
        }
      });
      container.on('click', '.blue.el9', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('b9', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('b9', ev.target);
        }
      });
      container.on('click', '.blue.el10', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('bt', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('bt', ev.target);
        }
      });
    }
    // Highlight valid moves for black pieces
    if (playerColor === 'red') {
      container.on('click', '.red.spotter', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('rs', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('rs', ev.target);
          showSpotterPrompt(function(piece){
            spotterChoosedPiece = piece;
          });
        }
      });
      container.on('click', '.red.spy', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('ry', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('ry', ev.target);
        }
      });
      container.on('click', '.red.flag', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('rf', ev.target);
        }
      });
      container.on('click', '.red.bomb', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('rb', ev.target);
        }
      });


      container.on('click', '.red.el2', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('r2', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('r2', ev.target);
        }
      });
      container.on('click', '.red.el3', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('r3', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('r3', ev.target);
        }
      });
      container.on('click', '.red.el4', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('r4', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('r4', ev.target);
        }
      });
      container.on('click', '.red.el5', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('r5', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('r5', ev.target);
        }
      });
      container.on('click', '.red.el6', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('r6', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('r6', ev.target);
        }
      });
      container.on('click', '.red.el7', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('r7', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('r7', ev.target);
        }
      });
      container.on('click', '.red.el8', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('r8', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('r8', ev.target);
        }
      });
      container.on('click', '.red.el9', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('r9', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('r9', ev.target);
        }
      });
      container.on('click', '.red.el10', function(ev) {
        var player = gameState.players[0];
        if (player.color !== playerColor) {
          player = gameState.players[1];
        }
        if (gameState.status == 'strategy' && !player.ready && !($(ev.target).hasClass('valid-swap'))) {
          highlightValidMoves('rt', ev.target);
        } else if (gameState.status === 'ongoing' && gameState.activePlayer && gameState.activePlayer.color === playerColor) {
          highlightValidMoves('rt', ev.target);
        }
      });
    }

    // Clear all move highlights
    container.on('click', '.empty', function(ev) {
      clearHighlights();
    });

    // Perform a regular move
    container.on('click', '.valid-move', function(ev) {
      var m = move(ev.target);
      console.log(ev.target);

      messages.empty();
      socket.emit('move', {gameID: gameID, move: m});
    });

    container.on('click', '.valid-swap', function(ev) {
      var m = swap(ev.target);
      console.log(ev.target);

      messages.empty();
      socket.emit('move', {gameID: gameID, move: m});
    });

    // Perform a regular capture
    container.on('click', '.valid-capture', function(ev) {
      var m = capture(ev.target);

      messages.empty();
      socket.emit('move', {gameID: gameID, move: m});
    });

    container.on('click', '.valid-spotter-capture', function(ev) {
      var m = spotterCapture(ev.target);

      messages.empty();
      socket.emit('move', {gameID: gameID, move: m});
    });

    // Perform an en passant capture
    container.on('click', '.valid-en-passant-capture', function(ev) {
      var m = capture(ev.target);
      messages.empty();
      socket.emit('move', {gameID: gameID, move: m+'ep'});
    });

    container.on('click', '#ready-button', function(ev) {
      $(ev.target).attr('disabled', 'disabled');
      messages.empty();
      socket.emit('ready', gameID);
    });
    // Forfeit game
    container.on('click', '#forfeit', function(ev) {
      showForfeitPrompt(function(confirmed)   {
        if (confirmed) {
          messages.empty();
          socket.emit('forfeit', gameID);
        }
      });
    });

  };

  /**
   * Attach Socket.IO event handlers
   */
  var attachSocketEventHandlers = function() {

    // Update UI with new game state
    socket.on('update', function(data) {
      gameState = data;
      update();
    });

    socket.on('join', function(data) {
      if (data.players[0].joined && data.players[1].joined) {
        $('#ready-button').css('visibility', 'visible');
      }
    });

    socket.on('start', function(data) {
      var opponent = data.players[1];
      if (opponent.color === playerColor) {
        opponent = data.players[0];
      }
      if (data.players[0].ready && data.players[1].ready) {
        $('#ready-button').css('visibility', 'hidden');
        $('#opponent-ready').css('visibility', 'hidden');
      }
      var text = 'Not Ready';
      if (opponent.ready) {
        var text = 'Ready';
      }
      $('#opponent-ready').text(text);
    });

    // Display an error
    socket.on('error', function(data) {
      showErrorMessage(data);
    });
  };

  /**
   * Highlight valid moves for the selected piece
   */
  var highlightValidMoves = function(piece, selectedSquare) {
    var square = $(selectedSquare);
    var move   = null;

    // Set selection object
    selection = {
      color: piece[0],
      piece: piece[1],
      file:  square.attr('id')[0],
      rank:  square.attr('id')[1]
    };
    // Highlight the selected square
    squares.removeClass('selected');
    square.addClass('selected');

    var str = '';
    var i = 0;
    for (square1 in gameState.board) {
      str += square1 + ':' + gameState.board[square1] + ' ';
      if (i == 9) {
        str += '\n';
        i = -1;
        console.log(str);
        str = '';
      }
      i++;
    }

    // Highlight any valid moves
    squares.removeClass('valid-move valid-swap valid-spotter-capture valid-capture valid-en-passant-capture valid-castle');
    for (var i=0; i<gameState.validMoves.length; i++) {
      move = gameState.validMoves[i];

      if (move.type === 'move') {
        if (move.pieceCode === piece && move.startSquare === square.attr('id')) {
          $('#'+move.endSquare).addClass('valid-move');
        }
      }

      if (move.type === 'capture') {
        if (move.pieceCode === piece && move.startSquare === square.attr('id')) {
          if (move.captureSquare === move.endSquare) {
            $('#'+move.endSquare).addClass('valid-capture');
          } else {
            $('#'+move.endSquare).addClass('valid-en-passant-capture');
          }
        }
      }

      if (move.type === 'spotterCapture') {
        if (move.startSquare === square.attr('id')) {
          if (move.captureSquare === move.endSquare) {
            $('#'+move.endSquare).addClass('valid-spotter-capture');
          }
        }
      }

      if (move.type === 'swap') {
        if (move.startSquare === square.attr('id')) {
          if (move.swapSquare === move.endSquare) {
            $('#'+move.endSquare).addClass('valid-swap');
          }
        }
      }
    }
  };

  /**
   * Clear valid move highlights
   */
  var clearHighlights = function() {
    squares.removeClass('selected');
    squares.removeClass('valid-move');
    squares.removeClass('valid-swap');
    squares.removeClass('valid-spotter-capture');
    squares.removeClass('valid-capture');
    squares.removeClass('valid-en-passant-capture');
    squares.removeClass('valid-castle');
  };

  /**
   * Move selected piece to destination square
   */
  var move = function(destinationSquare) {
    var piece = selection.color+selection.piece;
    var src   = $('#'+selection.file+selection.rank);
    var dest  = $(destinationSquare);

    console.log('#'+selection.file+selection.rank);
    console.log(destinationSquare);
    clearHighlights();

    // Move piece on board
    src.removeClass(gameClasses).addClass('empty');
    dest.removeClass('empty').addClass(getPieceClasses(piece));

    // Return move string
    return piece+selection.file+selection.rank+'-'+dest.attr('id');
  };

  var swap = function(destinationSquare) {
    var piece = selection.color + selection.piece;
    var src   = $('#' + selection.file + selection.rank);
    var dest  = $(destinationSquare);
    var new_dest_classes = src.attr('class');
    var new_src_classes  = dest.attr('class');

    console.log(new_dest_classes);
    console.log(new_src_classes);

    src.removeClass().addClass(new_src_classes);
    dest.removeClass().addClass(new_dest_classes);

    clearHighlights();

    // Return move string
    console.log(piece + selection.file + selection.rank + '.' + dest.attr('id'));
    return piece+selection.file + selection.rank + '.' + dest.attr('id');
  }
  /**
   * Move selected piece to destination square and capture an opponents piece
   */
  var capture = function(destinationSquare) {
    var piece = selection.color+selection.piece;
    var src   = $('#'+selection.file+selection.rank);
    var dest  = $(destinationSquare);

    clearHighlights();

    // Move piece on board
    /*dest.removeClass(gameClasses).addClass(getPieceClasses(gameState.board[dest.attr('id')], capture=true));

    setTimeout(() => {
      src.removeClass(getPieceClasses(piece)).addClass('empty');
      dest.removeClass(gameClasses).addClass(getPieceClasses(piece));
    }, 2000);
*/
    // Return move string
    return piece+selection.file+selection.rank+'x'+dest.attr('id');
  };

  var spotterCapture = function(destinationSquare) {
    var piece = selection.color+selection.piece;
    var src   = $('#'+selection.file+selection.rank);
    var dest  = $(destinationSquare);

    clearHighlights();

    // Move piece on board
    /*dest.removeClass(gameClasses).addClass(getPieceClasses(gameState.board[dest.attr('id')], capture=true));

    setTimeout(() => {
      src.removeClass(getPieceClasses(piece)).addClass('empty');
      dest.removeClass(gameClasses).addClass(getPieceClasses(piece));
    }, 2000);
  */
    // Return move string
    console.log(piece+selection.file+selection.rank+'s'+dest.attr('id') + spotterChoosedPiece+gameState.board[dest.attr('id')][1]);
    return piece+selection.file+selection.rank+'s'+dest.attr('id') + spotterChoosedPiece+gameState.board[dest.attr('id')][1];
  };

  /**
   * Update UI from game state
   */
  var update = function() {
    var you, opponent = null;

    var container, name, status, captures = null;

    // Update player info

    if (gameState.validMoves) {
      for (var i in gameState.validMoves) {
        if (gameState.validMoves[i].type === 'spotterCapture' && gameState.validMoves[i].guessingPiece === '2') {
          console.log(gameState.validMoves[i]);
        }
      }
    }
    for (var i=0; i<gameState.players.length; i++) {

      // Determine if player is you or opponent
      if (gameState.players[i].color === playerColor) {
        you = gameState.players[i];
        container = $('#you');
      }
      else if (gameState.players[i].color !== playerColor) {
        opponent = gameState.players[i];
        container = $('#opponent');
      }

      name     = container.find('strong');
      status   = container.find('.status');
      captures = container.find('ul');

      // Name
      if (gameState.players[i].name) {
        name.text(gameState.players[i].name);
      }

      // Active Status
      container.removeClass('active-player');
      if (gameState.activePlayer && gameState.activePlayer.color === gameState.players[i].color) {
        container.addClass('active-player');
      }

      // Check Status
      status.removeClass('label label-danger').text('');
      if (gameState.players[i].inCheck) {
        status.addClass('label label-danger').text('Check');
      }

      // Captured Pieces
      /*captures.empty();
      for (var j=0; j<gameState.capturedPieces.length; j++) {
        if (gameState.capturedPieces[j][0] !== gameState.players[i].color[0]) {
          captures.append('<li class="'+getPieceClasses(gameState.capturedPieces[j])+'"></li>');
        }
      }*/

    }

    // Update board
    for (var sq in gameState.board) {
      if (gameState.lastMove) {
        if (gameState.lastMove.type === 'capture') {
          if (gameState.lastMove.startSquare === sq) {
            $('#'+sq).removeClass(gameClasses).addClass(getPieceClasses(gameState.lastMove.pieceCode, captureFlag=true));
            var pieceClasses1 = getPieceClasses(gameState.board[sq]);
            var sq1 = sq;
            setTimeout(() => {
              $('#'+sq1).removeClass(gameClasses).addClass(pieceClasses1);
            }, 500)
            continue;
          } else if (gameState.lastMove.endSquare === sq) {
            $('#'+sq).removeClass(gameClasses).addClass(getPieceClasses(gameState.lastMove.capturePiece, captureFlag=true));
            var pieceClasses2 = getPieceClasses(gameState.board[sq]);
            var sq2 = sq;
            setTimeout(() => {
              $('#'+sq2).removeClass(gameClasses).addClass(pieceClasses2);
            }, 500)
            continue;
          }
        }
      }
      $('#'+sq).removeClass(gameClasses).addClass(getPieceClasses(gameState.board[sq]));
    }

    // Highlight last move
    if (gameState.lastMove) {
      if (gameState.lastMove.type === 'move' || gameState.lastMove.type === 'capture') {
        $('#'+gameState.lastMove.startSquare).addClass('last-move');
        $('#'+gameState.lastMove.endSquare).addClass('last-move');
      }
    }

    // Test for checkmate
    if (gameState.status === 'checkmate') {
      if (gameState.looser_color !== playerColor) {
        showGameOverMessage('checkmate-win');
      } else {
        showGameOverMessage('checkmate-lose');
      }
    }

    // Test for stalemate
    if (gameState.status === 'stalemate') { showGameOverMessage('stalemate'); }

    // Test for forfeit
    if (gameState.status === 'forfeit') {
      if (opponent.forfeited) { showGameOverMessage('forfeit-win');  }
      if (you.forfeited)      { showGameOverMessage('forfeit-lose'); }
    }
  };

  /**
   * Display an error message on the page
   */
  var showErrorMessage = function(data) {
    var msg, html = '';

    if (data == 'handshake unauthorized') {
      msg = 'Client connection failed';
    } else {
      msg = data.message;
    }

    html = '<div class="alert alert-danger">'+msg+'</div>';
    messages.append(html);
  };

  /**
   * Display the "Game Over" window
   */
  var showGameOverMessage = function(type) {
    var header = gameOverMessage.find('h2');

    // Set the header's content and CSS classes
    header.removeClass('alert-success alert-danger alert-warning');
    switch (type) {
      case 'checkmate-win'  : header.addClass('alert-success').text('Checkmate'); break;
      case 'checkmate-lose' : header.addClass('alert-danger').text('Checkmate'); break;
      case 'forfeit-win'    : header.addClass('alert-success').text('Your opponent has forfeited the game'); break;
      case 'forfeit-lose'   : header.addClass('alert-danger').text('You have forfeited the game'); break;
      case 'stalemate'      : header.addClass('alert-warning').text('Stalemate'); break;
    }

    gameOverMessage.modal('show');
  };

  /**
   * Display the "Pawn Promotion" prompt
   */

  /**
   * Display the "Forfeit Game" confirmation prompt
   */
  var showForfeitPrompt = function(callback) {

    // Temporarily attach click handler for the Cancel button, note the use of .one()
    forfeitPrompt.one('click', '#cancel-forfeit', function(ev) {
      callback(false);
      forfeitPrompt.modal('hide');
    });

    // Temporarily attach click handler for the Confirm button, note the use of .one()
    forfeitPrompt.one('click', '#confirm-forfeit', function(ev) {
      callback(true);
      forfeitPrompt.modal('hide');
    });

    forfeitPrompt.modal('show');
  };

  var showSpotterPrompt = function(callback) {

    // Temporarily attach click handler for the Cancel button, note the use of .one()


    // Temporarily attach click handler for the Confirm button, note the use of .one()

    spotterChoosePropmpt.one('click', '#choose-2', function(ev) {
      callback('2');
      spotterChoosePropmpt.modal('hide');
    });
    spotterChoosePropmpt.one('click', '#choose-3', function(ev) {
      callback('3');
      spotterChoosePropmpt.modal('hide');
    });
    spotterChoosePropmpt.one('click', '#choose-4', function(ev) {
      callback('4');
      spotterChoosePropmpt.modal('hide');
    });
    spotterChoosePropmpt.one('click', '#choose-5', function(ev) {
      callback('5');
      spotterChoosePropmpt.modal('hide');
    });
    spotterChoosePropmpt.one('click', '#choose-6', function(ev) {
      callback('6');
      spotterChoosePropmpt.modal('hide');
    });
    spotterChoosePropmpt.one('click', '#choose-7', function(ev) {
      callback('7');
      spotterChoosePropmpt.modal('hide');
    });
    spotterChoosePropmpt.one('click', '#choose-8', function(ev) {
      callback('8');
      spotterChoosePropmpt.modal('hide');
    });
    spotterChoosePropmpt.one('click', '#choose-9', function(ev) {
      callback('9');
      spotterChoosePropmpt.modal('hide');
    });
    spotterChoosePropmpt.one('click', '#choose-10', function(ev) {
      callback('t');
      spotterChoosePropmpt.modal('hide');
    });
    spotterChoosePropmpt.one('click', '#choose-spy', function(ev) {
      callback('y');
      spotterChoosePropmpt.modal('hide');
    });
    spotterChoosePropmpt.one('click', '#choose-spotter', function(ev) {
      callback('s');
      spotterChoosePropmpt.modal('hide');
    });

    spotterChoosePropmpt.modal('show');
  };
  /**
   * Get the corresponding CSS classes for a given piece
   */
  var getPieceClasses = function(piece, captureFlag=false) {
    if (captureFlag) {
      switch (piece) {
        case 'b1'  : return 'blue el1';
        case 'b2'  : return 'blue el2';
        case 'b3'  : return 'blue el3';
        case 'b4'  : return 'blue el4';
        case 'b5'  : return 'blue el5';
        case 'b6'  : return 'blue el6';
        case 'b7'  : return 'blue el7';
        case 'b8'  : return 'blue el8';
        case 'b9'  : return 'blue el9';
        case 'bt'  : return 'blue el10';
        case 'bs'  : return 'blue spotter';
        case 'by'  : return 'blue spy';
        case 'bb'  : return 'blue bomb';
        case 'bf' : return 'blue flag';
        case 'r1'  : return 'red el1';
        case 'r2'  : return 'red el2';
        case 'r3'  : return 'red el3';
        case 'r4'  : return 'red el4';
        case 'r5'  : return 'red el5';
        case 'r6'  : return 'red el6';
        case 'r7'  : return 'red el7';
        case 'r8'  : return 'red el8';
        case 'r9'  : return 'red el9';
        case 'rt'  : return 'red el10';
        case 'rs'  : return 'red spotter';
        case 'ry'  : return 'red spy';
        case 'rf'  : return 'red flag';
        case 'rb'  : return 'red bomb';
        case 'w' : return 'water';
        default    : return 'empty';
      }
    } else {
      if (playerColor === 'blue') {
        switch (piece) {
          case 'b1'  : return 'blue el1';
          case 'b2'  : return 'blue el2';
          case 'b3'  : return 'blue el3';
          case 'b4'  : return 'blue el4';
          case 'b5'  : return 'blue el5';
          case 'b6'  : return 'blue el6';
          case 'b7'  : return 'blue el7';
          case 'b8'  : return 'blue el8';
          case 'b9'  : return 'blue el9';
          case 'bt'  : return 'blue el10';
          case 'bs'  : return 'blue spotter';
          case 'by'  : return 'blue spy';
          case 'bb'  : return 'blue bomb';
          case 'bf' : return 'blue flag';
          case 'r1'  : return 'red opponent';
          case 'r2'  : return 'red opponent';
          case 'r3'  : return 'red opponent';
          case 'r4'  : return 'red opponent';
          case 'r5'  : return 'red opponent';
          case 'r6'  : return 'red opponent';
          case 'r7'  : return 'red opponent';
          case 'r8'  : return 'red opponent';
          case 'r9'  : return 'red opponent';
          case 'rt'  : return 'red opponent';
          case 'rs'  : return 'red opponent';
          case 'ry'  : return 'red opponent';
          case 'rf' : return 'red opponent';
          case 'rb'  : return 'red opponent';
          case 'w' : return 'water';
          default    : return 'empty';
        }
      } else {
        switch (piece) {
          case 'b1'  : return 'blue opponent';
          case 'b2'  : return 'blue opponent';
          case 'b3'  : return 'blue opponent';
          case 'b4'  : return 'blue opponent';
          case 'b5'  : return 'blue opponent';
          case 'b6'  : return 'blue opponent';
          case 'b7'  : return 'blue opponent';
          case 'b8'  : return 'blue opponent';
          case 'b9'  : return 'blue opponent';
          case 'bt'  : return 'blue opponent';
          case 'bs'  : return 'blue opponent';
          case 'by'  : return 'blue opponent';
          case 'bf'  : return 'blue opponent';
          case 'bb'  : return 'blue opponent';
          case 'r1'  : return 'red el1';
          case 'r2'  : return 'red el2';
          case 'r3'  : return 'red el3';
          case 'r4'  : return 'red el4';
          case 'r5'  : return 'red el5';
          case 'r6'  : return 'red el6';
          case 'r7'  : return 'red el7';
          case 'r8'  : return 'red el8';
          case 'r9'  : return 'red el9';
          case 'rt'  : return 'red el10';
          case 'rs'  : return 'red spotter';
          case 'ry'  : return 'red spy';
          case 'rf'  : return 'red flag';
          case 'rb'  : return 'red bomb';
          case 'w' : return 'water';
          default    : return 'empty';
        }
      }
    }
  };

  return init;

}(window));
