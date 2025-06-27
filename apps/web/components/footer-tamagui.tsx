'use client'
import { View, Text } from "tamagui";

export function FooterTamagui() {
  return (
    <View
      position="fixed"
      left={0}
      right={0}
      bottom={0}
      width="100%"
      backgroundColor="$background"
      borderTopWidth={1}
      borderColor="$borderColor"
      paddingVertical="$2"
      paddingHorizontal="$4"
      color="$color"
      zIndex={100}
    >
      <Text 
        fontSize={13}
        fontWeight="300"
      >
        Clifford-de Jong Attractor © {new Date().getFullYear()}
      </Text>
    </View>
  );
}
