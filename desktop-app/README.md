# Smart Campus Portal - Desktop Application

## Setup Instructions

### Development Mode (Recommended)
1. Start the web application:
   ```bash
   cd ../frontend
   npm start
   ```

2. Start the desktop app:
   ```bash
   cd desktop-app
   npm install
   npm start
   ```

### Production Build
1. Build everything:
   ```bash
   cd desktop-app
   node build-script.js
   ```

2. Create distributable:
   ```bash
   npm run dist
   ```

## Features
- Native desktop application
- Same functionality as web version
- Offline capability (when built)
- Native OS integration

## Requirements
- Node.js 16+
- Windows/Mac/Linux support