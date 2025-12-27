const run = require("../utils/exec");

module.exports = async function subfinder(domain) {
  console.log(`  [subfinder] ════════════════════════════════════════`);
  console.log(`  [subfinder] Starting subdomain discovery`);
  console.log(`  [subfinder] Target: ${domain}`);
  
  try {
    // Validate domain
    if (!domain || typeof domain !== 'string') {
      throw new Error(`Invalid domain: ${domain}`);
    }
    
    const cleanDomain = domain.trim();
    console.log(`  [subfinder] Cleaned domain: ${cleanDomain}`);
    
    const cmd = `subfinder -d ${cleanDomain} -silent`;
    console.log(`  [subfinder] Command: ${cmd}`);
    
    const output = await run(cmd);
    
    console.log(`  [subfinder] Raw output received`);
    console.log(`  [subfinder] Output length: ${output.length} characters`);
    console.log(`  [subfinder] Output preview: ${output.substring(0, 200)}`);
    
    const subdomains = output
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean)
      .filter(s => !s.startsWith('#')) // Remove comments
      .filter(s => s.includes('.')); // Basic domain validation
    
    console.log(`  [subfinder] ✓ Parsed ${subdomains.length} valid subdomains`);
    
    if (subdomains.length > 0) {
      console.log(`  [subfinder] Sample subdomains (first 10):`);
      subdomains.slice(0, 10).forEach((sub, i) => {
        console.log(`  [subfinder]   ${i + 1}. ${sub}`);
      });
    } else {
      console.warn(`  [subfinder] ⚠ No subdomains found for ${cleanDomain}`);
    }
    
    console.log(`  [subfinder] ════════════════════════════════════════`);
    return subdomains;
    
  } catch (err) {
    console.error(`  [subfinder] ✗ ERROR occurred`);
    console.error(`  [subfinder] Error name: ${err.name}`);
    console.error(`  [subfinder] Error message: ${err.message}`);
    console.error(`  [subfinder] Error stack: ${err.stack}`);
    console.error(`  [subfinder] ════════════════════════════════════════`);
    throw new Error(`Subfinder failed: ${err.message}`);
  }
};