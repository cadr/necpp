cmake_minimum_required(VERSION 3.10)
project(necpp_wasm)

# Set C++ standard
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add source files from parent src directory
set(NECPP_SOURCES
    ../src/c_evlcom.cpp
    ../src/c_geometry.cpp
    ../src/c_ggrid.cpp
    ../src/c_plot_card.cpp
    ../src/libNEC.cpp
    ../src/matrix_algebra.cpp
    misc_wasm.cpp
    ../src/nec_context.cpp
    ../src/nec_exception.cpp
    ../src/nec_ground.cpp
    ../src/nec_output.cpp
    ../src/nec_radiation_pattern.cpp
    ../src/nec_structure_currents.cpp
    ../src/electromag.cpp
    ../src/nec_results.cpp
)

# Include directory
include_directories(../src)

# Add the bindings file
set(BINDINGS_SOURCE necpp_bindings.cpp)

# Build the WebAssembly module
add_executable(necpp ${NECPP_SOURCES} ${BINDINGS_SOURCE})

# Emscripten-specific settings
if(EMSCRIPTEN)
    # Enable Embind for JavaScript bindings
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} --bind")

    # Optimization flags
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3")

    # Disable LAPACK (use built-in solver)
    add_definitions(-DWITHOUT_LAPACK=1)

    # Enable array bounds checking for safety
    add_definitions(-DNEC_ERROR_CHECK=1)

    # Export functions and settings
    set_target_properties(necpp PROPERTIES LINK_FLAGS "\
        --bind \
        -s WASM=1 \
        -s ALLOW_MEMORY_GROWTH=1 \
        -s MODULARIZE=1 \
        -s EXPORT_NAME='createNecppModule' \
        -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap'] \
        -s ENVIRONMENT='web,worker' \
        -s MAXIMUM_MEMORY=2GB \
        -s STACK_SIZE=5MB \
        -s ASSERTIONS=1 \
        -s NO_FILESYSTEM=1 \
        -o necpp.js")
endif()
