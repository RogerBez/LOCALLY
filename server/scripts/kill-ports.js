const { exec } = require('child_process');

const ports = [3000, 5000]; // Client (3000) and Server (5000) ports

console.log('🔍 Checking for processes on ports:', ports.join(', '));

ports.forEach(port => {
  // For Windows
  const windowsCommand = `netstat -ano | findstr :${port}`;
  // For Unix/Mac
  const unixCommand = `lsof -i :${port} | grep LISTEN | awk '{print $2}'`;

  const isWindows = process.platform === 'win32';
  const command = isWindows ? windowsCommand : unixCommand;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`✨ Port ${port} is already free`);
      return;
    }

    if (stdout) {
      const pid = isWindows ? 
        stdout.split('\r\n')[0].split(' ').filter(Boolean).pop() :
        stdout.trim();

      const killCommand = isWindows ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`;
      
      exec(killCommand, (err, out, stderr) => {
        if (err) {
          console.error(`❌ Error killing process on port ${port}:`, err);
        } else {
          console.log(`✅ Successfully killed process on port ${port} (PID: ${pid})`);
        }
      });
    }
  });
});
