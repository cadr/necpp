# NEC++ WebAssembly Docker Image
# This Dockerfile builds the NEC++ WebAssembly module and serves it with a web server

# Stage 1: Build the WebAssembly module
FROM emscripten/emsdk:3.1.50 AS builder

WORKDIR /app

# Copy source files
COPY ../src ./src
COPY . ./wasm

# Build the WebAssembly module
WORKDIR /app/wasm
RUN make clean || true
RUN make

# Verify the build
RUN ls -lh necpp.js necpp.wasm

# Stage 2: Serve the application
FROM python:3.11-slim

WORKDIR /app

# Copy the built WebAssembly files and demo
COPY --from=builder /app/wasm/necpp.js /app/
COPY --from=builder /app/wasm/necpp.wasm /app/
COPY --from=builder /app/wasm/demo.html /app/
COPY --from=builder /app/wasm/example.js /app/
COPY --from=builder /app/wasm/README.md /app/
COPY --from=builder /app/wasm/QUICKSTART.md /app/

# Create a simple index page
RUN echo '<!DOCTYPE html>\n\
<html>\n\
<head>\n\
    <meta charset="UTF-8">\n\
    <title>NEC++ WebAssembly</title>\n\
    <style>\n\
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }\n\
        h1 { color: #333; }\n\
        .links { margin: 30px 0; }\n\
        .links a { display: block; padding: 10px; margin: 10px 0; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; }\n\
        .links a:hover { background: #45a049; }\n\
        .info { background: #f0f0f0; padding: 15px; border-radius: 4px; margin: 20px 0; }\n\
    </style>\n\
</head>\n\
<body>\n\
    <h1>NEC++ WebAssembly</h1>\n\
    <p>Welcome to the NEC++ electromagnetic simulation library running in WebAssembly!</p>\n\
    <div class="info">\n\
        <p><strong>NEC++</strong> is a powerful antenna simulation tool that uses the Method of Moments (MoM) to model electromagnetic behavior.</p>\n\
    </div>\n\
    <div class="links">\n\
        <a href="/demo.html">🚀 Launch Interactive Demo</a>\n\
        <a href="/README.md">📖 Read Documentation</a>\n\
        <a href="/QUICKSTART.md">⚡ Quick Start Guide</a>\n\
    </div>\n\
    <h2>Files Available:</h2>\n\
    <ul>\n\
        <li><code>necpp.js</code> - JavaScript glue code</li>\n\
        <li><code>necpp.wasm</code> - WebAssembly binary</li>\n\
        <li><code>demo.html</code> - Interactive demo</li>\n\
        <li><code>example.js</code> - Code examples</li>\n\
    </ul>\n\
</body>\n\
</html>' > /app/index.html

EXPOSE 8000

# Start the web server
CMD ["python3", "-m", "http.server", "8000"]
