#!/bin/bash

# setup.sh - Platform-specific setup for React Native in monorepo

echo "📱 Running React Native platform-specific setup for monorepo..."

# Create Android Gradle plugin symlink and other required React Native modules
echo "🤖 Setting up Android module symlinks..."
mkdir -p ./node_modules/@react-native
REPO_ROOT="$(cd ../.. && pwd)"

# Create symlink for gradle-plugin
if [ ! -L "./node_modules/@react-native/gradle-plugin" ]; then
  echo "Creating symlink to $REPO_ROOT/node_modules/@react-native/gradle-plugin"
  ln -sf "$REPO_ROOT/node_modules/@react-native/gradle-plugin" "./node_modules/@react-native/gradle-plugin"
else
  echo "Symlink for gradle-plugin already exists"
fi

# Create symlink for codegen
if [ ! -L "./node_modules/@react-native/codegen" ]; then
  echo "Creating symlink to $REPO_ROOT/node_modules/@react-native/codegen"
  ln -sf "$REPO_ROOT/node_modules/@react-native/codegen" "./node_modules/@react-native/codegen"
else
  echo "Symlink for codegen already exists"
fi

# Install iOS CocoaPods if on macOS
if [ "$(uname)" == "Darwin" ]; then
  echo "🍎 Setting up iOS CocoaPods..."
  if [ -d "./ios" ]; then
    cd ./ios
    if [ -f "Podfile" ]; then
      # Check if we have CocoaPods installed
      if command -v pod &> /dev/null; then
        echo "Installing CocoaPods dependencies..."
        pod install
      else
        echo "⚠️ CocoaPods is not installed. Please install it with 'gem install cocoapods' and run this script again."
      fi
    else
      echo "No Podfile found in iOS directory"
    fi
    cd ..
  else
    echo "No iOS directory found"
  fi
else
  echo "Not on macOS, skipping CocoaPods setup"
fi

# Additional setup for React Native native modules
echo "🧩 Setting up additional React Native modules..."

# Create symlink for React Native itself
if [ ! -L "./node_modules/react-native" ]; then
  echo "Creating symlink to $REPO_ROOT/node_modules/react-native"
  ln -sf "$REPO_ROOT/node_modules/react-native" "./node_modules/react-native"
else
  echo "Symlink for react-native already exists"
fi

# Create necessary symlinks for other React Native modules
RN_MODULES=("hermes-engine" "assets")
for module in "${RN_MODULES[@]}"; do
  if [ ! -L "./node_modules/@react-native/$module" ] && [ -d "$REPO_ROOT/node_modules/@react-native/$module" ]; then
    echo "Creating symlink to $REPO_ROOT/node_modules/@react-native/$module"
    ln -sf "$REPO_ROOT/node_modules/@react-native/$module" "./node_modules/@react-native/$module"
  fi
done

# Make sure node_modules are properly linked for native modules
if [ -d "./node_modules" ]; then
  echo "Ensuring proper React Native module symlinks..."
  for dir in ./node_modules/@react-native-*; do
    if [ -d "$dir" ] && [ ! -L "$dir" ]; then
      echo "Found native module directory: $dir"
      if [ -d "$dir/android" ]; then
        echo "✅ Native Android module directory exists: $dir/android"
      else
        echo "⚠️ Android directory missing for module: $dir"
      fi
    fi
  done
fi

echo "✅ Platform-specific setup completed!"
