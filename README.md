# Distributed Systems 2024, group 16

The topic of the project is 2-Dimensional arcade multiplayer game, where players try to compete against each other.
The game communication is made using WebRTC, WebSockets and browser technologies.

## Team Members
* Gesche Redlich @gescheredlichj
* Oona Rauhala @oonarauhala
* Riku Mattila @rikumat
* Sami Saada @samitheberber
* Christoph Spitzer @spitzerUH

## Overview

Player opens the game with modern web browser.
On the main menu player can enter an existing room code or create new room.
The game starts to run the moment the first player joins the room.
Other player can join the game session at any time.
Because the game runs purely on the client side, the session ends when last one leaves the room.

The rooms or game sessions are mainly a way to decide who the server will broadcast messages when new clients want to connect.
They are only alive when there is a client connected in a game session.
First one creates one, last one destroys it.

There are two options for the game session that are discussed.
First one is that the game will go live the moment the session is created.
Second one is that players can send ready signal to start the game.
There will be observer mode so in either case new clients can join the room at any point.

2-Dimensional game, where players can move vertically and horizontally to collect points and to gain advantage.
The game is played in rooms of 2-8 players.
A new room can be created by anyone, and anyone can create a room which is identified with a code.
These codes are maintained in a public server, where other players can either join a random room, or use a code to join a specific room.
The states of all players are updated by regular intervals, and all players move one coordinate vertically or horizontally every time the room updates.
The game is synchronized among players, meaning that the movement of all players is updated at the same time.

The game is played using a browser, where the main computation is also done.
Game clients connect with each other using WebRTC connections and use its datastream functionality to communicate.
To form the peer-to-peer connection, a signaling server is used.
The signaling server is implemented in Python.
The client is implemented in JavaScript. Socket.io is used to provide the websocket functionality, both in server and client side.
HTTP is used as middleware for websocket connection, it is implemented with aiohttp.
The server is fully asyncronous to fit the theme of the course better.
The actual game client is to be determined later.
There will be different nodes represented by coordinates on a twodimensional space.
Each node will be able to move across the space.
We would like to implement a "snake"-like game, where there is some kind of reward on the space and the players/nodes want to get there first.
If they crash they die.
We are unsure if we will be able to implement all of these game specific ideas as we will first focus on the distributed system in itself.

