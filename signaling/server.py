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

# Temporary web response
async def hello(request):
    return web.Response(text="Hello, world")
app.add_routes([web.get('/', hello)])

if __name__ == '__main__':
    web.run_app(app, port=PORT)