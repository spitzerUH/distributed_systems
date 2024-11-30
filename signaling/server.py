import os

PORT = int(os.getenv('SIGNALING_SERVER_PORT', 9999))

from aiohttp import web
import socketio

import vc
roomClocks = {}

sio = socketio.AsyncServer(cors_allowed_origins='*')
app = web.Application()
sio.attach(app)

def createPayload(clock, data):
    return {
        'method': 'ws',
        'clock': str(clock),
        'data': data
    }

def findRoom(sid):
    rooms = list(sio.rooms(sid) or [])
    rooms.remove(sid)
    return rooms[0] if rooms else None

async def notifyRoom(sid, room_code, event, message):
    roomClocks[room_code].increment()
    payload = createPayload(roomClocks[room_code], message)
    await sio.emit(event, payload, room=room_code, skip_sid=sid)

@sio.event
async def connect(sid, environ):
    print('New Client Connected', sid)

@sio.event
async def disconnect(sid):
    room_code = findRoom(sid)
    if room_code:
        data = {
            'sid': sid,
            'room_code': room_code
        }
        await notifyRoom(sid, room_code, 'room-left', data)
    print('Client Disconnected', sid)

@sio.on('room-enter')
async def room_enter(sid, message):
    if room_code := findRoom(sid):
        roomClocks[room_code].increment()
        return createPayload(roomClocks[room_code], {'error': 'Already in a room'})

    room_code = message['data']['room_code'] or 'default'
    if room_code not in roomClocks:
        roomClocks[room_code] = vc.VectorClock('server')
    roomClocks[room_code].increment()
    cVC = vc.VectorClock(sid, message['clock'])
    roomClocks[room_code].update(cVC)
    await sio.enter_room(sid, room_code)

    roomClocks[room_code].increment()
    data = {
        'sid': sid,
        'uuid': message['data']['uuid'],
        'room_code': room_code
    }
    payload = createPayload(roomClocks[room_code], data)
    await notifyRoom(sid, room_code, 'room-joined', payload)

    print("Client {} joins room {}".format(sid, room_code))
    roomClocks[room_code].increment()
    return createPayload(roomClocks[room_code], data)

@sio.on('room-exit')
async def room_exit(sid, message):
    room_code = message['data']['room_code']
    roomClocks[room_code].increment()

    cVC = vc.VectorClock(sid, message['clock'])
    roomClocks[room_code].update(cVC)

    print("Client {} leaves room {}".format(sid, room_code))
    await sio.leave_room(sid, room_code)

    roomClocks[room_code].increment()
    data = {
        'sid': sid,
        'room_code': room_code
    }
    payload = createPayload(roomClocks[room_code], data)
    await notifyRoom(sid, room_code, 'room-left', payload)

    roomClocks[room_code].increment()
    return createPayload(roomClocks[room_code], data)

@sio.on('webrtc-offer')
async def offer(sid, message):
    room_code = findRoom(sid)
    roomClocks[room_code].increment()
    print("Client {} sent offer {}".format(sid, message))
    await sio.emit('webrtc-offer', {'from':sid, 'data': message['data']}, to=message['to'])

@sio.on('webrtc-answer')
async def offer(sid, message):
    room_code = findRoom(sid)
    roomClocks[room_code].increment()
    print("Client {} sent answer {}".format(sid, message))
    await sio.emit('webrtc-answer', {'from':sid, 'data': message['data']}, to=message['to'])

@sio.on('webrtc-candidate')
async def candidate(sid, message):
    room_code = findRoom(sid)
    roomClocks[room_code].increment()
    print("Client {} sent ICE candidate message: {}".format(sid, message))
    await sio.emit('webrtc-candidate', {'from':sid, 'data': message['data']}, to=message['to'])

async def welcome(request):
    return web.Response(text="Signaling server is up and running!")
app.add_routes([web.get('/', welcome)])

if __name__ == '__main__':
    web.run_app(app, port=PORT)
