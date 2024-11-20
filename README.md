# Distributed Systems 2024, group 16

We want to implement a simple multiplayer game.
It uses P2P communication between the clients.

## Team Members
* Gesche Redlich @gescheredlichj
* Oona Rauhala @oonarauhala
* Riku Mattila @rikumat
* Sami Saada @samitheberber
* Christoph Spitzer @spitzerUH


## Description

2-Dimensional game, where players can move vertically and horizontally to collect points and to gain advantage. The game is played in rooms of 2-8 players. A new room can be created by anyone, and anyone can create a room which is identified with a code. These codes are maintained in a public server, where other players can either join a random room, or use a code to join a specific room.  The states of all players are updated by regular intervals, and all players move one coordinate vertically or horizontally every time the room updates. The game is synchronized among players, meaning that the movement of all players is updated at the same time.

## Overview

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

The role for the server is purely signaling purpose.
Server provides websocket communication for the clients.

aiohttp provides HTTP server that is used to initialize the websocket connection.
Socket.IO provides the websocket connectivity and simple interface for events.
These events happen when clients send websocket messages.
The nature of websocket means that server needs to send the messages forward or react otherwise.

We can implement the server using simple message structure or tackle in callbacks.
This is something that will set the message content by removing some of the redundancy.

The main point is to keep the server light and simple and concentrate more on the client.

In the case of specific game rooms, server uses websocket rooms as the base.
Sessions can be used to to remember client specific room to reduce the need to include it in messages.

## Game clients

Clients initialize the communication using websockets to form a peer-to-peer communication implemented with WebRTC.

Game clients are browser based implemented by using JavaScript.
Socket.IO provides websocket functionality also for client.
WebRTC is implemented by the browsers and we use its datastream functionality to communicate between the clients.
This covers the main functionalities for the communication section of the clients.

Our plan is to demonstrate the usage of communication by using it to share game states between client in multiplayer environment.
Each client runs an instance of the game and share the state by sending messages.

Client can list all existing game rooms and create/join/leave one room.

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

General game related message:
```json
{
    "type": "game",
    "data": "relevant game data"
}
```
This can be coordinates or other game state.

---

We need message to handle the leader election:
```json
{
    "type": "election",
    "data": "election action"
}
```
Election action could from bully algorithm `election`, `ok` and `coordinator`.

---

## Possible problems
* how to deal with bad/good internet connection of the different clients? -> Data consistency issues
* Leader election
* Order of messages

## How to develop

All the commands are made to be run at project root.
Necessary environment variables are in `.env` which is loaded automatically.

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
