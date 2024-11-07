from aiohttp import web
import socketio

PORT = 9999

sio = socketio.AsyncServer(cors_allowed_origins='*')
app = web.Application()
sio.attach(app)

# Temporary web response
async def hello(request):
    return web.Response(text="Hello, world")
app.add_routes([web.get('/', hello)])

if __name__ == '__main__':
    web.run_app(app, port=PORT)