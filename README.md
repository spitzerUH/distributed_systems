# Distributed Systems 2024, group 16

The topic of the project is a 2-Dimensional arcade multiplayer game, where players try to compete against each other. The game communication is made using WebRTC, WebSockets and browser technologies. 

## Team Members
* Gesche Redlich @gescheredlichj
* Oona Rauhala @oonarauhala
* Riku Mattila @rikumat
* Sami Saada @samitheberber
* Christoph Spitzer @spitzerUH

## Overview

Player opens the game with modern web browser. On the main menu, a player can enter an existing room code or create a new room. The game starts to run the moment the first player joins the room. Other players can join the game session at any time. As soon as a second player joins, the game has a purpose and “food” will appear. Because the game runs purely on the client side, the session ends when the last one leaves the room. 

The rooms or game sessions are mainly a way to decide who the server will broadcast messages to when new clients want to connect. They are only alive when there is a client connected in a game session. The first one creates one, the last one destroys it. There can be multiple rooms at the same time, but clients can join only one at the time. 

There are two shared states for the game session that we have been discussing. The first one is that the game will go live the moment the session is created. The second one is that players can send a “ready” signal to start the game. There will be an observer mode so in either case new clients can join the room at any point. The latest version of the game now does not give the player the opportunity to start the game, it just starts when a second player joins the game room. 

The game uses two types of communication methods. Client forms a Web Socket connection with the server. Clients interconnect using WebRTC connection. Server is signaling the data for clients to form their connection. 

Each game client aka nodes will simulate the game logic and communicate its state. Node will perform various actions that will constantly affect not only its state, but others too. Node has movement and collision information it needs to synchronize with others. Node sends occasionally some other information related to the game. 

Behind the scenes nodes are also communicating other than game related information. These are part of various algorithms related to distributed systems. 

The actual game is a 2-Dimensional arcade game where each player is presented as a circle (initially we planned to create a snake-like player). Players will instruct their characters to move around the game area and collect points. The initial idea, as stated on the design plan, was that when eating the points, the characters will grow in size. This would give them an advantage over other players, because if a character collides with other characters' body, it will perish. The movement happens in x or y axis at one time. This means that player location is represented as (x,y) coordinate and single direction command. However, we didn’t finish that feature, as we focused more on the distributed system itself. Now, players can eat the food, but it doesn’t give them any advantage. When they collide with another player in any way, they die.  

As this is a simple peer-to-peer application, it has many possibilities in terms of further development. As we mentioned, we didn’t finish all the features we initially thought of. Meaning: There are endless possibilities that can be added as well as different game modes or other peer-to-peer applications.  

