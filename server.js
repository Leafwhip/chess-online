const express = require('express');
const app = express();

const path = require('path');
const http = require('http');
const {Server} = require('socket.io');
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
    let cookie = generateRandomString();
    res.set('Set-Cookie', 'id=' + cookie);
    addCookie(cookie);
    res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static(__dirname + '/public'));

app.get('/play/:id', (req, res) => {
    let roomId = req.params.id;
    if(!games[roomId]) {
        res.redirect('/');
    }
    res.sendFile(__dirname + '/public/play/online.html');
})

const validIds = new Set();
const queue = [];
const games = {};

function generateRandomString() {
    let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let str = '';
    for(let i = 0; i < 32; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}

function addCookie(cookie) {
    if(validIds.has(cookie)) {
        return false;
    }
    validIds.add(cookie);
    return true;
}
  
io.on('connection', (socket) => {

    console.log('a user connected with id', socket.id);

    socket.on('disconnect', () => {
        console.log('hi')
    })
    
    socket.on('name', (username) => {
        if(queue.find(obj => obj.id == socket.id)) {
            return;
        }

        let name = username.replace(/[^a-zA-Z0-9]/g, '');
        if(name != username) {
            socket.emit('nameError', 'Name can only contain letters or numbers');
            return;
        }
        if(name.length < 3) {
            socket.emit('nameError', 'Name must be at least 3 characters long');
            return;
        }
        if(name.length > 32) {
            socket.emit('nameError', 'Name cannot exceed 32 characters in length');
            return;
        }
        
        queue.push({name: username, id: socket.id});
        socket.emit('queued');

        if(queue.length >= 2) {
            let [p1, p2] = queue.splice(0, 2);
            let room = Math.floor(Math.random() * 1000000000);
            games[room] = {
                players: [p1, p2],
                game: new Game('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
            };
            console.log('Match created');
            io.emit('match', {
                players: [p1, p2],
                room: room
            });
        }
    });

    socket.on('ready', (pathname) => {
        if(!pathname || !games[pathname[0]]) {
            return;
        }
        let roomId = pathname[0];
        socket.join(roomId);
        let board = games[roomId].game.board;
        socket.emit('loadPos', board);
    });

    socket.on('clickoff', (pathname) => {
        if(!pathname || !games[pathname[0]]) {
            return;
        }
        let roomId = pathname[0];
        let game = games[roomId].game;
        let player = games[roomId].players.findIndex(a => a == socket.id);
        if(player == -1) {
            return;
        }
        game.squareSelected[player] = null;
    });

    socket.on('select', (pathname, pos) => {
        if(!pathname || !games[pathname[0]]) {
            return;
        }
        let roomId = pathname[0];
        let game = games[roomId].game;
        let player = games[roomId].players.findIndex(a => a == socket.id);
        if(player == -1) {
            return;
        }
        let list = game.selectSquare(pos, player);
        socket.emit('highlight', list);
    });

});



class Piece {
    constructor(color, pos) {
        this.color = color;
        this.pos = pos;
        this.type = '';
        this.points = 0;
    }

    getMoves(game) {
        return [];
    }
}

class Pawn extends Piece {
    constructor(color, pos) {
        super(color, pos);
        this.type = 'pawn';
        this.points = 1;
    }

    getMoves(game) {
        let moves = [];

        if(this.color == 'white') {
            if(!game.board[this.pos - 8]) {
                moves.push(this.pos - 8);
                if(Math.floor(this.pos / 8) == 6 && !game.board[this.pos - 16]) {
                    moves.push(this.pos - 16);
                }
            }

            if(game.board[this.pos - 9] && game.board[this.pos - 9].color != this.color) {
                moves.push(this.pos - 9);
            }
            if(game.board[this.pos - 7] && game.board[this.pos - 7].color != this.color) {
                moves.push(this.pos - 7);
            }

            if(game.ep == this.pos + 1) {
                moves.push(this.pos - 7);
            }
            if(game.ep == this.pos - 1)  {
                moves.push(this.pos - 9);
            }
        }

        if(this.color == 'black') {
            if(!game.board[this.pos + 8]) {
                moves.push(this.pos + 8);
                if(Math.floor(this.pos / 8) == 1 && !game.board[this.pos + 16]) {
                    moves.push(this.pos + 16);
                }
            }

            if(game.board[this.pos + 9] && game.board[this.pos + 9].color != this.color) {
                moves.push(this.pos + 9);
            }
            if(game.board[this.pos + 7] && game.board[this.pos + 7].color != this.color) {
                moves.push(this.pos + 7);
            }

            if(game.ep == this.pos + 1) {
                moves.push(this.pos + 9);
            }
            if(game.ep == this.pos - 1)  {
                moves.push(this.pos + 7);
            }
        }

        moves = moves.filter(a => a >= 0 && a < 64);
        return moves;
    }
}

class Knight extends Piece {
    constructor(color, pos) {
        super(color, pos);
        this.type = 'knight';
        this.points = 3;
    }

    getMoves(game) {
        // first 4 are left, last 4 are right
        let vList = [-17, -10, 6, 15, -15, -6, 10, 17];
        let moves = vList.map(a => this.pos + a);

        // filter out things that wrap
        for(let i = 0; i < 4; i++) {
            if(moves[i] % 8 > this.pos % 8) {
                // will be filtered
                moves[i] = -1;
            }
            
            if(moves[i + 4] % 8 < this.pos % 8) {
                moves[i + 4] = -1;
            }
        }
        moves = moves.filter(a => a >= 0 && a < 64);
        moves = moves.filter(a => game.board[a]?.color != this.color);
        return moves;
    }
}

class Bishop extends Piece {
    constructor(color, pos) {
        super(color, pos);
        this.type = 'bishop';
        this.points = 3;
    }

    getMoves(game) {
        let moves = game.checkLines(this, [0, 0, 0, 0, 1, 1, 1, 1]);
        return moves;
    }
}

class Rook extends Piece {
    constructor(color, pos) {
        super(color, pos);
        this.type = 'rook';
        this.points = 5;
    }

    getMoves(game) {
        let moves = game.checkLines(this, [1, 1, 1, 1, 0, 0, 0, 0]);
        return moves;
    }
}

class Queen extends Piece {
    constructor(color, pos) {
        super(color, pos);
        this.type = 'queen';
        this.points = 9;
    }

    getMoves(game) {
        let moves = game.checkLines(this, [1, 1, 1, 1, 1, 1, 1, 1]);
        return moves;
    }
}

class King extends Piece {
    constructor(color, pos) {
        super(color, pos);
        this.type = 'king';
        this.points = 1000;
    }

    getMoves(game) {
        // first 3 left, next 3 right, last 2 middle
        let vList = [-9, -1, 7, -7, 1, 9, -8, 8];
        let moves = vList.map(a => this.pos + a);

        // filter out things that wrap
        for(let i = 0; i < 3; i++) {
            if(moves[i] % 8 > this.pos % 8) {
                // will be filtered
                moves[i] = -1;
            }
            
            if(moves[i + 3] % 8 < this.pos % 8) {
                moves[i + 3] = -1;
            }
        }

        // castling
        // Note: if castling comes before the normal king moves, the check for legality later won't work (otherwise we'd have to test the move every time)
        if((this.color == 'white' ? game.castling[0] : game.castling[2]) && !game.board[this.pos + 1] && !game.board[this.pos + 2]) {
            moves.push(this.pos + 2);
        }
        if((this.color == 'white' ? game.castling[1] : game.castling[3]) && !game.board[this.pos - 1] && !game.board[this.pos - 2] && !game.board[this.pos - 3]) {
            moves.push(this.pos - 2);
        }
        
        
        moves = moves.filter(a => a >= 0 && a < 64);
        moves = moves.filter(a => game.board[a]?.color != this.color);
        return moves;
    }
}

class Game {
    constructor(fen=null) {
        this.board = Array(64).fill(null);
        // useless
        this.boardSimple = Array(64).fill(null);
        this.turn = 'white';
        this.castling = [1, 1, 1, 1];
        this.ep = NaN;
        this.halfmoves = 0;
        this.move = 1;
        this.squareSelected = [null, null];
        this.possibleMoves = [];
        this.legalMoves = [];
        this.posHistory = [];
        this.stateHistory = [];
        this.TAKE_KING = false;
        this.vectorMap = [-8, 1, 8, -1, -7, 9, 7, -9];
        this.distanceMap = Array(64);

        this.loadDistancesFromEdge();

        if(fen) {
            this.loadPositionFromFEN(fen);
        }
    }

    simplifyBoard = () => {
        for(let i = 0; i < this.board.length; i++) {
            if(this.board[i]) {
                this.boardSimple[i] = {
                    type: this.board[i].type,
                    color: this.board[i].color
                }
            }
        }
    }

    createPiece = (type, color, pos) => {
        let pieces = {
            'pawn': Pawn,
            'knight': Knight,
            'bishop': Bishop,
            'rook': Rook,
            'queen': Queen,
            'king': King,
        }
        if(!pieces[type]) {
            return null;
        }
        return new pieces[type](color, pos);
    }

    loadDistancesFromEdge = () => {
        for(let i = 0; i < 64; i++) {
            let leftEdge = i % 8;
            let rightEdge = 7 - leftEdge;
            let topEdge = Math.floor(i / 8);
            let bottomEdge = 7 - topEdge;
    
            // top, right, bottom, left, topright, bottomright, bottomleft, topleft
            this.distanceMap[i] = [
                topEdge,
                rightEdge,
                bottomEdge,
                leftEdge,
                Math.min(topEdge, rightEdge),
                Math.min(bottomEdge, rightEdge),
                Math.min(bottomEdge, leftEdge),
                Math.min(topEdge, leftEdge)
            ];
        } 
    }

    checkLines = (piece, vectors) => {
        let moves = [];
    
        for(let i = 0; i < vectors.length; i++) {
            let d = this.vectorMap[i];
            if(vectors[i] == 0 || d == 0) {
                continue;
            }
            
            for(let j = 0; j < this.distanceMap[piece.pos][i]; j++) {
                let newPos = piece.pos + (j + 1) * this.vectorMap[i];
                // if it is a piece
                if(this.board[newPos] != null) {
                    // if opposite color, add capture to movelist
                    if(this.board[newPos].color != piece.color) {
                        moves.push(newPos);
                    }
                    break;
                }
    
                moves.push(newPos);
            }
        }
    
        return moves;
    }
    
    loadPositionFromFEN = (fen) => {

        for(let i = 0; i < this.board.length; i++) {
            this.board[i] = null;
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
                this.board[rank * 8 + file] = this.createPiece(type, color, rank * 8 + file); 
                file++;
            }
        }

        switch(turn_) {
            case 'w':
                this.turn = 'white';
                break;
            case 'b':
                this.turn = 'black';
                break;
        }
        
        for(let i = 0; i < this.castling.length; i++) {
            this.castling[i] = 0;
        }

        for(let i = 0; i < castling_.length; i++) {
            let char = castling_[i];
            switch(char) {
                case 'K':
                    this.castling[0] = 1;
                    break;
                case 'Q':
                    this.castling[1] = 1;
                    break;
                case 'k':
                    this.castling[2] = 1;
                    break;
                case 'q':
                    this.castling[3] = 1;
                    break;
            }
        }

        const fileMap = {
            'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5, 'g': 6, 'h': 7,
        }

        this.ep = fileMap[ep_[0]] + 8 * (8 - +ep_[1]);

        this.halfmoves = +halfmoves_;

        this.move = +move_;
        

        this.getLegalMoves(false);
        this.simplifyBoard();
    }

    // return a boolean for if the action results in a move
    selectSquare = (pos, player) => {
        let list = [];
        // if a friendly piece is being selected
        if(this.board[pos]?.color == this.turn && this.HIGHLIGHT_MOVES) {
            list = this.board[pos].getMoves(this).filter(a => this.checkLegality(pos, a));
        }

        // if no square is selected or the selected square is empty
        if(this.squareSelected[player] == null || this.board[this.squareSelected[player]] == null) {
            this.squareSelected = pos;
            return [false, list];
        }

        // if the move is legal
        if(this.checkLegality(this.squareSelected[player], pos)) {
            this.playMove(this.squareSelected[player], pos, false);
            this.squareSelected[player] = null;
            return [true, list];
        }

        // if the move is illegal
        this.squareSelected[player] = pos;
        return false;
    }

    getLegalMoves = (test) => {
        let moves = [];
        for(let i = 0; i < 64; i++) {
            let piece = this.board[i];
            if(piece?.color != this.turn) {
                continue;
            }
            let possibleMoves = piece.getMoves(this);
            possibleMoves = possibleMoves.map(a => [piece.pos, a]);
            moves.push(...possibleMoves);
        }
        
        this.possibleMoves = moves;
        if(!test) {
            moves = moves.filter(a => this.testMove(...a));
            moves = moves.map(a => `${a[0]}-${a[1]}`);
            this.legalMoves = moves;
        }
    }

    checkLegality = (start, end) => {
        if(this.legalMoves.includes(`${start}-${end}`)) {
            return true;
        }
        
        return false;
    }

    logState = () => {
        this.posHistory.push(`${JSON.stringify(this.board)}|${JSON.stringify(this.legalMoves)}`);
        this.stateHistory.push(`${JSON.stringify(this.turn)}|${JSON.stringify(this.castling)}|${JSON.stringify(this.ep)}|${this.halfmoves}|${this.move}|${JSON.stringify(this.possibleMoves)}`);
    }

    playMove = (start, end, test) => {
        // flip board if FLIP_BOARD

        this.logState();

        // king move
        let piece = this.board[start];
        if(piece.type == 'king') {
            if(piece.color == 'white') {
                this.castling[0] = 0;
                this.castling[1] = 0;
            }
            if(piece.color == 'black') {
                this.castling[2] = 0;
                this.castling[3] = 0;
            }
            
            // castling (kingside & queenside)
            if(end == start + 2 && this.checkLegality(start, start + 1)) {
                this.board[start + 1] = this.board[start + 3];
                this.board[start + 1].pos = start + 1;
                this.board[start + 3] = null;
            }
            if(end == start - 2 && this.checkLegality(start, start - 1)) {
                this.board[start - 1] = board[start - 4];
                this.board[start - 1].pos = start - 1;
                this.board[start - 4] = null;
            }
        }

        // rook move
        if(piece.type == 'rook') {
            if(start == 63) {
                this.castling[0] = 0;
            }
            if(start == 56) {
                this.castling[1] = 0;
            }
            if(start == 7) {
                this.castling[2] = 0;
            }
            if(start == 0) {
                this.castling[3] = 0;
            }
        }

        // pawn move
        let nextEP = NaN;
        if(piece.type == 'pawn') {
            // en passant checks + double move checks + promotion 
            if(piece.color == 'white') {
                if(this.ep == end + 8) {
                    this.board[this.ep] = null;
                }

                if(end == start - 16) {
                    nextEP = end;
                }

                
            }
            if(piece.color == 'black') {
                if(this.ep == end - 8) {
                    this.board[this.ep] = null;
                }

                if(end == start + 16) {
                    nextEP = end;
                }
            }


            if(Math.floor(end / 8) == 0 || Math.floor(end / 8) == 7) {
                const askForPiece = () => {
                    let promotion = 'queen'; // prompt('What piece do you want to promote to', 'queen');
                    if(promotion == 'knight' || promotion == 'bishop' || promotion == 'rook' || promotion == 'queen') {
                        let newPiece = this.createPiece(promotion, piece.color, end);
                        piece = newPiece;
                        return;
                    }
                    askForPiece();
                }
                askForPiece();
            }
        }

        // Important that this comes first for finding checkmate
        this.board[start] = null;
        this.halfmoves++;
        if(this.board[end] || piece.type == 'pawn') {
            this.halfmoves = 0;
        }
        this.move++;
        this.board[end] = piece;
        this.board[end].pos = end;

        this.turn = this.turn == 'white' ? 'black' : 'white';
        this.ep = nextEP;
        this.getLegalMoves(test);
        if(!test) {
            let status = this.evaluate();
            if(status == 1) {
                // fix lol
                console.log(`${this.turn == 'white' ? 'black' : 'white'} wins!`);
            }
            if(status == 2) {
                console.log('It\'s a draw!');
            }
            // Board.updateBoardPieces();
        }
    }

    unplayMove = () => {
        if(this.posHistory.length == 0) {
            return;
        }
        // if(FLIP_BOARD) {
        //     Board.flipBoard();
        // }
        let [lastPos, lastMoves] = this.posHistory.pop().split('|');
        let newBoard = JSON.parse(lastPos);
        for(let i = 0; i < newBoard.length; i++) {
            let piece = newBoard[i];
            let newPiece = this.createPiece(piece?.type, piece?.color, piece?.pos);
            this.board[i] = newPiece;
        }
        this.legalMoves = JSON.parse(lastMoves);

        let [turn_, castling_, ep_, halfmoves_, move_, possibleMoves_] = this.stateHistory.pop().split('|').map(a => JSON.parse(a));
        this.turn = turn_;
        this.castling = castling_;
        this.ep = ep_ == null ? NaN : ep_;
        this.halfmoves = halfmoves_;
        this.move = move_;
        this.possibleMoves = possibleMoves_;
        
        // Board.updateBoardPieces();
        // Board.unhighlightAll();
    }

    testMove = (start, end) => {
        if(this.TAKE_KING) {
            return true;
        }
        this.playMove(start, end, true);
        for(let i = 0; i < this.possibleMoves.length; i++) {
            let end = this.possibleMoves[i][1];
            if(this.board[end]?.type == 'king') {
                this.unplayMove();
                return false;
            }
        }
        this.unplayMove();
        return true;
    }

    evaluate = () => {
        // 0: keep going, 1: checkmate, 2: draw

        // checkmate/stalemate
        if(this.legalMoves.length == 0) {
            let kingPos = this.board.findIndex(a => a?.type == 'king' && a?.color == this.turn);
            if(this.testMove(kingPos, kingPos)) {
                return 2;
            }
            return 1;
        }

        // 50 move rule
        if(this.halfmoves >= 100) {
            return 2;
        }

        // threefold rep
        let currentPos = `${JSON.stringify(this.board)}|${JSON.stringify(this.legalMoves)}`;
        let copies = this.posHistory.filter(a => a == currentPos);
        if(copies.length >= 2) {
            return 2;
        }

        // insufficient material
        let pieces = this.board.filter(a => a).map(a => a.type).filter(a => a != 'king');
        if(pieces.length == 0) {
            return 2;
        }
        if(pieces.length == 1 && (pieces[0] == 'knight' || pieces[0] == 'bishop')) {
            return 2;
        }

        return 0;
    }
}

server.listen(3000, () => {
    console.log('connected');
});