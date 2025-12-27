const run = require("../utils/exec");
const fs = require("fs");
const path = require("path");

module.exports = async function naabu(aliveHosts) {
  console.log(`  [naabu] ════════════════════════════════════════`);
  console.log(`  [naabu] Starting port scan`);
  console.log(`  [naabu] Input: ${aliveHosts.length} alive hosts`);
  
  if (!aliveHosts || !Array.isArray(aliveHosts)) {
    console.error(`  [naabu] ✗ Invalid input: expected array, got ${typeof aliveHosts}`);
    return [];
  }
  
  if (aliveHosts.length === 0) {
    console.log(`  [naabu] ⚠ No alive hosts to scan, returning empty array`);
    console.log(`  [naabu] ════════════════════════════════════════`);
    return [];
  }

  console.log(`  [naabu] Extracting URLs from alive hosts...`);
  const urls = aliveHosts.map(h => {
    const url = h.url || h;
    return url.replace("https://", "").replace("http://", "").split('/')[0];
  });
  
  // Remove duplicates
  const uniqueUrls = [...new Set(urls)];
  
  console.log(`  [naabu] Extracted ${uniqueUrls.length} unique hosts`);
  console.log(`  [naabu] Sample hosts:`, uniqueUrls.slice(0, 5));

  const filename = path.join("/tmp", "alive.txt");
  console.log(`  [naabu] Writing hosts to: ${filename}`);
  
  try {
    fs.writeFileSync(filename, uniqueUrls.join("\n"));
    console.log(`  [naabu] ✓ File written successfully`);
    console.log(`  [naabu] File size: ${fs.statSync(filename).size} bytes`);
  } catch (writeError) {
    console.error(`  [naabu] ✗ Failed to write file:`, writeError.message);
    return [];
  }

  // ⭐ FIXED: Scan ONLY the most common ports (80, 443, 8080, 8443, 3000, 22, 21, 25, 110, 143)
  const cmd = `naabu -l ${filename} -silent -json -p 80,443,8080,8443,3000,22,21,25,110,143 -rate 100`;
  console.log(`  [naabu] Executing: ${cmd}`);
  console.log(`  [naabu] Scanning only 10 most common ports (ultra-fast mode)`);

  try {
    // 1 minute timeout - should be plenty for 10 ports
    const output = await run(cmd, 60000);
    console.log(`  [naabu] ✓ Command completed`);
    console.log(`  [naabu] Raw output length: ${output.length} characters`);

    if (output.length === 0) {
      console.warn(`  [naabu] ⚠ No output received from naabu`);
      console.log(`  [naabu] ════════════════════════════════════════`);
      return [];
    }

    const lines = output.split("\n").filter(Boolean);
    console.log(`  [naabu] Parsing ${lines.length} JSON lines`);

    const results = [];
    lines.forEach((line, index) => {
      try {
        const parsed = JSON.parse(line);
        results.push(parsed);
        console.log(`  [naabu]   Line ${index + 1}: ${parsed.host}:${parsed.port}`);
      } catch (parseError) {
        console.error(`  [naabu]   ✗ Failed to parse line ${index + 1}:`, line.substring(0, 100));
        console.error(`  [naabu]   Parse error:`, parseError.message);
      }
    });
    
    console.log(`  [naabu] ✓ Successfully parsed ${results.length}/${lines.length} results`);
    
    if (results.length > 0) {
      console.log(`  [naabu] Port distribution:`);
      const portCounts = results.reduce((acc, r) => {
        acc[r.port] = (acc[r.port] || 0) + 1;
        return acc;
      }, {});
      console.log(`  [naabu]`, portCounts);
    }
    
    console.log(`  [naabu] ════════════════════════════════════════`);
    return results;
    
  } catch (err) {
    console.error(`  [naabu] ✗ ERROR occurred`);
    console.error(`  [naabu] Error message:`, err.message);
    console.error(`  [naabu] Error stack:`, err.stack);
    console.error(`  [naabu] ════════════════════════════════════════`);
    return [];
  }
};