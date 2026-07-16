import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const isWindows = process.platform === 'win32';
const runtimeLogPath = path.join(process.cwd(), 'dev-runtime.log');
const log = message => {
  fs.appendFileSync(runtimeLogPath, `[${new Date().toISOString()}] ${message}\n`);
};

log('dev-with-api starting');

const bin = command => path.join(
  process.cwd(),
  'node_modules',
  '.bin',
  isWindows ? `${command}.cmd` : command
);

const quote = value => `"${String(value).replace(/"/g, '\\"')}"`;

const runCommand = (command, args, stdio = 'inherit') => {
  log(`starting command: ${command} ${args.join(' ')}`);
  if (isWindows) {
    return spawn(
      [quote(command), ...args.map(quote)].join(' '),
      [],
      {
        stdio,
        shell: true
      }
    );
  }

  return spawn(command, args, {
    stdio,
    shell: false
  });
};

let didOpenBrowser = false;

const openBrowser = () => {
  if (didOpenBrowser || !isWindows) return;
  didOpenBrowser = true;
  log('opening browser: http://127.0.0.1:3000/');
  spawn('cmd', ['/c', 'start', '', 'http://127.0.0.1:3000/'], {
    stdio: 'ignore',
    detached: true
  }).unref();
};

const watchForViteReady = child => {
  child.stdout?.on('data', chunk => {
    const text = chunk.toString();
    process.stdout.write(text);
    if (text.includes('Local:') || text.includes('ready in')) {
      log('vite ready signal detected');
      openBrowser();
    }
  });

  child.stderr?.on('data', chunk => {
    process.stderr.write(chunk);
  });
};

const processes = [
  {
    name: 'api',
    child: runCommand(bin('tsx'), ['watch', 'src/server/app.ts'])
  },
  {
    name: 'vite',
    child: runCommand(
      bin('vite'),
      ['--port=3000', '--host=0.0.0.0', '--strictPort', '--force', '--configLoader', 'runner'],
      ['inherit', 'pipe', 'pipe']
    )
  }
];

if (processes[1]?.child.stdout) {
  watchForViteReady(processes[1].child);
}

let isShuttingDown = false;

const stopAll = (exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  for (const processInfo of processes) {
    if (!processInfo.child.killed) {
      processInfo.child.kill();
    }
  }

  process.exit(exitCode);
};

for (const processInfo of processes) {
  processInfo.child.on('exit', code => {
    log(`${processInfo.name} exited with code ${code}`);
    if (isShuttingDown) return;
    if (code && code !== 0) {
      console.error(`[dev:full] ${processInfo.name} exited with code ${code}`);
      stopAll(code);
    }
  });
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));
