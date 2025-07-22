#!/bin/bash

# setup.sh - Platform-specific setup for React Native in monorepo

echo "📱 Running React Native platform-specific setup for monorepo..."

# Create Android Gradle plugin symlink
echo "🤖 Setting up Android Gradle plugin symlink..."
mkdir -p ./node_modules/@react-native
if [ ! -L "./node_modules/@react-native/gradle-plugin" ]; then
  REPO_ROOT="$(cd ../.. && pwd)"
  echo "Creating symlink to $REPO_ROOT/node_modules/@react-native/gradle-plugin"
  ln -sf "$REPO_ROOT/node_modules/@react-native/gradle-plugin" "./node_modules/@react-native/gradle-plugin"
else
  echo "Symlink for gradle-plugin already exists"
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

echo "✅ Platform-specific setup completed!"
