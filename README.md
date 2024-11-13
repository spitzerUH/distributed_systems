# Distributed Systems 2024, group 16

## Team Members
* Gesche Redlich @gescheredlichj
* Oona Rauhala @oonarauhala
* Riku Mattila @rikumat
* Sami Saada @samitheberber
* Christoph Spitzer @spitzerUH

## Description

We want to implement a simple multiplayer game.
There will be different nodes represented by coordinates on a twodimensional space.
Each node will be able to move across the space.
We would like to implement a "snake"-like game, where there is some kind of reward on the space and the players/nodes want to get there first.
If they crash they die.
We are unsure if we will be able to implement all of these game specific ideas as we will first focus on the distributed system in itself.
Communication between clients are done using peer-to-peer, while having signaling server to initialize the connections.

## Architecture

![Distributed-System-First-Draft](https://github.com/user-attachments/assets/f672382a-1d7a-40f7-b9f9-a565cf85619f)

### Signaling server

The role for the server is purely signaling purpose.
Server provides websocket communication for the clients.

### Game clients

Game clients are browser based.
They initialize the communication using websockets to form a peer-to-peer communication implemented with WebRTC.
One of the nodes will be selected as leader node to resolve possible conflicts.
Leader selection could be based on the game score.

### Message types

#### Websocket, basic
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

#### Websocket, WebRTC related

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

#### WebRTC data stream

Datastream messages are all sent with same channel, only the payload will be different.

* Info message (coordinates, other game state)

## Possible problems
* how to deal with bad/good internet connection of the different clients? -> Data consistency issues
* Leader election
* Order of messages
