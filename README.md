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
The can be multiple rooms at the same time, but client can join only one at the time.

There are two options for the game session that are discussed.
First one is that the game will go live the moment the session is created.
Second one is that players can send ready signal to start the game.
There will be observer mode so in either case new clients can join the room at any point.

The game uses two type of communication methods.
Client forms a Web Socket connection with the server.
Clients interconnect using WebRTC connection.
Server is signaling the data for clients to form their connection.

Each game client aka nodes will simulate the game logic and communicate its state.
Node will perform various actions that will constantly affect not only its state, but others too.
Node has movement and collision information it needs to syncronize with others.
Node sends occasionally some other information related to the game.

Behind the scene nodes are also communicating other than game related information.
These are part of various algorithms related to distributed systems.

The actual game is 2-Dimensional arcade game where each player is presented as a snake like character.
Player will instruct their characters to move around the game area and collect points.
When eating the points, the characters will grow in size.
This will give them advantage over other players, because if character collides with other characters body, it will perish.
The movement happens in x or y axis at one time.
This means that player location is represented as (x,y) coordinate and single direction command.

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

Client has option to join as observer just to view the game instead of actively participating.

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

Player identification:
```json
{
    "platform": "game",
    "data": {
        "type": "whoami",
        "data": {
            "name": "Player name",
            "color": "color code",
            "observer": "is observing",
            "spawnpoint": {
                "x": "x",
                "y": "y"
            }
        }
    }
}
```

---

Player status:
```json
{
    "platform": "game",
    "data": {
        "type": "status",
        "data": {
            "status": "status value"
        }
    }
}
```
Possible values for `status` are `alive` or `dead`.

---

Player movement message:
```json
{
    "platform": "game",
    "data": {
        "type": "move",
        "data": {
            "direction": "direction value"
        }
    }
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

## Production

Server is running in [Fly.io](https://fly.io) and deployed by running `fly deploy`.
The service uses typical `Procfile` setup with own configuration file `fly.toml`.
Deploying there takes advantage of docker images and dynamic machine creation.
Only the required files are included, which is defined in `.dockerignore`-file.

Currently the client files are hosted in [Cloudflare Pages](https://pages.cloudflare.com) and are manually uploaded there.
Usually NAT adds challenges to this type of connections so we have defined list of [STUN](https://en.wikipedia.org/wiki/STUN) and [TURN](https://en.wikipedia.org/wiki/Traversal_Using_Relays_around_NAT) servers.
At first a list of Google STUN servers were used, but they didn't work in most of cases.
Current working list of servers are from [TURN/STUN Server by Metered](https://www.metered.ca/stun-turn).
Their free plan is suitable enough so hosting own TURN-server isn't necessary for the project.
