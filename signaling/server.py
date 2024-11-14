import os
from dotenv import load_dotenv
load_dotenv()

PORT = int(os.getenv('SIGNALING_SERVER_PORT'))

from aiohttp import web
import socketio

sio = socketio.AsyncServer(cors_allowed_origins='*')
app = web.Application()
sio.attach(app)

@sio.event
async def connect(sid, environ):
    print('New Client Connected', sid)

@sio.event
async def disconnect(sid):
    print('Client Disconnected', sid)

@sio.on('room-enter')
async def room_enter(sid, message):
    room_code = message['room_code'] or 'default'
    print("Client {} joins room {}".format(sid, room_code))
    await sio.enter_room(sid, room_code)
    await sio.emit('room-joined', {'session_id':sid}, room=room_code, skip_sid=sid)
    return {'room_code':room_code}

@sio.on('room-exit')
async def room_enter(sid, message):
    room_code = message['room_code']
    print("Client {} leaves room {}".format(sid, room_code))
    await sio.leave_room(sid, room_code)
    return {'room_code':room_code}

async def welcome(request):
    return web.Response(text="Signaling server is up and running!")
app.add_routes([web.get('/', welcome)])

if __name__ == '__main__':
    web.run_app(app, port=PORT)