#include <emscripten/bind.h>
#include <string>

std::string
getGreeting() {
  return "hello from wasm";
}

EMSCRIPTEN_BINDINGS(hello_module) {
  emscripten::function("getGreeting", &getGreeting);
}
