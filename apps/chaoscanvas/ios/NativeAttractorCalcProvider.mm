//
//  NativeAttractorCalcProvider.m
//  chaoscanvas
//
//  Created by juji on 02/08/25.
//



#import "NativeAttractorCalcProvider.h"
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/TurboModule.h>
#import "NativeAttractorCalc.h"

@implementation NativeAttractorCalcProvider

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeAttractorCalc>(params.jsInvoker);
}

@end
