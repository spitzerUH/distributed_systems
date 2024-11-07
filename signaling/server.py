import os
from dotenv import load_dotenv
load_dotenv()

PORT = int(os.getenv('SIGNALING_SERVER_PORT'))

from aiohttp import web
import socketio

sio = socketio.AsyncServer(cors_allowed_origins='*')
app = web.Application()
sio.attach(app)

# Temporary web response
async def hello(request):
    return web.Response(text="Hello, world")
app.add_routes([web.get('/', hello)])

if __name__ == '__main__':
    web.run_app(app, port=PORT)