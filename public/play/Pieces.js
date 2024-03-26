// top, right, bottom, left, topright, bottomright, bottomleft, topleft
const vectorMap = [-8, 1, 8, -1, -7, 9, 7, -9];

const distanceMap = Array(64);

function loadDistancesFromEdge() {
    for(let i = 0; i < 64; i++) {
        let leftEdge = i % 8;
        let rightEdge = 7 - leftEdge;
        let topEdge = Math.floor(i / 8);
        let bottomEdge = 7 - topEdge;

        // top, right, bottom, left, topright, bottomright, bottomleft, topleft
        distanceMap[i] = [
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

function createPiece(type, color, pos) {
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

function checkLines(piece, vectors) {
    let moves = [];

    for(let i = 0; i < vectors.length; i++) {
        let d = vectorMap[i];
        if(vectors[i] == 0 || d == 0) {
            continue;
        }
        
        for(let j = 0; j < distanceMap[piece.pos][i]; j++) {
            let newPos = piece.pos + (j + 1) * vectorMap[i];
            // if it is a piece
            if(board[newPos] != null) {
                // if opposite color, add capture to movelist
                if(board[newPos].color != piece.color) {
                    moves.push(newPos);
                }
                break;
            }

            moves.push(newPos);
        }
    }

    return moves;
}

class Piece {
    constructor(color, pos) {
        this.color = color;
        this.pos = pos;
        this.type = '';
        this.points = 0;
    }

    getMoves() {
        return [];
    }
}

class Pawn extends Piece {
    constructor(color, pos) {
        super(color, pos);
        this.type = 'pawn';
        this.points = 1;
    }

    getMoves() {
        let moves = [];

        if(this.color == 'white') {
            if(!board[this.pos - 8]) {
                moves.push(this.pos - 8);
                if(Math.floor(this.pos / 8) == 6 && !board[this.pos - 16]) {
                    moves.push(this.pos - 16);
                }
            }

            if(board[this.pos - 9] && board[this.pos - 9].color != this.color) {
                moves.push(this.pos - 9);
            }
            if(board[this.pos - 7] && board[this.pos - 7].color != this.color) {
                moves.push(this.pos - 7);
            }

            if(ep == this.pos + 1) {
                moves.push(this.pos - 7);
            }
            if(ep == this.pos - 1)  {
                moves.push(this.pos - 9);
            }
        }

        if(this.color == 'black') {
            if(!board[this.pos + 8]) {
                moves.push(this.pos + 8);
                if(Math.floor(this.pos / 8) == 1 && !board[this.pos + 16]) {
                    moves.push(this.pos + 16);
                }
            }

            if(board[this.pos + 9] && board[this.pos + 9].color != this.color) {
                moves.push(this.pos + 9);
            }
            if(board[this.pos + 7] && board[this.pos + 7].color != this.color) {
                moves.push(this.pos + 7);
            }

            if(ep == this.pos + 1) {
                moves.push(this.pos + 9);
            }
            if(ep == this.pos - 1)  {
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

    getMoves() {
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
        moves = moves.filter(a => board[a]?.color != this.color);
        return moves;
    }
}

class Bishop extends Piece {
    constructor(color, pos) {
        super(color, pos);
        this.type = 'bishop';
        this.points = 3;
    }

    getMoves() {
        let moves = checkLines(this, [0, 0, 0, 0, 1, 1, 1, 1]);
        return moves;
    }
}

class Rook extends Piece {
    constructor(color, pos) {
        super(color, pos);
        this.type = 'rook';
        this.points = 5;
    }

    getMoves() {
        let moves = checkLines(this, [1, 1, 1, 1, 0, 0, 0, 0]);
        return moves;
    }
}

class Queen extends Piece {
    constructor(color, pos) {
        super(color, pos);
        this.type = 'queen';
        this.points = 9;
    }

    getMoves() {
        let moves = checkLines(this, [1, 1, 1, 1, 1, 1, 1, 1]);
        return moves;
    }
}

class King extends Piece {
    constructor(color, pos) {
        super(color, pos);
        this.type = 'king';
        this.points = 1000;
    }

    getMoves() {
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
        if((this.color == 'white' ? castling[0] : castling[2]) && !board[this.pos + 1] && !board[this.pos + 2]) {
            moves.push(this.pos + 2);
        }
        if((this.color == 'white' ? castling[1] : castling[3]) && !board[this.pos - 1] && !board[this.pos - 2] && !board[this.pos - 3]) {
            moves.push(this.pos - 2);
        }
        
        
        moves = moves.filter(a => a >= 0 && a < 64);
        moves = moves.filter(a => board[a]?.color != this.color);
        return moves;
    }
}