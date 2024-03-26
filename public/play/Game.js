const TAKE_KING = false;
const FLIP_BOARD = false;
const HIGHLIGHT_MOVES = true;
// a piece will be {type: type, color: color} (for now)
let board = Array(64).fill(null);

let turn = 'white';
// white king, white queen, black king, black queen
let castling = [1, 1, 1, 1];
// square that can be en passanted
let ep = NaN;
// when halfmoves == 100 game is a draw
let halfmoves = 0;
// current move
let move = 1;

let squareSelected = null;
let possibleMoves = [];
let legalMoves = [];
// contains pos and legal moves (for draws)
let posHistory = [];
// contians the other stuff that isnt for draws
let stateHistory = [];



const Game = {

    loadPositionFromFEN: (fen) => {
        for(let i = 0; i < board.length; i++) {
            board[i] = null;
        }

        let [setup, turn_, castling_, ep_, halfmoves_, move_] = fen.split(' ');

        const pieces = {
            'p': 'pawn', 'n': 'knight', 'b': 'bishop', 'r': 'rook', 'q': 'queen', 'k': 'king',
        }

        let file = 0;
        let rank = 0;
        for(let i = 0; i < setup.length; i++) {
            let char = setup[i];
            // if char is a digit
            if(+char) {
                file += +char;
            }
            // new line
            else if(char == '/') {
                file = 0;
                rank++;
            }
            // piece
            else {
                let color = char == char.toUpperCase() ? 'white' : 'black';
                let type = pieces[char.toLowerCase()];
                board[rank * 8 + file] = createPiece(type, color, rank * 8 + file); 
                file++;
            }
        }

        switch(turn_) {
            case 'w':
                turn = 'white';
                break;
            case 'b':
                turn = 'black';
                break;
        }
        
        for(let i = 0; i < castling.length; i++) {
            castling[i] = 0;
        }

        for(let i = 0; i < castling_.length; i++) {
            let char = castling_[i];
            switch(char) {
                case 'K':
                    castling[0] = 1;
                    break;
                case 'Q':
                    castling[1] = 1;
                    break;
                case 'k':
                    castling[2] = 1;
                    break;
                case 'q':
                    castling[3] = 1;
                    break;
            }
        }

        const fileMap = {
            'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5, 'g': 6, 'h': 7,
        }

        ep = fileMap[ep_[0]] + 8 * (8 - +ep_[1]);

        halfmoves = +halfmoves_;

        move = +move_;

        posHistory = [];
        stateHistory = [];
        
        Board.updateBoardPieces();
        loadDistancesFromEdge();
        Game.getLegalMoves(false);
    },

    // return a boolean for if the action results in a move
    selectSquare: (pos) => {
        // if a friendly piece is being selected
        if(board[pos]?.color == turn && HIGHLIGHT_MOVES) {
            let list = board[pos].getMoves().filter(a => Game.checkLegality(pos, a));
            Board.highlightList(list);
        }

        // if no square is selected or the selected square is empty
        if(squareSelected == null || board[squareSelected] == null) {
            squareSelected = pos;
            return false;
        }

        // if the move is legal
        if(Game.checkLegality(squareSelected, pos)) {
            Game.playMove(squareSelected, pos, false);
            squareSelected = null;
            return true;
        }

        // if the move is illegal
        squareSelected = pos;
        return false;
    },

    getLegalMoves: (test) => {
        let moves = [];
        for(let i = 0; i < 64; i++) {
            let piece = board[i];
            if(piece?.color != turn) {
                continue;
            }
            let possibleMoves = piece.getMoves();
            possibleMoves = possibleMoves.map(a => [piece.pos, a]);
            moves.push(...possibleMoves);
        }
        
        possibleMoves = moves;
        if(!test) {
            moves = moves.filter(a => Game.testMove(...a));
            moves = moves.map(a => `${a[0]}-${a[1]}`);
            legalMoves = moves;
        }
    },

    checkLegality: (start, end) => {
        if(legalMoves.includes(`${start}-${end}`)) {
            return true;
        }
        
        return false;
    },

    logState: () => {
        posHistory.push(`${JSON.stringify(board)}|${JSON.stringify(legalMoves)}`);
        stateHistory.push(`${JSON.stringify(turn)}|${JSON.stringify(castling)}|${JSON.stringify(ep)}|${halfmoves}|${move}|${JSON.stringify(possibleMoves)}`);
    },

    playMove: (start, end, test) => {
        if(FLIP_BOARD) {
            Board.flipBoard();
        }
        Game.logState();

        // king move
        let piece = board[start];
        if(piece.type == 'king') {
            if(piece.color == 'white') {
                castling[0] = 0;
                castling[1] = 0;
            }
            if(piece.color == 'black') {
                castling[2] = 0;
                castling[3] = 0;
            }
            
            // castling (kingside & queenside)
            if(end == start + 2 && Game.checkLegality(start, start + 1)) {
                board[start + 1] = board[start + 3];
                board[start + 1].pos = start + 1;
                board[start + 3] = null;
            }
            if(end == start - 2 && Game.checkLegality(start, start - 1)) {
                board[start - 1] = board[start - 4];
                board[start - 1].pos = start - 1;
                board[start - 4] = null;
            }
        }

        // rook move
        if(piece.type == 'rook') {
            if(start == 63) {
                castling[0] = 0;
            }
            if(start == 56) {
                castling[1] = 0;
            }
            if(start == 7) {
                castling[2] = 0;
            }
            if(start == 0) {
                castling[3] = 0;
            }
        }

        // pawn move
        let nextEP = NaN;
        if(piece.type == 'pawn') {
            // en passant checks + double move checks + promotion (todo)
            if(piece.color == 'white') {
                if(ep == end + 8) {
                    board[ep] = null;
                }

                if(end == start - 16) {
                    nextEP = end;
                }

                
            }
            if(piece.color == 'black') {
                if(ep == end - 8) {
                    board[ep] = null;
                }

                if(end == start + 16) {
                    nextEP = end;
                }
            }


            if(Math.floor(end / 8) == 0 || Math.floor(end / 8) == 7) {
                const askForPiece = () => {
                    let promotion = prompt('What piece do you want to promote to', 'queen');
                    if(promotion == 'knight' || promotion == 'bishop' || promotion == 'rook' || promotion == 'queen') {
                        let newPiece = createPiece(promotion, piece.color, end);
                        piece = newPiece;
                        return;
                    }
                    askForPiece();
                }
                askForPiece();
            }
        }

        // Important that this comes first for finding checkmate
        board[start] = null;
        halfmoves++;
        if(board[end] || piece.type == 'pawn') {
            halfmoves = 0;
        }
        move++;
        board[end] = piece;
        board[end].pos = end;

        turn = turn == 'white' ? 'black' : 'white';
        ep = nextEP;
        Game.getLegalMoves(test);
        if(!test) {
            let status = Game.evaluate();
            if(status == 1) {
                console.log(`${turn == 'white' ? 'black' : 'white'} wins!`);
            }
            if(status == 2) {
                console.log('It\'s a draw!');
            }
            Board.updateBoardPieces();
        }
    },

    unplayMove: () => {
        if(posHistory.length == 0) {
            return;
        }
        if(FLIP_BOARD) {
            Board.flipBoard();
        }
        let [lastPos, lastMoves] = posHistory.pop().split('|');
        let newBoard = JSON.parse(lastPos);
        for(let i = 0; i < newBoard.length; i++) {
            let piece = newBoard[i];
            let newPiece = createPiece(piece?.type, piece?.color, piece?.pos);
            board[i] = newPiece;
        }
        legalMoves = JSON.parse(lastMoves);

        let [turn_, castling_, ep_, halfmoves_, move_, possibleMoves_] = stateHistory.pop().split('|').map(a => JSON.parse(a));
        turn = turn_;
        castling = castling_;
        ep = ep_ == null ? NaN : ep_;
        halfmoves = halfmoves_;
        move = move_;
        possibleMoves = possibleMoves_;
        
        Board.updateBoardPieces();
        Board.unhighlightAll();
    },

    testMove: (start, end) => {
        if(TAKE_KING) {
            return true;
        }
        Game.playMove(start, end, true);
        for(let i = 0; i < possibleMoves.length; i++) {
            let end = possibleMoves[i][1];
            if(board[end]?.type == 'king') {
                Game.unplayMove();
                return false;
            }
        }
        Game.unplayMove();
        return true;
    },

    evaluate: () => {
        // 0: keep going, 1: checkmate, 2: draw

        // checkmate/stalemate
        if(legalMoves.length == 0) {
            let kingPos = board.findIndex(a => a?.type == 'king' && a?.color == turn);
            if(Game.testMove(kingPos, kingPos)) {
                return 2;
            }
            return 1;
        }

        // 50 move rule
        if(halfmoves >= 100) {
            return 2;
        }

        // threefold rep
        let currentPos = `${JSON.stringify(board)}|${JSON.stringify(legalMoves)}`;
        let copies = posHistory.filter(a => a == currentPos);
        if(copies.length >= 2) {
            return 2;
        }

        // insufficient material
        let pieces = board.filter(a => a).map(a => a.type).filter(a => a != 'king');
        if(pieces.length == 0) {
            return 2;
        }
        if(pieces.length == 1 && (pieces[0] == 'knight' || pieces[0] == 'bishop')) {
            return 2;
        }

        return 0;
    },
}