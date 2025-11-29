#!/bin/bash

# Post-edit hook: Build and zip after any file changes
set -e

echo "🔨 Building extension..."
npm run build

echo "📦 Creating zip archive..."
cd dist && zip -r ../tablink-composer.zip . && cd ..

echo "✅ Build and zip completed successfully!"
