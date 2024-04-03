const boardDiv = document.querySelector('#board');

const HTMLboard = Array(64);

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
        // if the selection did not result in a move
        let result = Game.selectSquare(square.pos);
        if(!result) {
            square.classList.add('selected');
        }
    },

    deselectAll: () => {
        squareSelected = null;
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