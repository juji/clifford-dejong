declare module "HelloModule" {
  interface HelloModuleInstance {
    getGreeting(): string;
  }

  export default function (): Promise<HelloModuleInstance>;
}
