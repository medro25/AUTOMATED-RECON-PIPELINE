const run = require("../utils/exec");
const fs = require("fs");
const path = require("path");

module.exports = async function nuclei(aliveHosts) {
  console.log(`  [nuclei] ════════════════════════════════════════`);
  console.log(`  [nuclei] Starting vulnerability scan`);
  console.log(`  [nuclei] Input: ${aliveHosts.length} alive hosts`);
  
  if (!aliveHosts || !Array.isArray(aliveHosts)) {
    console.error(`  [nuclei] ✗ Invalid input: expected array, got ${typeof aliveHosts}`);
    return [];
  }
  
  if (aliveHosts.length === 0) {
    console.log(`  [nuclei] ⚠ No alive hosts to scan, returning empty array`);
    console.log(`  [nuclei] ════════════════════════════════════════`);
    return [];
  }

  // ⭐ VERIFY TEMPLATES ARE INSTALLED
  console.log(`  [nuclei] Verifying templates are installed...`);
  try {
    const templateCheck = await run(`ls /root/.config/nuclei-templates/ | wc -l`, 5000);
    const templateCount = parseInt(templateCheck.trim());
    console.log(`  [nuclei] Found ${templateCount} template directories`);
    
    if (templateCount < 5) {
      console.error(`  [nuclei] ✗ Templates not found! Only ${templateCount} directories detected`);
      throw new Error(`Templates missing: only ${templateCount} directories found, need at least 5`);
    }
    
    const yamlCheck = await run(`find /root/.config/nuclei-templates/ -name "*.yaml" | wc -l`, 10000);
    const yamlCount = parseInt(yamlCheck.trim());
    console.log(`  [nuclei] Found ${yamlCount} YAML template files`);
    
    if (yamlCount < 100) {
      console.error(`  [nuclei] ✗ Not enough templates! Only ${yamlCount} YAML files found`);
      throw new Error(`Insufficient templates: ${yamlCount} found, need at least 100`);
    }
    
    console.log(`  [nuclei] ✓ Templates verified successfully`);
  } catch (verifyError) {
    console.error(`  [nuclei] ✗ Template verification failed:`, verifyError.message);
    throw new Error(`Cannot scan: ${verifyError.message}`);
  }

  console.log(`  [nuclei] Extracting URLs from alive hosts...`);
  const urls = aliveHosts.map(h => h.url || h);
  console.log(`  [nuclei] Target URLs (${urls.length}):`);
  urls.slice(0, 10).forEach((url, i) => {
    console.log(`  [nuclei]   ${i + 1}. ${url}`);
  });

  const targetsFile = path.join("/tmp", "targets.txt");
  const outputFile = path.join("/tmp", `nuclei-output-${Date.now()}.jsonl`);
  
  console.log(`  [nuclei] Writing targets to: ${targetsFile}`);
  console.log(`  [nuclei] Output will be saved to: ${outputFile}`);
  
  try {
    fs.writeFileSync(targetsFile, urls.join("\n"));
    console.log(`  [nuclei] ✓ Targets file written successfully`);
    console.log(`  [nuclei] File size: ${fs.statSync(targetsFile).size} bytes`);
  } catch (writeError) {
    console.error(`  [nuclei] ✗ Failed to write targets file:`, writeError.message);
    return [];
  }

 const cmd = `nuclei -l ${targetsFile} -jsonl -tags exposure,xss,sqli,lfi,rce,ssrf -severity critical,high,medium,low -c 10 -timeout 15 -rl 50`;

  console.log(`  [nuclei] Executing: ${cmd}`);
  console.log(`  [nuclei] Template path: /root/.config/nuclei-templates/`);
  console.log(`  [nuclei] Tags: exposure, xss, sqli, lfi, rce, ssrf`);
  console.log(`  [nuclei] ⚠ This scan will take 2-8 minutes...`);

  const scanStart = Date.now();

  try {
    // ⭐ Capture stdout DIRECTLY (not from file)
    const output = await run(cmd, 900000); // 15 minute timeout
    const scanDuration = Date.now() - scanStart;
    
    console.log(`  [nuclei] ✓ Command completed after ${scanDuration}ms (${(scanDuration/1000/60).toFixed(2)} minutes)`);
    console.log(`  [nuclei] Output length: ${output.length} characters`);
    
    if (output.length === 0) {
      console.warn(`  [nuclei] ⚠ No output received - target may be secure or unreachable`);
      console.log(`  [nuclei] ════════════════════════════════════════`);
      return [];
    }

    // Show first 2000 characters for debugging
    console.log(`  [nuclei] Content preview (first 2000 chars):`);
    console.log(output.substring(0, 2000));

    // Parse JSONL output from stdout (not from a file!)
    const lines = output.split("\n").filter(line => line.trim());
    console.log(`  [nuclei] Total lines: ${lines.length}`);
    console.log(`  [nuclei] Parsing JSON lines...`);

    const results = [];
    let jsonCount = 0;
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Skip empty lines and non-JSON lines (like warnings)
      if (!trimmed || !trimmed.startsWith('{')) return;
      
      try {
        const parsed = JSON.parse(trimmed);
        jsonCount++;
        results.push(parsed);
        
        const severity = parsed.info?.severity || parsed.severity || 'unknown';
        const templateId = parsed.info?.name || parsed.template || parsed['template-id'] || 'unknown';
        
        console.log(`  [nuclei]   ✓ Vuln ${results.length}: [${severity.toUpperCase()}] ${templateId}`);
      } catch (parseError) {
        console.error(`  [nuclei]   ✗ Line ${index + 1}: Parse error: ${parseError.message}`);
      }
    });
    
    console.log(`\n  [nuclei] Parsing summary:`);
    console.log(`  [nuclei]   - JSON lines parsed: ${jsonCount}`);
    console.log(`  [nuclei]   - Valid vulnerabilities: ${results.length}`);
    
    if (results.length > 0) {
      console.log(`\n  [nuclei] 🎯 VULNERABILITIES FOUND!`);
      const severityCounts = results.reduce((acc, r) => {
        const severity = r.info?.severity || r.severity || 'unknown';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {});
      console.log(`  [nuclei] Severity breakdown:`, JSON.stringify(severityCounts, null, 2));
    } else {
      console.log(`\n  [nuclei] ℹ No vulnerabilities detected`);
    }
    
    console.log(`  [nuclei] ════════════════════════════════════════`);
    return results;
    
  } catch (err) {
    const scanDuration = Date.now() - scanStart;
    console.error(`  [nuclei] ✗ ERROR occurred after ${scanDuration}ms`);
    console.error(`  [nuclei] Error message: ${err.message}`);
    console.error(`  [nuclei] ════════════════════════════════════════`);
    return [];
  }
};