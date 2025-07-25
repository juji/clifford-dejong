#!/bin/bash

# setup.sh - Platform-specific setup for React Native in monorepo (pnpm version)

# Ensure script runs in its own directory regardless of where it's called from
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📱 Running React Native platform-specific setup for monorepo..."
echo "Working directory: $(pwd)"

# Create necessary directories for React Native modules
echo "🤖 Setting up Android module symlinks..."
mkdir -p ./node_modules/@react-native
REPO_ROOT="$(cd ../.. && pwd)"

# When using pnpm, we need to ensure React Native modules are properly linked
# Check if we're using pnpm by looking for .pnpm directory in node_modules
if [ -d "$REPO_ROOT/node_modules/.pnpm" ]; then
  echo "📦 pnpm detected, using specific pnpm symlink approach"
  
  # Create symlink for gradle-plugin
  if [ ! -L "./node_modules/@react-native/gradle-plugin" ]; then
    GRADLE_PLUGIN_PATH=$(find "$REPO_ROOT/node_modules/.pnpm" -path "*/@react-native/gradle-plugin@*" -type d | head -n 1)
    if [ -n "$GRADLE_PLUGIN_PATH" ]; then
      echo "Creating symlink to $GRADLE_PLUGIN_PATH/node_modules/@react-native/gradle-plugin"
      ln -sf "$GRADLE_PLUGIN_PATH/node_modules/@react-native/gradle-plugin" "./node_modules/@react-native/gradle-plugin"
    else
      echo "Using direct symlink to $REPO_ROOT/node_modules/@react-native/gradle-plugin"
      ln -sf "$REPO_ROOT/node_modules/@react-native/gradle-plugin" "./node_modules/@react-native/gradle-plugin"
    fi
  else
    echo "Symlink for gradle-plugin already exists"
  fi

  # Create symlink for codegen
  if [ ! -L "./node_modules/@react-native/codegen" ]; then
    CODEGEN_PATH=$(find "$REPO_ROOT/node_modules/.pnpm" -path "*/@react-native/codegen@*" -type d | head -n 1)
    if [ -n "$CODEGEN_PATH" ]; then
      echo "Creating symlink to $CODEGEN_PATH/node_modules/@react-native/codegen"
      ln -sf "$CODEGEN_PATH/node_modules/@react-native/codegen" "./node_modules/@react-native/codegen"
    else
      echo "Using direct symlink to $REPO_ROOT/node_modules/@react-native/codegen"
      ln -sf "$REPO_ROOT/node_modules/@react-native/codegen" "./node_modules/@react-native/codegen"
    fi
  else
    echo "Symlink for codegen already exists"
  fi
else
  # Regular npm symlink approach
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
  if [ -d "$REPO_ROOT/node_modules/.pnpm" ]; then
    # Find react-native in pnpm's virtual store
    RN_PATH=$(find "$REPO_ROOT/node_modules/.pnpm" -path "*/react-native@*" -type d | head -n 1)
    if [ -n "$RN_PATH" ]; then
      echo "Creating symlink to $RN_PATH/node_modules/react-native"
      ln -sf "$RN_PATH/node_modules/react-native" "./node_modules/react-native"
    else
      echo "Creating symlink to $REPO_ROOT/node_modules/react-native"
      ln -sf "$REPO_ROOT/node_modules/react-native" "./node_modules/react-native"
    fi
  else
    echo "Creating symlink to $REPO_ROOT/node_modules/react-native"
    ln -sf "$REPO_ROOT/node_modules/react-native" "./node_modules/react-native"
  fi
else
  echo "Symlink for react-native already exists"
fi

# Create necessary symlinks for other React Native modules
RN_MODULES=("hermes-engine" "assets")
for module in "${RN_MODULES[@]}"; do
  if [ ! -L "./node_modules/@react-native/$module" ]; then
    if [ -d "$REPO_ROOT/node_modules/.pnpm" ]; then
      # Find module in pnpm's virtual store
      MODULE_PATH=$(find "$REPO_ROOT/node_modules/.pnpm" -path "*/@react-native/$module@*" -type d 2>/dev/null | head -n 1)
      if [ -n "$MODULE_PATH" ]; then
        echo "Creating symlink to $MODULE_PATH/node_modules/@react-native/$module"
        ln -sf "$MODULE_PATH/node_modules/@react-native/$module" "./node_modules/@react-native/$module"
        continue
      fi
    fi
    
    # Fallback to direct symlink
    if [ -d "$REPO_ROOT/node_modules/@react-native/$module" ]; then
      echo "Creating symlink to $REPO_ROOT/node_modules/@react-native/$module"
      ln -sf "$REPO_ROOT/node_modules/@react-native/$module" "./node_modules/@react-native/$module"
    fi
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

# Setup watchman to watch the current directory
echo "🔍 Setting up Watchman for fast file watching..."
watchman watch-del-all
watchman watch "$(pwd)"
