#pragma once

#include <NativeAttractorCalcSpecsJSI.h>

#include <memory>
#include <string>

namespace facebook::react {

class NativeAttractorCalc : public NativeAttractorCalcCxxSpec<NativeAttractorCalc> {
public:
  NativeAttractorCalc(std::shared_ptr<CallInvoker> jsInvoker);

  jsi::Value calculateAttractor(jsi::Runtime& rt, std::string timestamp, jsi::Function onProgress, jsi::Function onUpdate);
};

} // namespace facebook::react
