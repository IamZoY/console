#!/bin/bash
# Console Build Script
# This script updates dependencies and builds the console

set -e  # Exit on error

echo "🔨 Building Console..."
echo ""

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📦 Step 1: Running go mod tidy..."
go mod tidy
echo "✅ Go dependencies updated"
echo ""

echo "📦 Step 2: Installing Node.js dependencies..."
cd web-app
if command -v corepack &> /dev/null; then
    corepack yarn install
else
    yarn install
fi
echo "✅ Node.js dependencies installed"
echo ""

echo "🔨 Step 3: Updating version.tsx with genversion..."
# We're already in web-app directory from step 2
if command -v corepack &> /dev/null; then
    corepack yarn genversion --esm --semi --double src/version.tsx
else
    yarn genversion --esm --semi --double src/version.tsx
fi
echo "✅ Version file updated"
echo ""

echo "🔨 Step 4: Building frontend..."
if command -v corepack &> /dev/null; then
    corepack yarn build
else
    yarn build
fi
echo "✅ Frontend build complete"
echo ""

echo "🔨 Step 5: Building console binary..."
cd ..
make console
echo "✅ Console binary built"
echo ""

echo "✅ Console build complete!"
echo ""
echo "Built files:"
echo "  - Frontend: web-app/build/"
echo "  - Binary: ./console"
echo ""

# Ask if user wants to push to git
read -p "🚀 Push to git and create tag? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📝 Checking git status..."
    git status --short
    
    # Ask for tag name
    echo ""
    read -p "🏷️  Enter tag name (e.g., v2.0.4.1-with-admin-V2): " TAG_NAME
    if [ -z "$TAG_NAME" ]; then
        echo "❌ Tag name cannot be empty. Skipping git push."
        exit 1
    fi
    
    echo ""
    echo "📦 Staging changes..."
    # Check if there are any changes before staging
    if [ -n "$(git status --porcelain)" ]; then
        git add go.mod go.sum web-app/build/ web-app/yarn.lock
        git add -A
        git commit -S -m "Update dependencies and build artifacts"
        echo "✅ Changes committed (signed)"
    else
        echo "ℹ️  No changes to commit"
    fi
    
    echo ""
    echo "🏷️  Creating and pushing tag: $TAG_NAME"
    git tag -s "$TAG_NAME" -m "Release $TAG_NAME"
    git push origin master
    git push origin "$TAG_NAME"
    echo "✅ Tag pushed to remote"
    echo ""
    echo "✅ Console released with tag: $TAG_NAME"
else
    echo "ℹ️  Skipping git push"
fi
