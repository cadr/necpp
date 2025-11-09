# NEC++ WebAssembly Docker Image
# This Dockerfile builds the NEC++ WebAssembly module and serves it with a web server

# Stage 1: Build the WebAssembly module
FROM emscripten/emsdk:3.1.50 AS builder

WORKDIR /app

# Copy source files
COPY src/ ./src/

# Copy wasm files explicitly to avoid .dockerignore issues
COPY wasm/Makefile ./wasm/Makefile
COPY wasm/CMakeLists.txt ./wasm/CMakeLists.txt
COPY wasm/config.h ./wasm/config.h
COPY wasm/necpp_bindings.cpp ./wasm/necpp_bindings.cpp
COPY wasm/misc_wasm.cpp ./wasm/misc_wasm.cpp
COPY wasm/wasm_compat.h ./wasm/wasm_compat.h
COPY wasm/demo.html ./wasm/demo.html
COPY wasm/example.js ./wasm/example.js
COPY wasm/README.md ./wasm/README.md
COPY wasm/QUICKSTART.md ./wasm/QUICKSTART.md
COPY wasm/build.sh ./wasm/build.sh
COPY wasm/test_build.js ./wasm/test_build.js

# Build the WebAssembly module
WORKDIR /app/wasm

# Debug: List what files we have
RUN echo "Contents of /app/wasm:" && ls -la

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
<html lang="en">\n\
<head>\n\
    <meta charset="UTF-8">\n\
    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n\
    <title>NEC++ WebAssembly</title>\n\
    <style>\n\
        * { margin: 0; padding: 0; box-sizing: border-box; }\n\
        body {\n\
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;\n\
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n\
            min-height: 100vh;\n\
            display: flex;\n\
            align-items: center;\n\
            justify-content: center;\n\
            padding: 20px;\n\
        }\n\
        .container {\n\
            background: white;\n\
            border-radius: 20px;\n\
            padding: 40px;\n\
            max-width: 800px;\n\
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);\n\
        }\n\
        h1 {\n\
            color: #333;\n\
            margin-bottom: 10px;\n\
            font-size: 2.5em;\n\
        }\n\
        .subtitle {\n\
            color: #666;\n\
            margin-bottom: 30px;\n\
            font-size: 1.1em;\n\
        }\n\
        .info {\n\
            background: #f8f9fa;\n\
            padding: 20px;\n\
            border-radius: 10px;\n\
            margin: 20px 0;\n\
            border-left: 4px solid #667eea;\n\
        }\n\
        .links {\n\
            display: grid;\n\
            gap: 15px;\n\
            margin: 30px 0;\n\
        }\n\
        .links a {\n\
            display: flex;\n\
            align-items: center;\n\
            padding: 15px 20px;\n\
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n\
            color: white;\n\
            text-decoration: none;\n\
            border-radius: 10px;\n\
            font-weight: 500;\n\
            transition: transform 0.2s, box-shadow 0.2s;\n\
        }\n\
        .links a:hover {\n\
            transform: translateY(-2px);\n\
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);\n\
        }\n\
        .links a .emoji {\n\
            font-size: 1.5em;\n\
            margin-right: 15px;\n\
        }\n\
        .files {\n\
            background: #f8f9fa;\n\
            padding: 20px;\n\
            border-radius: 10px;\n\
            margin-top: 30px;\n\
        }\n\
        .files h2 {\n\
            color: #333;\n\
            margin-bottom: 15px;\n\
        }\n\
        .files ul {\n\
            list-style: none;\n\
        }\n\
        .files li {\n\
            padding: 8px 0;\n\
            border-bottom: 1px solid #ddd;\n\
        }\n\
        .files li:last-child {\n\
            border-bottom: none;\n\
        }\n\
        code {\n\
            background: #e9ecef;\n\
            padding: 2px 8px;\n\
            border-radius: 4px;\n\
            font-family: "Courier New", monospace;\n\
        }\n\
    </style>\n\
</head>\n\
<body>\n\
    <div class="container">\n\
        <h1>⚡ NEC++ WebAssembly</h1>\n\
        <p class="subtitle">Electromagnetic Antenna Simulation in Your Browser</p>\n\
        \n\
        <div class="info">\n\
            <p><strong>NEC++</strong> is a powerful antenna simulation tool that uses the Method of Moments (MoM) to model electromagnetic behavior. This WebAssembly port allows you to run simulations directly in your browser without any installation!</p>\n\
        </div>\n\
        \n\
        <div class="links">\n\
            <a href="/demo.html">\n\
                <span class="emoji">🚀</span>\n\
                <span>Launch Interactive Demo</span>\n\
            </a>\n\
            <a href="/README.md">\n\
                <span class="emoji">📖</span>\n\
                <span>Read Full Documentation</span>\n\
            </a>\n\
            <a href="/QUICKSTART.md">\n\
                <span class="emoji">⚡</span>\n\
                <span>Quick Start Guide</span>\n\
            </a>\n\
        </div>\n\
        \n\
        <div class="files">\n\
            <h2>Available Files</h2>\n\
            <ul>\n\
                <li><code>necpp.js</code> - JavaScript glue code</li>\n\
                <li><code>necpp.wasm</code> - WebAssembly binary module</li>\n\
                <li><code>demo.html</code> - Interactive simulation demo</li>\n\
                <li><code>example.js</code> - JavaScript usage examples</li>\n\
                <li><code>README.md</code> - Complete API documentation</li>\n\
                <li><code>QUICKSTART.md</code> - Getting started guide</li>\n\
            </ul>\n\
        </div>\n\
    </div>\n\
</body>\n\
</html>' > /app/index.html

EXPOSE 8000

# Start the web server
CMD ["python3", "-m", "http.server", "8000"]
