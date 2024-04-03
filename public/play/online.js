(() => {

const socket = io();

const PATHNAME = location.pathname.match(/[0-9]+/);

const boardDiv = document.querySelector('#board');

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
            socket.emit('clickoff', PATHNAME, document.cookie);
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

socket.on('loadPos', (board_) => {
    for(let i = 0; i < board_.length; i++) {
        board[i] = board_[i];
    }
    Board.updateBoardPieces();
});

socket.on('highlight', (list) => {
    Board.highlightList(list);
})

socket.emit('ready', PATHNAME);

})();