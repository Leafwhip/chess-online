const startFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const testFEN = 'N7/8/8/8/5K1k/Q7/8/8 w - - 90 1';



function main() {
    document.body.addEventListener('click', Board.clickOutside);
    document.querySelector('#reset').addEventListener('click', () => {Game.loadPositionFromFEN(startFEN)});
    document.querySelector('#flip').addEventListener('click', Board.flipBoard);
    document.querySelector('#undo').addEventListener('click', Game.unplayMove);
    
    Board.createBoard();
    Game.loadPositionFromFEN(startFEN);
}
main();