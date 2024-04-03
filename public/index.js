(() => {

const socket = io();
    
let findButton = document.getElementById('find');
let nameInput = document.getElementById('nameInput');
let error = document.getElementById('error');
let soloButton = document.getElementById('solo');

nameInput.addEventListener('input', () => {
    error.innerHTML = '';
});

findButton.addEventListener('click', () => {
    socket.emit('name', nameInput.value);
});

soloButton.addEventListener('click', () => {
    window.location = '/offline';
});


socket.on('nameError', (info) => {
    error.innerHTML = info;
});

socket.on('queued', () => {
    findButton.disabled = true;
});

socket.on('match', (game) => {
    if(game.players[0].id == socket.id || game.players[1].id == socket.id) {
        window.location = `/play/${game.room}`;
    }
});

})();