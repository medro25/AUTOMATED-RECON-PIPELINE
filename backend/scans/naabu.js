const run = require("../utils/exec");
const fs = require("fs");
const path = require("path");

const PORT_SERVICES = {
  21: {
    service: "FTP",
    description: "File transfer service",
    risk: "Check if anonymous login or weak credentials are exposed."
  },
  22: {
    service: "SSH",
    description: "Remote server login",
    risk: "Normal for admins, risky if exposed with weak passwords."
  },
  25: {
    service: "SMTP",
    description: "Email sending service",
    risk: "Check for mail relay exposure and outdated mail software."
  },
  80: {
    service: "HTTP",
    description: "Normal website traffic",
    risk: "Usually normal for public websites; security depends on the web app."
  },
  110: {
    service: "POP3",
    description: "Email mailbox access",
    risk: "Risky if exposed without encryption or strong authentication."
  },
  143: {
    service: "IMAP",
    description: "Email mailbox access",
    risk: "Risky if exposed without encryption or strong authentication."
  },
  443: {
    service: "HTTPS",
    description: "Encrypted website traffic",
    risk: "Usually normal for public websites; check TLS and app security."
  },
  3000: {
    service: "Dev web app",
    description: "Common development server port",
    risk: "Can be risky on public internet if it exposes a dev/admin app."
  },
  8080: {
    service: "HTTP alternate",
    description: "Alternate web server or proxy",
    risk: "Check for admin panels, proxies, or staging apps."
  },
  8443: {
    service: "HTTPS alternate",
    description: "Alternate encrypted web server",
    risk: "Check for admin panels, proxies, or staging apps."
  }
};

function explainPort(port) {
  const numericPort = Number(port);
  const info = PORT_SERVICES[numericPort] || {
    service: "Unknown service",
    description: "A service is listening on this port",
    risk: "Investigate whether this service should be public."
  };

  return {
    port: numericPort || port,
    ...info
  };
}

function extractHostname(target) {
  const rawTarget = typeof target === "string"
    ? target
    : target?.url || target?.host || target?.hostname || target?.ip || target?.address || "";
  const trimmed = String(rawTarget).trim();

  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `http://${trimmed}`);
    return parsed.hostname || trimmed;
  } catch (err) {
    return trimmed
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      .replace(/:\d+$/, "");
  }
}

function coercePort(...values) {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;

    const stringValue = String(value).trim();
    if (/^\d+$/.test(stringValue)) {
      return Number(stringValue);
    }

    const portMatch = stringValue.match(/:(\d{1,5})(?:\/|\s|$)/);
    if (portMatch) {
      return Number(portMatch[1]);
    }
  }

  return null;
}

function parseNaabuLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch (err) {
    const match = trimmed.match(/^(.+?)(?::|\s+)(\d{1,5})$/);
    if (!match) return null;

    return {
      host: extractHostname(match[1]),
      port: Number(match[2])
    };
  }
}

function normalizeNaabuFinding(parsed) {
  if (!parsed || typeof parsed !== "object") return null;

  const port = coercePort(
    parsed.port,
    parsed["port-id"],
    parsed.url,
    parsed.input,
    parsed.host
  );

  if (!port) return null;

  const host = extractHostname(
    parsed.host || parsed.hostname || parsed.input || parsed.url || parsed.ip || parsed.address
  );
  const portInfo = explainPort(port);

  return {
    ...parsed,
    host: host || parsed.host || parsed.ip || "Unknown host",
    ip: parsed.ip || parsed.address || null,
    port,
    service: parsed.service || portInfo.service,
    portInfo
  };
}

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
  const urls = aliveHosts.map(extractHostname).filter(Boolean);
  
  // Remove duplicates
  const uniqueUrls = [...new Set(urls)];
  
  console.log(`  [naabu] Extracted ${uniqueUrls.length} unique hosts`);
  console.log(`  [naabu] Sample hosts:`, uniqueUrls.slice(0, 5));

  const filename = path.join("/tmp", `alive-${process.pid}-${Date.now()}.txt`);
  console.log(`  [naabu] Writing hosts to: ${filename}`);
  
  try {
    fs.writeFileSync(filename, `${uniqueUrls.join("\n")}\n`);
    console.log(`  [naabu] ✓ File written successfully`);
    console.log(`  [naabu] File size: ${fs.statSync(filename).size} bytes`);
  } catch (writeError) {
    console.error(`  [naabu] ✗ Failed to write file:`, writeError.message);
    return [];
  }

  // Scan ONLY the most common ports (80, 443, 8080, 8443, 3000, 22, 21, 25, 110, 143)
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
    const seen = new Set();
    lines.forEach((line, index) => {
      const parsed = parseNaabuLine(line);
      const normalized = normalizeNaabuFinding(parsed);

      if (!normalized) {
        console.error(`  [naabu]   ✗ Failed to parse line ${index + 1}:`, line.substring(0, 100));
        return;
      }

      const dedupeKey = `${normalized.host}:${normalized.ip || ''}:${normalized.port}`;
      if (seen.has(dedupeKey)) {
        return;
      }

      seen.add(dedupeKey);
      results.push(normalized);
      console.log(`  [naabu]   Line ${index + 1}: ${normalized.host}:${normalized.port} (${normalized.service})`);
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
    throw new Error(`Naabu failed: ${err.message}`);
  }
};

module.exports.explainPort = explainPort;
module.exports.extractHostname = extractHostname;
module.exports.parseNaabuLine = parseNaabuLine;
module.exports.normalizeNaabuFinding = normalizeNaabuFinding;
