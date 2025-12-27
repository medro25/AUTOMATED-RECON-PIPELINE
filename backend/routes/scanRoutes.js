const express = require("express");
const router = express.Router();

const subfinder = require("../scans/subfinder");
const httpx = require("../scans/httpx");
const naabu = require("../scans/naabu");
const nuclei = require("../scans/nuclei");

router.post("/scan", async (req, res) => {
  const requestId = Date.now();
  const { domain } = req.body;

  console.log("\n" + "█".repeat(60));
  console.log(`[SCAN-${requestId}] NEW SCAN REQUEST RECEIVED`);
  console.log("█".repeat(60));
  console.log(`[SCAN-${requestId}] Timestamp:`, new Date().toISOString());
  console.log(`[SCAN-${requestId}] Domain:`, domain);

  if (!domain) {
    console.error(`[SCAN-${requestId}] ✗ ERROR: No domain provided`);
    return res.status(400).json({ 
      error: "Domain is required",
      requestId,
      timestamp: new Date().toISOString()
    });
  }

  const startTime = Date.now();
  let stepResults = {
    subfinder: { success: false, count: 0, duration: 0, error: null },
    httpx: { success: false, count: 0, duration: 0, error: "SKIPPED - Using direct URLs" },
    naabu: { success: false, count: 0, duration: 0, error: "SKIPPED - Using direct URLs" },
    nuclei: { success: false, count: 0, duration: 0, error: null }
  };

  let subdomains = [];
  let alive = [];
  let ports = [];
  let vulns = [];

  // ⭐ STEP 1: Try Subfinder (with quick timeout)
  console.log(`\n[SCAN-${requestId}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[SCAN-${requestId}] [1/4] ATTEMPTING SUBFINDER (30s timeout)`);
  const subfinderStart = Date.now();
  
  try {
    // Set a Promise race with 30 second timeout
    subdomains = await Promise.race([
      subfinder(domain),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Subfinder timeout')), 30000)
      )
    ]);
    
    const subfinderDuration = Date.now() - subfinderStart;
    stepResults.subfinder = { success: true, count: subdomains.length, duration: subfinderDuration, error: null };
    console.log(`[SCAN-${requestId}] ✓ Subfinder completed in ${subfinderDuration}ms`);
    console.log(`[SCAN-${requestId}] ✓ Found ${subdomains.length} subdomains`);
  } catch (subfinderError) {
    const subfinderDuration = Date.now() - subfinderStart;
    stepResults.subfinder = { success: false, count: 0, duration: subfinderDuration, error: subfinderError.message };
    console.warn(`[SCAN-${requestId}] ⚠ Subfinder failed/timeout: ${subfinderError.message}`);
    subdomains = [];
  }

  // ⭐ STEP 2: SKIP HTTPx - Force direct URLs
  console.log(`\n[SCAN-${requestId}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[SCAN-${requestId}] [2/4] SKIPPING HTTPX - Using direct URLs`);
  console.log(`[SCAN-${requestId}] ⚠ HTTPx has been disabled due to timeout issues`);
  
  // Force both HTTPS and HTTP URLs
  alive = [
    { url: `https://${domain}`, status_code: 0, title: 'Direct HTTPS' },
    { url: `http://${domain}`, status_code: 0, title: 'Direct HTTP' }
  ];
  
  console.log(`[SCAN-${requestId}] ✓ Using fallback URLs:`);
  console.log(`[SCAN-${requestId}]   - https://${domain}`);
  console.log(`[SCAN-${requestId}]   - http://${domain}`);
  
  stepResults.httpx = { 
    success: true, 
    count: 2, 
    duration: 0, 
    error: "Skipped - using direct URLs to avoid timeout" 
  };

  // ⭐ STEP 3: SKIP Naabu - Too slow
  console.log(`\n[SCAN-${requestId}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[SCAN-${requestId}] [3/4] SKIPPING NAABU - Port scanning disabled`);
  console.log(`[SCAN-${requestId}] ⚠ Naabu has been disabled due to timeout issues`);
  
  ports = [];
  stepResults.naabu = { 
    success: true, 
    count: 0, 
    duration: 0, 
    error: "Skipped - port scanning disabled to avoid timeout" 
  };

  // ⭐ STEP 4: Run ONLY Nuclei (the most important scanner)
  console.log(`\n[SCAN-${requestId}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[SCAN-${requestId}] [4/4] STARTING NUCLEI (VULNERABILITY SCANNER)`);
  console.log(`[SCAN-${requestId}] Scanning ${alive.length} target(s)...`);
  
  const nucleiStart = Date.now();
  
  try {
    vulns = await nuclei(alive);
    const nucleiDuration = Date.now() - nucleiStart;
    stepResults.nuclei = { success: true, count: vulns.length, duration: nucleiDuration, error: null };
    
    console.log(`[SCAN-${requestId}] ✓ Nuclei completed in ${nucleiDuration}ms`);
    console.log(`[SCAN-${requestId}] ✓ Found ${vulns.length} vulnerabilities`);
    
    if (vulns.length > 0) {
      const severityCounts = vulns.reduce((acc, v) => {
        const severity = v.info?.severity || v.severity || 'unknown';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {});
      console.log(`[SCAN-${requestId}] Vulnerability breakdown:`, severityCounts);
      
      console.log(`[SCAN-${requestId}] Top 5 vulnerabilities:`);
      vulns.slice(0, 5).forEach((v, i) => {
        const severity = v.info?.severity || v.severity || 'unknown';
        const templateId = v.info?.name || v.template || v['template-id'] || 'unknown';
        console.log(`[SCAN-${requestId}]   ${i + 1}. [${severity.toUpperCase()}] ${templateId}`);
      });
    }
  } catch (nucleiError) {
    const nucleiDuration = Date.now() - nucleiStart;
    stepResults.nuclei = { success: false, count: 0, duration: nucleiDuration, error: nucleiError.message };
    console.error(`[SCAN-${requestId}] ✗ Nuclei failed: ${nucleiError.message}`);
    vulns = [];
  }

  // Return results
  const totalDuration = Date.now() - startTime;
  console.log(`\n[SCAN-${requestId}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[SCAN-${requestId}] ✓✓✓ SCAN COMPLETED ✓✓✓`);
  console.log(`[SCAN-${requestId}] Total duration: ${totalDuration}ms (${(totalDuration/1000).toFixed(2)}s)`);
  console.log(`[SCAN-${requestId}] Results summary:`);
  console.log(`[SCAN-${requestId}]   - Subdomains: ${subdomains.length}`);
  console.log(`[SCAN-${requestId}]   - Alive hosts: ${alive.length} (forced)`);
  console.log(`[SCAN-${requestId}]   - Open ports: ${ports.length} (skipped)`);
  console.log(`[SCAN-${requestId}]   - Vulnerabilities: ${vulns.length}`);
  console.log("█".repeat(60) + "\n");

  return res.json({
    requestId,
    domain,
    subdomains,
    alive,
    ports,
    vulns,
    metadata: {
      totalDuration,
      stepResults,
      timestamp: new Date().toISOString(),
      warnings: [
        "HTTPx was skipped to avoid timeout issues",
        "Naabu was skipped to avoid timeout issues",
        "Only Nuclei vulnerability scanning was performed"
      ],
      fallbacksUsed: [
        "Direct HTTPS and HTTP URLs used for scanning",
        "Subfinder attempted but may have timed out"
      ]
    }
  });
});

module.exports = router;