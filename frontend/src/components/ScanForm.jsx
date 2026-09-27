import React, { useState } from "react";
import axios from "axios";

export default function ScanForm({ setResults, setLoading, setProgress }) {
  const [domain, setDomain] = useState("");

  const startScan = async () => {
    if (!domain.trim()) {
      alert(" Please enter a domain");
      return;
    }

    const cleanDomain = domain.trim();
    setLoading(true);
    setResults(null);
    
    // Initialize progress tracking
    setProgress({
      currentStep: 1,
      totalSteps: 4,
      steps: [
        { name: 'Subfinder', status: 'running', progress: 0, eta: 30, details: 'Discovering subdomains...' },
        { name: 'HTTPx', status: 'pending', progress: 0, eta: 0, details: 'Waiting...' },
        { name: 'Naabu', status: 'pending', progress: 0, eta: 0, details: 'Waiting...' },
        { name: 'Nuclei', status: 'pending', progress: 0, eta: 0, details: 'Waiting...' }
      ],
      startTime: Date.now(),
      estimatedTotal: 780 // 13 minutes in seconds
    });

    const apiUrl = "http://localhost:5001/api/scan";
    const payload = { domain: cleanDomain };

    try {
      const response = await axios.post(apiUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 1800000 // 30 minutes
      });

      setResults(response.data);
      
      const finalStepResults = response.data?.metadata?.stepResults || {};

      setProgress(prev => ({
        ...prev,
        currentStep: 4,
        steps: prev.steps.map(s => {
          const stepResult = finalStepResults[s.name.toLowerCase()];
          if (!stepResult) {
            return { ...s, status: 'completed', progress: 100 };
          }

          return {
            ...s,
            status: stepResult.success ? 'completed' : 'error',
            progress: 100,
            details: stepResult.error || `Found ${stepResult.count} result(s)`
          };
        })
      }));

    } catch (err) {
      console.error("Scan failed:", err);
      alert(` Scan failed: ${err.response?.data?.error || err.message}`);
      
      setProgress(prev => ({
        ...prev,
        steps: prev.steps.map((s, i) => 
          i === prev.currentStep - 1 ? { ...s, status: 'error' } : s
        )
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scan-form">
      <input
        type="text"
        placeholder="Enter target domain (e.g., example.com)"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && startScan()}
      />
      <button onClick={startScan}>
         Initiate Scan
      </button>
    </div>
  );
}
