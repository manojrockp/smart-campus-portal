const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('Building Smart Campus Desktop Application...')

// Step 1: Build React app
console.log('1. Building React frontend...')
try {
  execSync('npm run build', { 
    cwd: path.join(__dirname, '..', 'frontend'),
    stdio: 'inherit' 
  })
  console.log('✓ React build completed')
} catch (error) {
  console.error('✗ React build failed:', error.message)
  process.exit(1)
}

// Step 2: Copy build to renderer directory
console.log('2. Copying build files...')
const rendererDir = path.join(__dirname, 'renderer')
const frontendBuildDir = path.join(__dirname, '..', 'frontend', 'dist')

if (fs.existsSync(rendererDir)) {
  fs.rmSync(rendererDir, { recursive: true })
}

fs.mkdirSync(rendererDir, { recursive: true })

try {
  execSync(`xcopy "${frontendBuildDir}" "${rendererDir}" /E /I /Y`, { stdio: 'inherit' })
  console.log('✓ Files copied successfully')
} catch (error) {
  console.error('✗ Copy failed:', error.message)
  process.exit(1)
}

// Step 3: Install Electron dependencies
console.log('3. Installing Electron dependencies...')
try {
  execSync('npm install', { cwd: __dirname, stdio: 'inherit' })
  console.log('✓ Dependencies installed')
} catch (error) {
  console.error('✗ Dependency installation failed:', error.message)
  process.exit(1)
}

console.log('✓ Desktop application build completed!')
console.log('Run "npm start" in desktop-app directory to launch the app')