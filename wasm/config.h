/* config.h - Minimal configuration for NEC++ WebAssembly build */
#ifndef CONFIG_H
#define CONFIG_H

/* Version information */
#define VERSION "1.7.5-wasm"
#define PACKAGE "necpp"
#define PACKAGE_VERSION "1.7.5-wasm"

/* Build date - will be set at compile time */
#ifndef BUILD_DATE
#define BUILD_DATE __DATE__
#endif

/* Define if building for WebAssembly */
#define __EMSCRIPTEN__ 1

/* Define to 1 if you don't have LAPACK */
#define WITHOUT_LAPACK 1

/* Enable array bounds checking */
#define NEC_ERROR_CHECK 1

#endif /* CONFIG_H */