![Distributed-System-First-Draft](https://github.com/user-attachments/assets/f672382a-1d7a-40f7-b9f9-a565cf85619f)

## Distributed Features 

### Shared State 

Nodes do not persist information of past events. 

### Synchronization and consistency  

We implemented vector clocks for message causality. Each message includes a copy of the sender’s clock, which the receiver will compare to its own. If causality was not broken, the message is consumed immediately. If not, it will be placed in a queue to be consumed later. The queue is implemented as in-memory, which gives good access time, but is easily lost. In this case it is acceptable to lose the queue if a node crashes. 

### Consensus 

Nodes share consensus on the game room leader. This is implemented with RAFT leader election. 

### Naming and node discovery 

Nodes will randomly assign themselves an UUID, which is sent to other nodes when joining a game. Players can also choose a name to be displayed to other players. Game rooms are also named. Users can join a room with any name. After joining a room, nodes begin to receive messages from other nodes in the room.  

Nodes discover each other with the help of the signaling server. More information in section “Signaling Server”. 

### Fault tolerance 

Node failure is acceptable in this game. In normal operation, when a node wishes to exit a game, it will send a disconnect message (e.g. reloading the page). Currently closing the page will result in a player exiting the game without other players knowing, thus the player will still appear in the game.  

### Scalability 

Game rooms have no upper limit on the number of players. Multicast communication will have limits at some point. 

The signaling server can also become overwhelmed by the number of clients. A multi-server signaling cluster. In this case, load balancing etc. would be needed. 

## Signaling server

The role for the server is purely signaling purpose and it provides the initial WebSocket communication for the clients to send signaling data. 

The server is written with Python and uses a few libraries that provide the technical implementation for the different communication channels. aiohttp provides HTTP server that provides means to form the WebSocket communication. Socket.IO provides WebSocket implementation and also a simple interface for the events initiated by the clients. The server makes sure that the WebSocket messages are delivered to correct participants. There are other alternative methods for signaling data delivery, but WebSockets fit well with the rest of the stack. 

The server uses asynchronous version of library functions, but the current server functionality is running it synchronously due to lack of need for concurrency. The events that transfer data from client to client are one directional for sake of simplicity. The main point is to keep the server light and simple, so the focus stays on the client side. 

The only extra functionality for the server besides the signaling is room management. Rooms are implemented by using room functionality from Socket.IO. They act like multicast groups and this project uses them as game lobbies. 

## Game clients

Game client runs purely in a web browser with keyboard controls as a focus. 

WebSockets provide the initial communication channel between the clients via signaling server. It is implemented with Socket.IO JavaScript library. WebRTC is used to form the peer-to-peer connection between the clients and then WebRTC's DataStream will deliver the actual messages between the clients. 

The game part of the client is made with Phaser game engine. There are lots of plugins for it and RexUI is used to create the UI. 

Players can create a room or join an existing one. Every time a new client joins a room, connections between it and existing clients are formed. 

Our plan is to demonstrate the usage of communication by using it to share game states between clients in multiplayer environment. Each client runs an instance of the game and shares the state by sending messages. 

We have two types of clients, a regular client running the information and an elected leader client for special cases. One of the nodes will be selected as the leader node to resolve possible conflicts.  

Client has option to join as observer just to view the game instead of actively participating. 

## Leader selection 

When a client has joined the game room, we wait for a second one to join before starting the game. When this happens, we also must decide who the leader is as the leader takes care of the foot creation and positioning. The leader selection is part of the RAFT algorithm we implemented.  

Every participant in the RAFT algorithm has three different states: Follower (state=0), candidate (state=1) and leader (state=2). First when the user joins it is a follower and listens if there is any leader. After a random set timeout (100-500ms) the follower assumes there is no leader and starts an election. When the client is doing that, it changes to candidate. The candidate is then sending an election request to the game participants in the game room and the clients who are still followers change to candidate and receive the request and vote for the first candidate from whom they received a request. When there is an election request similarly, the candidate sends a negative vote. The candidate who sent the election request and got more than 50% of the votes is then the leader and switches to state 2.  

The leader then sends frequent notification to all participants. After the candidates or followers receive a leader notification, they restart the election timeout (the timeout before they start another election request). This way if the leader has connection issues or disconnects another leader gets elected. 

The leader handles just the foot positioning for now. There is no explicit log for now it takes care of. This would be for future features. Also, taking care of not responding to candidates could be a task of the leader so all remaining clients will know about a player disconnected unexpectedly. 

## Message types

### Websocket, general

* Default Socket.io messages
    * `connect` is sent when client connects to the server
    * `disconnect` is sent when client disconnects from the server
    * `connect_error` is sent when connection fails

Socket.io generates unique id for each web socket connection and it included with some messages using `sid`.

---

Client emits `room-enter` message to enter a specific game room:
```json
{
    "method": "ws",
    "clock": {
        "id": "value",
        "id2": "value2"
        ...
    },
    "data": {
        "uuid": "unique identifier",
        "room_code": "code"
    }
}
```
Room code can be empty or any alphanumeric string.
In case of empty string, server uses room code `default`.
Server will send response message with active room code:
```json
{
    "method": "ws",
    "clock": {
        "id": "value",
        "id2": "value2"
        ...
    },
    "data": {
        "sid": "sid",
        "uuid": "unique identifier",
        "room_code": "code"
    }
}
```

---

Client emits `room-exit` message to leave a room:
```json
{
    "method": "ws",
    "clock": {
        "id": "value",
        "id2": "value2"
        ...
    },
    "data": {
        "room_code": "code"
    }
}
```
Server responses with similar message, but includes socket id:
```json
{
    "method": "ws",
    "clock": {
        "id": "value",
        "id2": "value2"
        ...
    },
    "data": {
        "sid": "sid",
        "room_code": "code"
    }
}
```

---

Server emits `room-joined` message when a new client joins a room:
```json
{
    "method": "ws",
    "clock": {
        "id": "value",
        "id2": "value2"
        ...
    },
    "data": {
        "sid": "sid",
        "uuid": "unique identifier",
        "room_code": "code"
    }
}
```

---

Server emits `room-left` message when a a client leaves a room:
```json
{
    "method": "ws",
    "clock": {
        "id": "value",
        "id2": "value2"
        ...
    },
    "data": {
        "sid": "sid",
        "room_code": "code"
    }
}
```

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
    "data": {
        "platform": "game",
        "type": "whoami",
        "data": {
            "name": "Player name",
            "color": "color code",
            "observer": "is observing",
            "status": "status",
            "spawnpoint": ...
        }
    }
}
```
Field for `spawnpoint` is either `undefined` or `{"x": "x", "y": "y"}`.

---

Player status:
```json
{
    "data": {
        "platform": "game",
        "type": "status",
        "data": {
            "status": "status value",
            "spawnpoint": {
                "x": "x",
                "y": "y"
            }
        }
    }
}
```
Possible values for `status` are `alive` or `dead`.

---

There is couple food related messages divided in subtypes.

Creating food, single or multiple at once:
```json
{
    "data": {
        "platform": "game",
        "type": "food",
        "subtype": "create",
        "data": [
            {
                "id": "id number",
                "details": {
                    "x": "x",
                    "y": "y",
                    "size": "size",
                    "color": "color code"
                }
            },
            ...
        ]
    }
}
```

Eating food:
```json
{
    "data": {
        "platform": "game",
        "type": "food",
        "subtype": "eat",
        "id": "id"
    }
}
```

---

Player movement message:
```json
{
    "data": {
        "platform": "game",
        "type": "move",
        "data": {
            "direction": "direction value"
        }
    }
}
```
`direction` can be `left`, `right`, `up` or `down`.

---

For the RAFT leader selection we introduced some more messages:

Election request every 100-500ms:
```json
{
    "data": {
        "platform": "raft",
        "type": "raft-election-request",
        "data": {
            "requestFrom": "uuid",
            "term": 1
        }
    }
}
```

Election vote:
```json
{
    "data": {
        "platform": "raft",
        "type": "raft-election-vote",
        "data": {
            "voteFor": "uuid",
            "term": 1
        }
    }
}
```

Leader notification every 100ms:
```json
{
    "data": {
        "platform": "raft",
        "type": "raft-election-leader",
        "data": {
            "currentLeader": "uuid",
            "term": 1
        }
    }
}
```
## Vector clocks
* Causality guaranteed with vector clocks
* Each game message includes a clock from the sender
* Each received clock is compared with client's own clock. Message is consumed if causality is not broken
* Message is queued if causality is broken
* Queue is read every time a message arrives
* Current implementation assumes no messages are lost
* Queue is kept in memory: gets lost easily but is fast to access


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

### Preview

A preview of the game can be found at: 
https://preview.ds2024-g16-csh.pages.dev/

Have fun!

### Details

Server is running in [Fly.io](https://fly.io) and deployed by running `fly deploy`.
The service uses typical `Procfile` setup with own configuration file `fly.toml`.
Deploying there takes advantage of docker images and dynamic machine creation.
Only the required files are included, which is defined in `.dockerignore`-file.

Currently the client files are hosted in [Cloudflare Pages](https://pages.cloudflare.com) and are manually uploaded there.
Usually NAT adds challenges to this type of connections so we have defined list of [STUN](https://en.wikipedia.org/wiki/STUN) and [TURN](https://en.wikipedia.org/wiki/Traversal_Using_Relays_around_NAT) servers.
At first a list of Google STUN servers were used, but they didn't work in most of cases.
Current working list of servers are from [TURN/STUN Server by Metered](https://www.metered.ca/stun-turn).
Their free plan is suitable enough so hosting own TURN-server isn't necessary for the project.


## Performance 

The use of WebRTC for peer-to-peer communication ensured low latency for real-time gameplay.  

The nodes do emit duplicate messages when changing direction (maybe due to the game engine), this could be improved. Not visible when playing among small number of nodes. 

Currently, as mentioned above, the other players don’t notice when a player leaves the room by just closing the window. This could be fixed by a heartbeat to either the leader or all other clients. 

## Lessons learned 

* Vector clocks were not as simple to implement as the theory seemed 
* The implementation of the raft algorithm includes a lot of timing issues and race conditions. You should carefully implement the algorithm step by step to make no such mistakes. Debugging was quite hard, and one got from one error to another.
* Because of many out of order events and the communication between the clients it is important to write clean and understandable code. Split up the parts according to their task and do not mix up different classes and their functionality. 
* We saw some other game presentations in the demo session, but it appeared that most of them were more asynchronous (games that were based on turns). It turned out implementing a real-time game is quite challenging according to race conditions. So, it is just more likely to run into an inconsistent state. 

## Group
Everybody in the group participated in the regular team meetings as well as online discussions. We all worked on our share of the code individually and merged the different features and came together when there were any problems.  