"""Local-only, dependency-free launcher for the packaged atlas."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import webbrowser, threading
root=Path(__file__).resolve().parents[1]/'dist'
handler=partial(SimpleHTTPRequestHandler,directory=str(root))
try: server=ThreadingHTTPServer(('127.0.0.1',8765),handler)
except OSError: server=ThreadingHTTPServer(('127.0.0.1',0),handler)
url=f'http://127.0.0.1:{server.server_port}/'
print(f'NSW Coal Atlas: {url}\nKeep this window open. Press Control-C to stop.',flush=True)
threading.Timer(.4,lambda:webbrowser.open(url)).start()
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
