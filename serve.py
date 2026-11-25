"""Local dev server for seyo_landing with caching disabled (python serve.py)."""
import http.server, socketserver

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

with socketserver.TCPServer(("127.0.0.1", 8080), NoCache) as httpd:
    print("serving http://127.0.0.1:8080")
    httpd.serve_forever()
