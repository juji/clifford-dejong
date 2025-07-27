import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import {
  Button,
  Card,
  H1,
  H2,
  H3,
  Paragraph,
  Separator,
  Input,
  TextArea,
  Switch,
  Checkbox,
  RadioGroup,
  XStack,
  YStack,
  Progress,
  Slider,
  Spinner,
  Tabs,
  Avatar,
  Image,
  ListItem,
  Text,
  SizableText,
  H5,
  View,
} from 'tamagui';
// import { LinearGradient } from '@tamagui/linear-gradient';
import { Check } from '@tamagui/lucide-icons';

const TamaguiShowcaseScreen = () => {
  const [switchValue, setSwitchValue] = useState(false);
  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <YStack gap="$4">
        <H1>Tamagui Components</H1>
        <Button>Button</Button>
        <Input placeholder="Input" />
        <TextArea placeholder="TextArea" />
        <XStack style={{ alignItems: 'center' }} gap="$2">
          <Switch
            size="$4"
            checked={switchValue}
            onCheckedChange={setSwitchValue}
            id="switch-1"
          >
            <Switch.Thumb animation="bouncy" />
          </Switch>
          <Text htmlFor="switch-1">Switch</Text>
        </XStack>
        <XStack style={{ alignItems: 'center' }} gap="$2">
          <Checkbox size="$4" defaultChecked id="checkbox-1">
            <Checkbox.Indicator>
              <Check />
            </Checkbox.Indicator>
          </Checkbox>
          <Text htmlFor="checkbox-1">Checkbox</Text>
        </XStack>
        <XStack style={{ alignItems: 'center' }} gap="$4">
          <RadioGroup defaultValue="1" orientation="horizontal">
            <XStack style={{ alignItems: 'center' }} gap="$2">
              <RadioGroup.Item value="1" id="radio-1">
                <RadioGroup.Indicator />
              </RadioGroup.Item>
              <Text htmlFor="radio-1">Option 1</Text>
            </XStack>
            <XStack style={{ alignItems: 'center' }} gap="$2">
              <RadioGroup.Item value="2" id="radio-2">
                <RadioGroup.Indicator />
              </RadioGroup.Item>
              <Text htmlFor="radio-2">Option 2</Text>
            </XStack>
          </RadioGroup>
        </XStack>
        <Slider
          defaultValue={[30]}
          min={0}
          max={100}
          step={1}
          orientation="horizontal"
          size="$2"
        >
          <Slider.Track>
            <Slider.TrackActive />
          </Slider.Track>
          <Slider.Thumb circular index={0} />
        </Slider>
        <Progress value={50} max={100} />
        <Spinner size="large" />
        <Separator />
        <Card>
          <H2>Card</H2>
          <Paragraph>This is a Tamagui Card.</Paragraph>
        </Card>
        <Tabs defaultValue="tab1" width={400}>
          <Tabs.List space>
            <Tabs.Tab value="tab1">
              <SizableText>Tab 1</SizableText>
            </Tabs.Tab>
            <Tabs.Tab value="tab2">
              <SizableText>Tab 2</SizableText>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Content value="tab1">
            <H5>Tab 1</H5>
          </Tabs.Content>
          <Tabs.Content value="tab2">
            <H5>Tab 2</H5>
          </Tabs.Content>
        </Tabs>
        {/* TooltipSimple and Sheet are not supported on React Native, so omitted for mobile */}
        <Avatar circular size="$6">
          <Avatar.Image src="https://placekitten.com/100/100" />
          <Avatar.Fallback backgroundColor="gray" />
        </Avatar>
        <Image
          source={{ uri: 'https://placekitten.com/200/200' }}
          width={100}
          height={100}
        />
        <ListItem title="ListItem" subTitle="Subtitle" icon={<Check />} />
        {/* <LinearGradient colors={["#e66465", "#9198e5"]} start={[0,0]} end={[1,1]} style={{ height: 40 }} /> */}
      </YStack>
    </ScrollView>
  );
};

export default TamaguiShowcaseScreen;
