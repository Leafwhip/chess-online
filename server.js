const express = require('express');
const app = express();

const http = require('http');
const {Server} = require('socket.io');
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
})

app.get('/play', (req, res) => {
    console.log(req.params.id)
    res.sendFile(__dirname + '/public/play/index.html')
})

app.get('/play/:id', (req, res) => {
    res.sendFile(__dirname + '/public/play')
})

const queue = [];
  
io.on('connection', (socket) => {

    console.log('a user connected');

    socket.on('name', (username) => {
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
        if(queue.length >= 2) {
            let [p1, p2] = queue.splice(0, 2);
            socket.emit('match', {
                p1: p1,
                p2: p2,
                room: Math.floor(Math.random() * 1000000000)
            });
        }
    })

});

server.listen(3000, () => {
    console.log('connected');
});