(() => {

const socket = io();

const PATHNAME = location.pathname.split('/')[2];

const boardDiv = document.querySelector('#board');
const youText = document.querySelector('#you');
const opponentText = document.querySelector('#opponent');
const youTime = document.querySelector('#you-time');
const opponentTime = document.querySelector('#opponent-time');
const gameResult = document.querySelector('#result');

const HTMLboard = Array(64);
const board = Array(64).fill(null);


const Board = {
    createBoard: () => {
        boardDiv.innerHTML = '';
        for(let i = 0; i < 64; i++) {
            let square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((~~(i / 8) + i) % 2 == 0 ? 'white' : 'black');
            square.pos = i;
            square.style.height = '64px';
            square.style.width = '64px';
            square.style.order = i;
            square.addEventListener('click', Board.selectSquare);
            HTMLboard[i] = square;
            boardDiv.append(square);
        }
        boardDiv.style.width = `${8 * 64}px`;
        boardDiv.style.height = `${8 * 64}px`;
    },
    
    selectSquare: (e) => {
        let square = e.target;
        document.querySelector('.selected')?.classList.remove('selected');
        Board.unhighlightAll();
        square.classList.add('selected');
        socket.emit('select', PATHNAME, square.pos);
    },

    deselectAll: () => {
        for(let i = 0; i < HTMLboard.length; i++) {
            HTMLboard[i].classList.remove('selected');
        }
    },

    highlightSquare: (pos) => {
        HTMLboard[pos].classList.add('highlighted');
    },

    highlightList: (arr) => {
        for(let i = 0; i < arr.length; i++) {
            Board.highlightSquare(arr[i]);
        }
    },

    unhighlightAll: () => {
        for(let i = 0; i < HTMLboard.length; i++) {
            HTMLboard[i].classList.remove('highlighted');
        }
    },

    clickOutside: (e) => {
        if(!e.target.classList.contains('square')) {
            socket.emit('clickoff', PATHNAME);
            Board.deselectAll();
            Board.unhighlightAll();
        }
    },

    updateBoardPieces: () => {
        for(let i = 0; i < 64; i++) {
            HTMLboard[i].innerHTML = '';
            if(board[i]) {
                let piece = board[i];
                let image = document.createElement('img');
                image.src = `../assets/${piece.type}${piece.color}.png`;
                image.classList.add('piece-img');
                HTMLboard[i].append(image);
            }
        }
    },

    flipBoard: () => {
        for(let i = 0; i < 64; i++) {
            HTMLboard[i].style.order = 63 - HTMLboard[i].style.order;
        }
    },
}

Board.createBoard();

document.getElementById('flip').addEventListener('click', Board.flipBoard);
document.body.addEventListener('click', Board.clickOutside);


socket.on('move', (start, end) => {
    board[start] = null;
    board[end] = board[start];
    board[start].pos = end;
    Board.updateBoardPieces();
});

socket.on('update', (board_) => {
    for(let i = 0; i < board_.length; i++) {
        board[i] = board_[i];
    }
    Board.unhighlightAll();
    Board.deselectAll();
    Board.updateBoardPieces();
    socket.emit('clickoff', PATHNAME);
});

socket.on('highlight', (list) => {
    Board.highlightList(list);
});

socket.on('info', (players) => {
    let you, opponent;
    let spectator = false;
    if(players[0].id == socket.playerId) {
        you = players[0];
        opponent = players[1];
    }
    else if(players[1].id == socket.playerId) {
        you = players[1];
        opponent = players[0];
        Board.flipBoard();
    }
    else {
        you = players[0];
        opponent = players[1];
        spectator = true;
    }
    youText.innerHTML = `${spectator ? '' : 'You: '}${you.name} (${you.color})`;
    opponentText.innerHTML = `${spectator ? '' : 'Opponent: '}${opponent.name} (${opponent.color})`;
});

socket.on('gameEnd', (message) => {
    gameResult.innerHTML = message;
});

socket.on('ask', (callback) => {
    let response = prompt('Which piece to promote to?', 'queen');
    callback(response);
});

socket.on('time', (players) => {
    let you, opponent;
    if(players[1].id == socket.playerId) {
        you = players[1];
        opponent = players[0];
    }
    else {
        you = players[0];
        opponent = players[1];
    }
    youTime.innerHTML = `${you.time < 60 ? '0' : ''}${Math.floor(you.time / 60)}:${you.time % 60 < 10 ? '0' : ''}${you.time % 60}`;
    opponentTime.innerHTML = `${opponent.time < 60 ? '0' : ''}${Math.floor(opponent.time / 60)}:${opponent.time % 60 < 10 ? '0' : ''}${opponent.time % 60}`;
});


if(sessionStorage.playerId) {
    socket.playerId = sessionStorage.playerId;
    socket.emit('setId', sessionStorage.playerId);
}
else {
    window.location = '/'
}

socket.emit('ready', PATHNAME);

})();