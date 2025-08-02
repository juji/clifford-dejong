import { View, Text, Button } from 'tamagui';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';

// Define the navigation type
type RootStackParamList = {
  Home: undefined;
  Example: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

export function Home() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>Home Screen</Text>
      <Text>Home Screen</Text>
      <Text>Home Screen</Text>
      <Text>Home Screen</Text>
      <Text>Home Screen</Text>

      <Button
        size="$5"
        themeInverse
        onPress={() => navigation.navigate('Example')}
        style={{ marginTop: 20 }}
      >
        Go to Example
      </Button>
    </View>
  );
}
