from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
ThreadingHTTPServer(("0.0.0.0",4173), SimpleHTTPRequestHandler).serve_forever()
