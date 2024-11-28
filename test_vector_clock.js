import VectorClock from "./src/logic/vector_clock.js"

let vc = new VectorClock()
vc.clientId = "id1"
vc.clock = {"id1": 0, "id2": 4, "id3": 1}

vc.outOfOrderMessageQueue = [
    {id2: {id1: 0, id2: 8, id3: 1}},
    {id2: {id1: 0, id2: 6, id3: 1}},
    {id2: {id1: 0, id2: 5, id3: 1}},
    {id2: {id1: 0, id2: 7, id3: 1}}
]

const expectedResult = [
    {id2: {id1: 0, id2: 5, id3: 1}},
    {id2: {id1: 0, id2: 6, id3: 1}},
    {id2: {id1: 0, id2: 7, id3: 1}},
    {id2: {id1: 0, id2: 8, id3: 1}}
]

const result = vc.getOldMessagesFromQueue()

if (result == expectedResult) {
    console.log("Test passed")
}
else {
    console.log("Test failed with result")
}

