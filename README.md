# Distributed Systems 2024, group 16

## Team Members
* Gesche Redlich @gescheredlichj
* Oona Rauhala @oonarauhala
* Riku Mattila @rikumat
* Sami Saada @samitheberber
* Christoph Spitzer @spitzerUH

## Description

We want to implement a simple multiplayer game. There will be different nodes represented by coordinates on a twodimensional space. Each node will be able to move across the space. We would like to implement a "snake"-like game, where there is some kind of reward on the space and the players/nodes want to get there first. If they crash they die. We are unsure if we will be able to implement all of these game specific ideas as we will first focus on the distributed system in itself. Communication between clients are done using peer-to-peer, while having signaling server to initialize the connections.

## Architecture

![Distributed-System-First-Draft](https://github.com/user-attachments/assets/f672382a-1d7a-40f7-b9f9-a565cf85619f)

### Signaling server

Python

### Game clients

Javascript

## Forth Task
### Different nodes
* Server node for connection establishment and participant track
* Client nodes in the distributed system
  * Do we need a leading node?
  * Do we need load balancing?
  * What messages are sent between participants/clients?

## Possible problems
* how to deal with bad/good internet connection of the different clients?
