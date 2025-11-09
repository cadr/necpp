# NEC++ WebAssembly - Docker Guide

This guide explains how to build and run the NEC++ WebAssembly demo using Docker.

## Quick Start (Recommended)

The easiest way to run the demo is using Docker Compose:

```bash
# From the necpp repository root
docker-compose up
```

Then open your browser to: **http://localhost:8000**

That's it! The demo will be built and served automatically.

## Manual Docker Commands

### Build the Docker Image

```bash
docker build -t necpp-wasm .
```

### Run the Container

```bash
docker run -p 8000:8000 necpp-wasm
```

### Access the Demo

Open your browser to: **http://localhost:8000**

## What You'll See

When you navigate to `http://localhost:8000`, you'll see a landing page with links to:

- **Interactive Demo** (`/demo.html`) - Full-featured antenna simulation interface
- **Documentation** (`/README.md`) - Complete API reference
- **Quick Start** (`/QUICKSTART.md`) - Getting started guide

## Available Endpoints

- `http://localhost:8000/` - Landing page
- `http://localhost:8000/demo.html` - Interactive demo
- `http://localhost:8000/necpp.js` - JavaScript module
- `http://localhost:8000/necpp.wasm` - WebAssembly binary
- `http://localhost:8000/example.js` - Code examples
- `http://localhost:8000/README.md` - Documentation
- `http://localhost:8000/QUICKSTART.md` - Quick start guide

## Docker Image Details

The Docker image uses a multi-stage build:

### Stage 1: Builder
- **Base Image**: `emscripten/emsdk:3.1.50`
- **Purpose**: Compiles C++ source code to WebAssembly
- **Output**: `necpp.js` and `necpp.wasm`

### Stage 2: Server
- **Base Image**: `python:3.11-slim`
- **Purpose**: Serves the WebAssembly files via HTTP
- **Server**: Python's built-in `http.server`
- **Port**: 8000

## Customizing the Port

### Using Docker Compose

Edit `docker-compose.yml`:

```yaml
ports:
  - "3000:8000"  # Change 3000 to your preferred port
```

### Using Docker Run

```bash
docker run -p 3000:8000 necpp-wasm
```

Then access at: `http://localhost:3000`

## Development Workflow

### Rebuilding After Changes

If you modify the source code:

```bash
# Using Docker Compose
docker-compose build --no-cache
docker-compose up

# Using Docker directly
docker build --no-cache -t necpp-wasm .
docker run -p 8000:8000 necpp-wasm
```

### Viewing Build Logs

```bash
docker-compose up --build
```

### Stopping the Container

```bash
# If using Docker Compose
docker-compose down

# If using Docker run
docker stop necpp-wasm-demo
```

## Advanced Usage

### Running in Detached Mode

```bash
# Docker Compose
docker-compose up -d

# Docker run
docker run -d -p 8000:8000 --name necpp-wasm necpp-wasm
```

### Viewing Logs

```bash
# Docker Compose
docker-compose logs -f

# Docker run
docker logs -f necpp-wasm-demo
```

### Accessing the Container Shell

```bash
# Docker Compose
docker-compose exec necpp-wasm sh

# Docker run
docker exec -it necpp-wasm-demo sh
```

### Extracting Built Files

To copy the built WebAssembly files from the container:

```bash
# Create a container
docker create --name necpp-temp necpp-wasm

# Copy files
docker cp necpp-temp:/app/necpp.js ./
docker cp necpp-temp:/app/necpp.wasm ./

# Remove temporary container
docker rm necpp-temp
```

## Troubleshooting

### Port Already in Use

If port 8000 is already in use:

```bash
# Check what's using port 8000
lsof -i :8000  # On macOS/Linux
netstat -ano | findstr :8000  # On Windows

# Use a different port
docker run -p 8080:8000 necpp-wasm
```

### Build Failures

If the build fails:

```bash
# Clean everything and rebuild
docker-compose down
docker system prune -a
docker-compose build --no-cache
docker-compose up
```

### Container Won't Start

Check the logs:

```bash
docker-compose logs
```

### Browser Can't Load WASM

1. Make sure you're accessing via `http://localhost:8000` (not `file://`)
2. Check browser console for errors
3. Try clearing browser cache
4. Try a different browser (Chrome/Firefox recommended)

## Requirements

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher (optional, but recommended)
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

## Performance Notes

- First build takes ~5-10 minutes (downloads Emscripten SDK and compiles)
- Subsequent builds are faster due to Docker layer caching
- The final image is ~150MB (builder stage is discarded)

## Security Notes

- The container runs on port 8000 (HTTP, not HTTPS)
- For production use, put it behind a reverse proxy with HTTPS
- The Python HTTP server is suitable for development/demo only

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Test NEC++ WASM

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t necpp-wasm .
      - name: Run container
        run: docker run -d -p 8000:8000 --name test necpp-wasm
      - name: Wait for server
        run: sleep 5
      - name: Test endpoint
        run: curl -f http://localhost:8000/ || exit 1
```

## Alternative Deployment

### Deploy to Cloud

The Docker image can be deployed to:

- **Google Cloud Run**
- **AWS ECS/Fargate**
- **Azure Container Instances**
- **Heroku**
- **DigitalOcean App Platform**

Example for Google Cloud Run:

```bash
# Build and tag
docker build -t gcr.io/YOUR-PROJECT/necpp-wasm .

# Push to Google Container Registry
docker push gcr.io/YOUR-PROJECT/necpp-wasm

# Deploy
gcloud run deploy necpp-wasm \
  --image gcr.io/YOUR-PROJECT/necpp-wasm \
  --platform managed \
  --port 8000 \
  --allow-unauthenticated
```

## Local Development Without Docker

If you prefer not to use Docker, see:
- `wasm/QUICKSTART.md` - Manual build instructions
- `wasm/README.md` - Complete documentation

## Getting Help

- Check container logs: `docker-compose logs`
- Inspect the container: `docker-compose exec necpp-wasm sh`
- Read the full docs: `http://localhost:8000/README.md`
- Open an issue on GitHub

## License

NEC++ is licensed under the GNU General Public License (GPL). See the LICENSE file for details.
