import { View, Text, Button } from 'tamagui';

export function Jsi() {
  function buttonPress() {
    console.log('Button Pressed');
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>JSI Example</Text>

      <Button
        size="$5"
        themeInverse
        onPress={() => buttonPress}
        style={{ marginTop: 20 }}
      >
        Button
      </Button>
    </View>
  );
}
