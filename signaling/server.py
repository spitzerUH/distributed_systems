import os
from dotenv import load_dotenv
load_dotenv()

PORT = int(os.getenv('SIGNALING_SERVER_PORT'))
ROOM = os.getenv('ROOM')

from aiohttp import web
import socketio

sio = socketio.AsyncServer(cors_allowed_origins='*')
app = web.Application()
sio.attach(app)

@sio.event
async def connect(sid, environ):
    print('New Client Connected', sid)
    await sio.enter_room(sid, ROOM)
    await sio.emit('newclient', room=ROOM, skip_sid=sid)

@sio.event
async def disconnect(sid):
    await sio.leave_room(sid, ROOM)
    print('Client Disconnected', sid)

@sio.event
async def data(sid, data):
    print('Message from {}: {}'.format(sid, data))
    await sio.emit('data', data, room=ROOM, skip_sid=sid)

async def welcome(request):
    return web.Response(text="Signaling server is up and running!")
app.add_routes([web.get('/', welcome)])

if __name__ == '__main__':
    web.run_app(app, port=PORT)