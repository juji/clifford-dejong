#pragma once

#include <NativeAttractorCalcSpecsJSI.h>
#include "attractors.h"

#include <memory>
#include <string>

namespace facebook::react {

class NativeAttractorCalc : public NativeAttractorCalcCxxSpec<NativeAttractorCalc> {
public:
  NativeAttractorCalc(std::shared_ptr<CallInvoker> jsInvoker);

  jsi::Object calculateAttractor(
    jsi::Runtime& rt, 
    std::string timestamp, 
    jsi::Object buffer, 
    jsi::Object attractorParameters,
    int width,
    int height,
    int drawOn,
    bool highQuality,
    int totalAttractorPoints,
    int pointsPerIteration,
    jsi::Function onProgress, 
    jsi::Function onImageUpdate
  );
};

} // namespace facebook::react