![Distributed-System-First-Draft](https://github.com/user-attachments/assets/f672382a-1d7a-40f7-b9f9-a565cf85619f)

## Signaling server

The role for the server is purely signaling purpose and it provides the initial WebSocket communication for the clients to send signaling data.

The server is written with Python and uses few libraries that provide the technical implementation for the different communication channels.
aiohttp provides HTTP server that provides means to form the WebSocket communication.
Socket.IO provides WebSocket implementation and also a simple interface for the events initiated by the clients.
The server makes sure that the WebSocket messages are delivered to correct participants.
There are other alternative methods for signaling data delivery, but WebSockets fit well with the rest of the stack.

The server uses asyncronous version of library functions, but the current server functionality is running it syncronously due lack of need for concurrency.
The events that transfer data from client to client are one directional for sake of simplicity.
The main point is to keep the server light and simple so the focus stays on the client side.

Only extra functionality for the server beside the signaling is room management.
Rooms are implemented by using room functionality from Socket.IO.
They act like multicast groups and this project use them as game lobbies.

## Game clients

Game client runs purely in a web browser with keyboard controls as a focus.

WebSockets provide the initial communication channel between the clients via signaling server.
It is implemented with Socket.IO JavaScript library.
WebRTC is used to form the peer-to-peer connection between the clients and then WebRTC's DataStream will deliver the actual messages between the clients.

The game part of the client is made with Phaser game engine.
There lots of plugin for it and RexUI is used to create the UI.

Player can create a room or join existing one.
Everytime a new client joins a room, connections between it and existing clients are formed.

Our plan is to demonstrate the usage of communication by using it to share game states between client in multiplayer environment.
Each client runs an instance of the game and share the state by sending messages.

We have at least two types of the clients, a regular client running the information and an elected leader client for special cases.
One of the nodes will be selected as leader node to resolve possible conflicts.
Leader selection could be based on the game score.

We might also have third client type for observation.
This could be handy to showcase the game state in the demo situation.

## Message types

### Websocket, general

* Default Socket.io messages
    * `connect` is sent when client connects to the server
    * `disconnect` is sent when client disconnects from the server
    * `connect_error` is sent when connection fails
---

Client emits `room-enter` message to enter a specific game room:
```json
{
    "room_code": "code"
}
```
Room code can be empty or any alphanumeric string.
New room will be created if leaved empty or non-matching existing room found.
Server will send response message with active room code:
```json
{
    "room_code": "code"
}
```

---

Client emits `room-exit` message to leave a room:
```json
{
    "room_code": "code"
}
```

---

Server emits `room-joined` message when a new client joins a room:
```json
{
    "session_id": "session id"
}
```
Session id is for temporary use for websocket to identify the clients for direct messaging.

---

### Websocket, WebRTC related

Client needs to send other clients an offer to describe the connection.
It emits `webrtc-offer` message type with following payload:
```json
{
    "to": "session id",
    "data":{
        "type":"offer",
        "sdp":"sdpdata..."
    }
}
```
Server will transform the message with new payload:
```json
{
    "from": "session id",
    "data":{
        "type":"offer",
        "sdp":"sdpdata..."
    }
}
```

---

Client responds and Offer with Answer.
It emits `webrtc-answer` message type with following payload:
```json
{
    "to": "session id",
    "data":{
        "type":"answer",
        "sdp":"sdpdata..."
    }
}
```
Server will transform the message with new payload:
```json
{
    "from": "session id",
    "data":{
        "type":"answer",
        "sdp":"sdpdata..."
    }
}
```

---

The peer-to-peer connection needs ICE candidate to determine how the communication is formed.
It emits `webrtc-candidate` message type with following payload:
```json
{
    "to": "session id",
    "data":{
        "type":"candidate",
        "candidate":{
            "candidate":"candidate:...",
            "sdpMLineIndex":0,
            "sdpMid":"0",
            "usernameFragment":"None"
        }
    }
}
```
Server will transform the message with new payload:
```json
{
    "from": "session id",
    "data":{
        "type":"candidate",
        "candidate":{
            "candidate":"candidate:...",
            "sdpMLineIndex":0,
            "sdpMid":"0",
            "usernameFragment":"None"
        }
    }
}
```

---

Notice: `to` and `from` fields are required for the client to identify with who the connection is formed.
It is also for the server to be able to send a private message to correct target.

### WebRTC data stream

Datastream messages are all sent with same channel, only the payload will be different.

---

Player movement message:
```json
{
    "moving": "direction"
}
```
`direction` can be `left`, `right`, `up` or `down`.

---

## Possible problems
* how to deal with bad/good internet connection of the different clients? -> Data consistency issues
* Leader election
* Order of messages

## How to develop

All the commands are made to be run at project root.
Necessary environment variables are in `.env.development` and `.env.production` which are loaded automatically.

### Spin up the server

Python is required and [pyenv](https://github.com/pyenv/pyenv) is one way to manage it.
This guide assumes that you have pyenv installed:
```bash
$ pyenv install 3.13:latest
$ pyenv virtualenv 3.13 distributed_systems
```
Remember to activate the virtualenv in any terminal at first:
```bash
$ pyenv activate distributed_systems
```
Install python dependecies:
```bash
$ pip install -r requirements.txt
```
Start the server:
```bash
$ python signaling/server.py
```
By default server runs in localhost port 9999 or when specified `SIGNALING_SERVER_PORT`.

### Spin up the client

Node.js is required, so best is to install it with [nvm](https://github.com/nvm-sh/nvm) by running `nvm install --lts`. After that we need [yarn](https://yarnpkg.com) and current way to install it and project dependencies is:
```bash
$ nvm use --lts
$ corepack enable
$ yarn
```
When installation is complete, the client development server can be started by running `yarn start` and opening `http://localhost:1234` in your browser.
Firefox or Chrome has good inspection tools to run the commands.

### Building the client files

Client will contain only static files, which are built by running `yarn build`, this will create necessary files under `dist/` directory.

### VisualStudio code

Some extensions recommended:
```
carlosjs23.vscode-yarn-script
donjayamanne.python-environment-manager
editorconfig.editorconfig
gamunu.vscode-yarn
ms-python.debugpy
ms-python.python
AkshayJangir.phaserjs
```
After those are installed, just press `F5` and it will run the development environment for you.
There should be no need to manually restart the server or client processes, because they are set up to auto-reload after file changes.
