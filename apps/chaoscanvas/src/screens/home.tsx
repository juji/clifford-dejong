import { ScrollView, useColorScheme } from "react-native";
import { View, Text } from 'tamagui'

// import { useNavigation } from "@react-navigation/native";
// import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';


export function Home() {

  // const isDarkMode = useColorScheme() === 'dark';

  return (
    <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <View>
        <Text>Home Screen</Text>
        <Text>Home Screen</Text>
        <Text>Home Screen</Text>
        <Text>Home Screen</Text>
        <Text>Home Screen</Text>
      </View>
    </ScrollView>
  );
}