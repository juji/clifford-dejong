#!/bin/bash

# Simplified setup.sh - Platform-specific setup for React Native in monorepo

# Ensure script runs in its own directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📱 Running React Native platform-specific setup..."

# Install iOS CocoaPods if on macOS
if [ "$(uname)" == "Darwin" ] && [ -d "./ios" ] && [ -f "./ios/Podfile" ]; then
  echo "🍎 Setting up iOS CocoaPods..."
  if command -v pod &> /dev/null; then
    cd ./ios && bundle exec pod install && cd ..
  else
    echo "⚠️ CocoaPods not installed. Run 'gem install cocoapods' and try again."
  fi
fi

echo "✅ Setup completed!"
