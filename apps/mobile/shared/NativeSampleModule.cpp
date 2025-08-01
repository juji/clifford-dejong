#include "NativeSampleModule.h"

namespace facebook::react {

  NativeSampleModule::NativeSampleModule(std::shared_ptr<CallInvoker> jsInvoker): NativeSampleModuleCxxSpec(std::move(jsInvoker)) {}

  std::string fromMainStr = std::string("Hello from NativeSampleModule! ");

  void NativeSampleModule::setMainString(jsi::Runtime& rt, std::string input) {
    fromMainStr = input + " ";
  }

  template<size_t N>
  std::string arrayToString(const std::array<uint32_t, N>& arr) {
      std::stringstream ss;
      ss << "[";
      for (size_t i = 0; i < N; ++i) {
          ss << arr[i];
          if (i < N - 1) {
              ss << ", ";
          }
      }
      ss << "]";
      return ss.str();
  }

  std::string NativeSampleModule::reverseString(jsi::Runtime& rt, std::string input, jsi::Function onLog, jsi::Function onAfterReverse) {

    std::string reversed = fromMainStr + std::string(input.rbegin(), input.rend());

    onLog.call(rt, jsi::String::createFromUtf8(rt, reversed));

    // create a random uint32_t buffer
    std::array<uint32_t, 4> randomBuffer;
    std::generate(randomBuffer.begin(), randomBuffer.end(), []() {
      return static_cast<uint32_t>(std::rand()); // Random uint32_t value
    });
    onAfterReverse.call(rt, arrayToString(randomBuffer));

    return reversed;

  }

} // namespace facebook::react