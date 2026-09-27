import React from "react";

export default function ScanResults({ results }) {
  if (!results) return null;

  const subdomains = results.subdomains || [];
  const alive = results.alive || [];
  const ports = results.ports || [];
  const vulns = results.vulns || [];
  const metadata = results.metadata || {};
  const warnings = metadata.warnings || [];
  const stepResults = metadata.stepResults || {};
  const stepEntries = Object.entries(stepResults);
  const vulnwebProfile = metadata.targetProfiles?.vulnweb;
  const isLegacyResult = warnings.some(warning => warning.includes('HTTPx was skipped'))
    || stepResults.httpx?.error?.includes('Skipped - using direct URLs');

  const fallbackPortInfo = (port) => {
    const services = {
      21: ['FTP', 'File transfer service', 'Check if anonymous login or weak credentials are exposed.'],
      22: ['SSH', 'Remote server login', 'Normal for admins, risky if exposed with weak passwords.'],
      25: ['SMTP', 'Email sending service', 'Check for mail relay exposure and outdated mail software.'],
      80: ['HTTP', 'Normal website traffic', 'Usually normal for public websites; security depends on the web app.'],
      110: ['POP3', 'Email mailbox access', 'Risky if exposed without encryption or strong authentication.'],
      143: ['IMAP', 'Email mailbox access', 'Risky if exposed without encryption or strong authentication.'],
      443: ['HTTPS', 'Encrypted website traffic', 'Usually normal for public websites; check TLS and app security.'],
      3000: ['Dev web app', 'Common development server port', 'Can be risky on public internet if it exposes a dev/admin app.'],
      8080: ['HTTP alternate', 'Alternate web server or proxy', 'Check for admin panels, proxies, or staging apps.'],
      8443: ['HTTPS alternate', 'Alternate encrypted web server', 'Check for admin panels, proxies, or staging apps.']
    };
    const [service, description, risk] = services[Number(port)] || [
      'Unknown service',
      'A service is listening on this port',
      'Investigate whether this service should be public.'
    ];
    return { port, service, description, risk };
  };
  const explainedPorts = ports.map((portResult) => {
    const result = portResult && typeof portResult === 'object'
      ? portResult
      : { port: portResult };
    const fallbackInfo = fallbackPortInfo(result.port);
    const info = {
      ...fallbackInfo,
      ...(result.portInfo || {}),
      port: result.portInfo?.port ?? result.port ?? fallbackInfo.port ?? 'N/A',
      service: result.service || result.portInfo?.service || fallbackInfo.service || 'Unknown service'
    };

    return {
      ...result,
      info
    };
  });
  const portSummary = explainedPorts
    .map(({ info, host, ip }) => {
      const target = host || ip;
      return `${target ? `${target}:` : ''}${info.port} ${info.service}`;
    })
    .join(', ');
  const renderPortDetails = () => {
    if (explainedPorts.length === 0) return null;

    return (
      <>
        <h3 className="section-title"> Open Port Details</h3>
        <div className="port-grid">
          {explainedPorts.map((p, i) => {
            const info = p.info;
            const host = p.host || p.ip || results.domain || 'Unknown host';

            return (
              <div key={`${host}-${info.port}-${i}`} className="port-card">
                <div className="port-card-header">
                  <span className="port-number">{info.port}</span>
                  <span className="port-service">{info.service}</span>
                </div>
                <div className="port-host">{host}</div>
                <div className="port-description">{info.description}</div>
                <div className="port-risk">{info.risk}</div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="results-section">
      <h2 className="section-title"> Reconnaissance Results</h2>

      <div className="data-grid">
        <div className="data-card">
          <div className="data-card-title">Subdomains Found</div>
          <div className="data-card-value">{subdomains.length}</div>
        </div>
        <div className="data-card">
          <div className="data-card-title">Alive Hosts</div>
          <div className="data-card-value">{alive.length}</div>
        </div>
        <div className="data-card">
          <div className="data-card-title">Open Ports</div>
          <div className="data-card-value">{ports.length}</div>
          {portSummary && (
            <div className="data-card-subvalue">{portSummary}</div>
          )}
        </div>
        <div className="data-card">
          <div className="data-card-title">Vulnerabilities</div>
          <div className="data-card-value" style={{ color: vulns.length > 0 ? '#ff0040' : '#00ff41' }}>
            {vulns.length}
          </div>
        </div>
      </div>

      {renderPortDetails()}

      {(warnings.length > 0 || stepEntries.length > 0) && (
        <>
          <h3 className="section-title">Scan Diagnostics</h3>
          {warnings.length > 0 && (
            <ul className="warning-list">
              {isLegacyResult && (
                <li className="warning-item">
                  ⚠ This result was produced by the previous backend flow. Refresh the page and run the scan again to use live HTTPx and Naabu results.
                </li>
              )}
              {warnings.map((warning, i) => (
                <li key={i} className="warning-item">⚠ {warning}</li>
              ))}
            </ul>
          )}

          {stepEntries.length > 0 && (
            <div className="step-results-grid">
              {stepEntries.map(([name, step]) => (
                <div key={name} className={`step-result ${step.success ? 'success' : 'failed'}`}>
                  <div className="step-result-name">{name.toUpperCase()}</div>
                  <div className="step-result-detail">Count: {step.count}</div>
                  <div className="step-result-detail">
                    Duration: {((step.duration || 0) / 1000).toFixed(1)}s
                  </div>
                  {step.error && (
                    <div className="step-result-error">{step.error}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {vulnwebProfile && (
            <div className={`target-profile ${vulnwebProfile.networkLikelyUnavailable ? 'unavailable' : ''}`}>
              <div className="target-profile-header">
                <span className="target-profile-name">{vulnwebProfile.target}</span>
                <span className="target-profile-status">
                  {vulnwebProfile.networkLikelyUnavailable ? 'UNREACHABLE' : 'PROFILED'}
                </span>
              </div>
              <div className="target-profile-grid">
                <div>Checks: {vulnwebProfile.attemptedChecks}</div>
                <div>Reachable: {vulnwebProfile.reachableChecks}</div>
                <div>Findings: {vulnwebProfile.findingCount}</div>
                <div>Errors: {vulnwebProfile.errorCount}</div>
              </div>
              {vulnwebProfile.errorSamples?.length > 0 && (
                <ul className="target-profile-errors">
                  {vulnwebProfile.errorSamples.map((error, i) => (
                    <li key={i}>
                      <strong>{error.url}</strong> - {error.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {subdomains.length > 0 && (
        <>
          <h3 className="section-title"> Discovered Subdomains</h3>
          <ul>
            {subdomains.map((s, i) => (
              <li key={i}>🔗 {s}</li>
            ))}
          </ul>
        </>
      )}

      {alive.length > 0 && (
        <>
          <h3 className="section-title"> Active Hosts</h3>
          <ul>
            {alive.map((a, i) => (
              <li key={i}>
                🌍 <strong>{a.url}</strong> — HTTP {a.status_code || 'N/A'} — {a.title || 'No title'}
              </li>
            ))}
          </ul>
        </>
      )}

      {vulns.length > 0 && (
        <>
          <h3 className="section-title">🚨 Detected Vulnerabilities</h3>
          {vulns.map((v, i) => {
            const severity = (v.info?.severity || v.severity || 'unknown').toLowerCase();
            const template = v.info?.name || v.template || v['template-id'] || 'Unknown Vulnerability';
            const matched = v.matched || v['matched-at'] || v.host || 'N/A';
            const description = v.info?.description || 'No description available';
            
            return (
              <div key={i} className={`vuln-item ${severity}`}>
                <div className="vuln-header">
                  <span className={`vuln-severity ${severity}`}>
                    {severity.toUpperCase()}
                  </span>
                  <span className="vuln-name">{template}</span>
                </div>
                <div className="vuln-details">
                  <p> <strong>URL:</strong> <a href={matched} target="_blank" rel="noopener noreferrer" className="vuln-url">{matched}</a></p>
                  <p> <strong>Description:</strong> {description}</p>
                  {v.info?.reference && (
                    <p>🔗 <strong>Reference:</strong> {Array.isArray(v.info.reference) ? v.info.reference.join(', ') : v.info.reference}</p>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
