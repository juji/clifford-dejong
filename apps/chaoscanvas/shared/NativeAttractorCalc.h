#pragma once

#include <AppSpecsJSI.h>

#include <memory>
#include <string>

namespace facebook::react {

class NativeAttractorCalc : public NativeAttractorCalcCxxSpec<NativeAttractorCalc> {
public:
  NativeAttractorCalc(std::shared_ptr<CallInvoker> jsInvoker);

  std::string calculateAttractor(jsi::Runtime& rt, std::string timestamp);
};

} // namespace facebook::react
