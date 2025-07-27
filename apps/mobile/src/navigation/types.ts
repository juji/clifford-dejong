/**
 * Navigation Types for Clifford-deJong Attractor Mobile App
 */

// Main stack navigation types
export type RootStackParamList = {
  Home: undefined;
  AttractorScreen: undefined;
  AttractorDetail: { id: string };
  Settings: undefined;
  About: undefined;
  TamaguiShowcase: undefined;
};

// Previous bottom tab types (keeping for reference)
export type BottomTabParamList = {
  Home: undefined;
  Attractor: undefined;
  Settings: undefined;
};
