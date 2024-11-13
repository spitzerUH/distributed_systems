# Distributed Systems 2024, group 16

We want to implement a simple multiplayer game.
It uses P2P communication between the clients.

## Team Members
* Gesche Redlich @gescheredlichj
* Oona Rauhala @oonarauhala
* Riku Mattila @rikumat
* Sami Saada @samitheberber
* Christoph Spitzer @spitzerUH

Our game will work in the browser, where the main computation is also done.
Game clients connect each other using WebRTC connections and use its datastream functionality to communicate.
To form the peer-to-peer connection, we need signaling server to deal the messaging at first.
The signaling server is implemented by using Python.
The client is implemented by using JavaScript.
Socket.io is used to provide the websocket functionality, both in server and client side.
HTTP is used as middleware for websocket connection, it is implemented with aiohttp.
The server side is fully asyncronous to fit the theme of the course better.
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

## Game clients

Clients initialize the communication using websockets to form a peer-to-peer communication implemented with WebRTC.

Game clients are browser based implemented by using JavaScript.
Socket.IO provides websocket functionality also for client.
WebRTC is implemented by the browsers and we use its datastream functionality to communicate between the clients.
This covers the main functionalities for the communication section of the clients.

Our plan is to demonstrate the usage of communication by using it to share game states between client in multiplayer environment.
Each client runs an instance of the game and share the state by sending messages.

We have at least two types of the clients, a regular client running the information and an elected leader client for special cases.
One of the nodes will be selected as leader node to resolve possible conflicts.
Leader selection could be based on the game score.

We might also have third client type for observation.
This could be handy to showcase the game state in the demo situation.

## Message types

### Websocket, basic
* Default Socket.io messages
    * ```connect``` is sent when client connects to the server
    * ```disconnect``` is sent when client disconnects from the server
    * ```connect_error``` is sent when connection fails
---
When new client connects, server emits ```newclient``` message:
```json
{
    "session_id": "session id"
}
```
---
Session id is for temporary use for websocket to identify the clients for direct messaging.

### Websocket, WebRTC related

Client needs to send other clients an offer to describe the connection.
It emits ```offer``` message type with following payload:
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
It emits ```answer``` message type with following payload:
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
The peer-to-peer connection needs ICE candidate to determine how the communication is formed
It emits ```candidate``` message type with following payload:
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
Notice: ```to``` and ```from``` fields are required for the client to identify with who the connection is formed.
It is also for the server to be able to send a private message to correct target.

### WebRTC data stream

Datastream messages are all sent with same channel, only the payload will be different.

* Info message (coordinates, other game state)
---
We need message to handle the leader election:
```json
{
    "type": "election",
    "action": "election action"
}
```
Election action could from bully algorithm ```election```, ```ok``` and ```coordinator```.

---

## Possible problems
* how to deal with bad/good internet connection of the different clients? -> Data consistency issues
* Leader election
* Order of messages
