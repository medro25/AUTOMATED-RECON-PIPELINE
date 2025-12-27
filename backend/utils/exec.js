const { exec } = require("child_process");

module.exports = function run(cmd, timeout = 300000) { // 5 minute default timeout
  console.log(`    [exec] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`    [exec] Executing command: ${cmd}`);
  console.log(`    [exec] Timeout: ${timeout}ms (${timeout/1000}s)`);
  console.log(`    [exec] Working directory: ${process.cwd()}`);
  
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const childProcess = exec(cmd, { 
      timeout,
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      killSignal: 'SIGKILL'
    }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      
      if (error) {
        console.error(`    [exec] ✗ Command failed after ${duration}ms`);
        console.error(`    [exec] Error code: ${error.code}`);
        console.error(`    [exec] Error signal: ${error.signal}`);
        console.error(`    [exec] Error message: ${error.message}`);
        
        // ⭐ CRITICAL FIX: If SIGKILL and we have stdout, return it instead of rejecting!
        if (error.killed && error.signal === 'SIGKILL' && stdout && stdout.length > 0) {
          console.warn(`    [exec] ⚠ Process was killed, but stdout was captured (${stdout.length} chars)`);
          console.warn(`    [exec] ✓ Returning partial results from stdout`);
          console.log(`    [exec] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          return resolve(stdout.trim());
        }
        
        if (stderr) {
          console.error(`    [exec] Stderr output (${stderr.length} chars):`);
          console.error(`    [exec]`, stderr.substring(0, 500));
          if (stderr.length > 500) {
            console.error(`    [exec] ... (truncated ${stderr.length - 500} chars)`);
          }
        }
        
        if (stdout) {
          console.error(`    [exec] Stdout output (${stdout.length} chars):`);
          console.error(`    [exec]`, stdout.substring(0, 500));
          if (stdout.length > 500) {
            console.error(`    [exec] ... (truncated ${stdout.length - 500} chars)`);
          }
        }
        
        console.error(`    [exec] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        return reject(error);
      }
      
      console.log(`    [exec] ✓ Command completed successfully in ${duration}ms`);
      console.log(`    [exec] Stdout length: ${stdout.length} characters`);
      console.log(`    [exec] Stdout lines: ${stdout.split('\n').length}`);
      
      if (stderr) {
        console.log(`    [exec] ⚠ Stderr (non-fatal, ${stderr.length} chars):`, stderr.substring(0, 200));
      }
      
      if (stdout.length === 0) {
        console.warn(`    [exec] ⚠ WARNING: Command produced no output`);
      }
      
      console.log(`    [exec] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      resolve(stdout.trim());
    });

    childProcess.on('exit', (code, signal) => {
      const duration = Date.now() - startTime;
      console.log(`    [exec] Process exited after ${duration}ms`);
      console.log(`    [exec] Exit code: ${code}`);
      if (signal) console.log(`    [exec] Signal: ${signal}`);
    });

    childProcess.on('error', (err) => {
      console.error(`    [exec] Process error event:`, err.message);
    });
  });
};