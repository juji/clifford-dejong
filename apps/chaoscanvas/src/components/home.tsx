import { View, Text, Button } from 'tamagui';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/lib/navigation'; // Adjust the import path as necessary

// Styles object outside the component
const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    marginTop: 20,
  },
};

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

export function Home() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <Text>Home Screen</Text>
      <Text>Home Screen</Text>
      <Text>Home Screen</Text>
      <Text>Home Screen</Text>
      <Text>Home Screen</Text>

      <Button
        size="$5"
        themeInverse
        onPress={() => navigation.navigate('Example')}
        style={styles.button}
      >
        Go to Example
      </Button>
    </View>
  );
}
