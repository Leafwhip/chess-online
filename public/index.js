(() => {

const socket = io();
    
let findButton = document.getElementById('find');
let nameInput = document.getElementById('nameInput');
let errorLog = document.getElementById('error');
let soloButton = document.getElementById('solo');
let hyperButton = document.getElementById('time-hyper');
let bulletButton = document.getElementById('time-bullet');
let blitzButton = document.getElementById('time-blitz');
let rapidButton = document.getElementById('time-rapid');
let unlimitedButton = document.getElementById('time-unlimited');
let roomCodeInput = document.getElementById('room-code');
let joinRoomButton = document.getElementById('join-room');


let timeControl = 'Unlimited';

nameInput.addEventListener('input', () => {
    error.innerHTML = '';
});

findButton.addEventListener('click', () => {
    socket.emit('name', nameInput.value, timeControl);
});

soloButton.addEventListener('click', () => {
    window.location = '/offline';
});

hyperButton.addEventListener('click', () => {
    timeControl = '30|0';
    hyperButton.disabled = true;
    bulletButton.disabled = false;
    blitzButton.disabled = false;
    rapidButton.disabled = false;
    unlimitedButton.disabled = false;
});

bulletButton.addEventListener('click', () => {
    timeControl = '1|1';
    hyperButton.disabled = false;
    bulletButton.disabled = true;
    blitzButton.disabled = false;
    rapidButton.disabled = false;
    unlimitedButton.disabled = false;
});

blitzButton.addEventListener('click', () => {
    timeControl = '3|2';
    hyperButton.disabled = false;
    bulletButton.disabled = false;
    blitzButton.disabled = true;
    rapidButton.disabled = false;
    unlimitedButton.disabled = false;
});

rapidButton.addEventListener('click', () => {
    timeControl = '10|5';
    hyperButton.disabled = false;
    bulletButton.disabled = false;
    blitzButton.disabled = false;
    rapidButton.disabled = true;
    unlimitedButton.disabled = false;
});

unlimitedButton.addEventListener('click', () => {
    timeControl = 'Unlimited';
    hyperButton.disabled = false;
    bulletButton.disabled = false;
    blitzButton.disabled = false;
    rapidButton.disabled = false;
    unlimitedButton.disabled = true;
});

joinRoomButton.addEventListener('click', () => {
    let roomCode = roomCodeInput.value;
    socket.emit('name', nameInput.value, timeControl, roomCode);
});

socket.on('nameError', (info) => {
    errorLog.innerHTML = info;
});

socket.on('queued', () => {
    findButton.disabled = true;
    joinRoomButton.disabled = true;
    roomCodeInput.disabled = true;
});

socket.on('match', (game) => {
    if(game.players[0].id == socket.playerId || game.players[1].id == socket.playerId) {
        window.location = `/play/${game.room}`;
    }
});

socket.on('id', (id) => {
    sessionStorage.playerId = id;
    socket.playerId = id;
});


if(!sessionStorage.playerId) {
    socket.emit('requestId');
}
else {
    socket.playerId = sessionStorage.playerId;
    socket.emit('setId', sessionStorage.playerId);
}

})();