#!/usr/bin/env/python3
from http.server  import HTTPServer, SimpleHTTPRequestHandler
import ssl

# cert_file = "./localhost.pem"
# key_file = "./localhost-key.pem"

# class RequestHandler(SimpleHTTPRequestHandler):
#     def end_headers(self):
#         self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
#         self.send_header("Pragma", "no-cache")
#         self.send_header("Expires", "0")
#         SimpleHTTPRequestHandler.end_headers(self)

# httpd = HTTPServer(
#     ('', 8000),
#     RequestHandler
# )

# httpd.socket = ssl.wrap_socket(
#     httpd.socket,
#     server_side=True,
#     keyfile=key_file,
#     certfile=cert_file
# )

# httpd.serve_forever()

PORT = 8000

httpd = HTTPServer(('localhost', PORT), SimpleHTTPRequestHandler)

# Create a secure context using TLS
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(certfile='localhost.pem', keyfile='localhost-key.pem')

# Wrap the socket with the secure context
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

print(f"Serving at https://localhost:{PORT}")
httpd.serve_forever()