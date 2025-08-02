/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

// import { NewAppScreen } from '@react-native/new-app-screen';
// import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';

// function App() {
//   const isDarkMode = useColorScheme() === 'dark';

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
//       <NewAppScreen templateFileName="App.tsx" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
// });

// export default App;

// In App.js in a new project

import * as React from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home } from './screens/home';
import { Example } from './screens/example';
import { TamaguiProvider, View } from '@tamagui/core'
import { config } from './tamagui.config' // your configuration

const RootStack = createNativeStackNavigator({
  screens: {
    Home,
    Example
  },
});

const Navigation = createStaticNavigation(RootStack);

export default function App() {

  const isDarkMode = useColorScheme() === 'dark';

  return (
    <TamaguiProvider config={config}>
      <View style={{ flex: 1 }}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Navigation />
      </View>
    </TamaguiProvider>
  );

}
