# Makefile for building NEC++ with Emscripten

# Emscripten compiler
CXX = em++

# Source files
SOURCES = \
	../src/c_evlcom.cpp \
	../src/c_geometry.cpp \
	../src/c_ggrid.cpp \
	../src/c_plot_card.cpp \
	../src/libNEC.cpp \
	../src/matrix_algebra.cpp \
	misc_wasm.cpp \
	../src/nec_context.cpp \
	../src/nec_exception.cpp \
	../src/nec_ground.cpp \
	../src/nec_output.cpp \
	../src/nec_radiation_pattern.cpp \
	../src/nec_structure_currents.cpp \
	../src/electromag.cpp \
	../src/nec_results.cpp \
	necpp_bindings.cpp

# Include path (add current dir for config.h)
INCLUDES = -I../src -I.

# Compiler flags
CXXFLAGS = -O3 -std=c++11 -Wall -Wextra \
	-DWITHOUT_LAPACK=1 \
	-DNEC_ERROR_CHECK=1 \
	-mnontrapping-fptoint \
	$(INCLUDES)

# Emscripten linker flags
LDFLAGS = --bind \
	-s WASM=1 \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s MODULARIZE=1 \
	-s EXPORT_NAME='createNecppModule' \
	-s EXPORTED_RUNTIME_METHODS=['ccall','cwrap'] \
	-s ENVIRONMENT='web,worker,node' \
	-s MAXIMUM_MEMORY=2GB \
	-s STACK_SIZE=5MB \
	-s ASSERTIONS=1 \
	-s NO_FILESYSTEM=1 \
	-s NO_DISABLE_EXCEPTION_CATCHING

# Output
OUTPUT = necpp.js

# Targets
.PHONY: all clean

all: $(OUTPUT)

$(OUTPUT): $(SOURCES)
	$(CXX) $(CXXFLAGS) $(SOURCES) $(LDFLAGS) -o $(OUTPUT)

clean:
	rm -f necpp.js necpp.wasm

# Help target
help:
	@echo "NEC++ WebAssembly Build"
	@echo ""
	@echo "Targets:"
	@echo "  all     - Build the WebAssembly module (default)"
	@echo "  clean   - Remove build artifacts"
	@echo "  help    - Show this help message"
	@echo ""
	@echo "Requirements:"
	@echo "  - Emscripten SDK installed and activated"
	@echo "  - Run 'source /path/to/emsdk/emsdk_env.sh' before building"
