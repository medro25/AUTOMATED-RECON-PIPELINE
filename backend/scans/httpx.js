const run = require("../utils/exec");
const fs = require("fs");
const path = require("path");

module.exports = async function httpx(subdomains) {
  console.log(`  [httpx] ════════════════════════════════════════`);
  console.log(`  [httpx] Starting HTTP probe`);
  console.log(`  [httpx] Input: ${subdomains.length} subdomains`);
  
  if (!subdomains || !Array.isArray(subdomains)) {
    console.error(`  [httpx] ✗ Invalid input: expected array, got ${typeof subdomains}`);
    return [];
  }
  
  if (subdomains.length === 0) {
    console.log(`  [httpx] ⚠ No subdomains to probe, returning empty array`);
    console.log(`  [httpx] ════════════════════════════════════════`);
    return [];
  }

  const filename = path.join("/tmp", "subdomains.txt");
  console.log(`  [httpx] Writing subdomains to: ${filename}`);
  
  try {
    fs.writeFileSync(filename, subdomains.join("\n"));
    console.log(`  [httpx] ✓ File written successfully`);
    console.log(`  [httpx] File size: ${fs.statSync(filename).size} bytes`);
  } catch (writeError) {
    console.error(`  [httpx] ✗ Failed to write file:`, writeError.message);
    return [];
  }

  // ⭐ FIXED: Reduced timeout and simplified flags
  const cmd = `httpx -l ${filename} -silent -json -timeout 5 -retries 1 -threads 10 -rate-limit 50 -no-color`;
  console.log(`  [httpx] Executing: ${cmd}`);
  console.log(`  [httpx] Using fast settings: 5s timeout, 1 retry, 10 threads`);
  
  try {
    // 2 minute timeout
    const output = await run(cmd, 120000);
    console.log(`  [httpx] ✓ Command completed`);
    console.log(`  [httpx] Raw output length: ${output.length} characters`);

    if (output.length === 0) {
      console.warn(`  [httpx] ⚠ No output received from httpx`);
      console.log(`  [httpx] ════════════════════════════════════════`);
      return [];
    }

    const lines = output.split("\n").filter(Boolean);
    console.log(`  [httpx] Parsing ${lines.length} JSON lines`);

    const results = [];
    lines.forEach((line, index) => {
      try {
        const parsed = JSON.parse(line);
        results.push(parsed);
        console.log(`  [httpx]   Line ${index + 1}: ${parsed.url} (${parsed.status_code})`);
      } catch (parseError) {
        console.error(`  [httpx]   ✗ Failed to parse line ${index + 1}:`, line.substring(0, 100));
      }
    });
    
    console.log(`  [httpx] ✓ Successfully parsed ${results.length}/${lines.length} results`);
    
    if (results.length > 0) {
      console.log(`  [httpx] Sample results (first 5):`);
      results.slice(0, 5).forEach((r, i) => {
        console.log(`  [httpx]   ${i + 1}. ${r.url} - Status: ${r.status_code} - Length: ${r.content_length || 'N/A'}`);
      });
    }
    
    console.log(`  [httpx] ════════════════════════════════════════`);
    return results;
    
  } catch (err) {
    console.error(`  [httpx] ✗ ERROR occurred`);
    console.error(`  [httpx] Error message:`, err.message);
    console.error(`  [httpx] ════════════════════════════════════════`);
    return [];
  }
};