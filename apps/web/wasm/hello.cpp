#include <emscripten/bind.h>
#include <string>

// Regular synchronous function
std::string
getGreeting() {
  return "hello from wasm asdf";
}

// Note: The actual async behavior will be implemented in JavaScript, not C++
// The C++ just provides the data that will be returned asynchronously

EMSCRIPTEN_BINDINGS(hello_module) {
  emscripten::function("getGreeting", &getGreeting);
}
