import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const AGENT_SRC = path.resolve(ROOT_DIR, 'agent');
const DIST_AGENT = path.resolve(ROOT_DIR, 'dist', 'agent');

console.log('📦 [Build Agent] Preparing Windows 11 Companion Agent package...');

if (!fs.existsSync(DIST_AGENT)) {
  fs.mkdirSync(DIST_AGENT, { recursive: true });
}

// Copy source files and configs to dist/agent
const filesToCopy = ['config.json', 'requirements.txt', 'agent.py', 'build_exe.bat', 'run_silent.vbs'];
for (const file of filesToCopy) {
  const src = path.join(AGENT_SRC, file);
  const dest = path.join(DIST_AGENT, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

const isWindows = process.platform === 'win32';

if (isWindows) {
  console.log('🪟 Windows environment detected. Building native xeneon-agent.exe with PyInstaller...');
  try {
    execSync('pip install -r requirements.txt', { cwd: AGENT_SRC, stdio: 'inherit' });
    execSync(`pyinstaller --onefile --noconsole --name xeneon-agent --distpath "${DIST_AGENT}" agent.py`, {
      cwd: AGENT_SRC,
      stdio: 'inherit',
    });
    console.log(`✅ [Build Agent] Successfully created: dist/agent/xeneon-agent.exe`);
  } catch (err) {
    console.warn(`⚠️ [Build Agent] PyInstaller build failed or PyInstaller is not installed: ${err.message}`);
    console.warn(`   Run agent\\build_exe.bat on your Windows 11 PC to generate the executable.`);
  }
} else {
  console.log('🐧 Non-Windows environment detected (Linux / Docker build).');
  console.log(`📁 Agent source files and startup batch bundled into: dist/agent/`);
  console.log(`💡 To generate xeneon-agent.exe for Windows 11:`);
  console.log(`   - Simply double-click dist/agent/build_exe.bat on your Windows PC, OR`);
  console.log(`   - Run: pythonw agent.py via dist/agent/run_silent.vbs on startup.`);
}
