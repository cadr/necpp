FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    python3 \
    python3-pip \
    curl \
    wget \
    cmake \
    autoconf \
    automake \
    libtool \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18.x
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Emscripten SDK
RUN git clone https://github.com/emscripten-core/emsdk.git /opt/emsdk \
    && cd /opt/emsdk \
    && ./emsdk install latest \
    && ./emsdk activate latest

# Set up Emscripten environment
ENV EMSDK=/opt/emsdk
ENV PATH="/opt/emsdk:/opt/emsdk/upstream/emscripten:${PATH}"

# Create working directory
WORKDIR /work

# Copy NEC++ source
COPY . /work/

# Build C++ version
RUN bash build_simple.sh

# Build WASM version
RUN cd wasm && \
    source /opt/emsdk/emsdk_env.sh && \
    make

# Set up test harness
WORKDIR /work/testharness

# Default command
CMD ["make", "-f", "Makefile.wasm", "help"]
