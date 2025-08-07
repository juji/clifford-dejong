declare module "hello" {
  interface HelloModule {
    getGreeting(): string;
    ccall(
      funcName: string,
      returnType: string,
      argTypes: string[],
      args: any[],
    ): any;
    cwrap(
      funcName: string,
      returnType: string,
      argTypes: string[],
    ): (...args: any[]) => any;
  }

  interface HelloModuleFactory {
    (): Promise<HelloModule>;
  }

  const HelloModule: HelloModuleFactory;
  export default HelloModule;
}
