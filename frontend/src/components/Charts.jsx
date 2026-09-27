import React from "react";
import { Doughnut, Bar, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

export default function Charts({ results }) {
  const vulnerabilities = results?.vulns || [];
  const alive = results?.alive || [];
  const nucleiStep = results?.metadata?.stepResults?.nuclei;

  if (!vulnerabilities || vulnerabilities.length === 0) {
    const nucleiDidNotRun = nucleiStep && !nucleiStep.success;
    const noAliveHosts = alive.length === 0;

    const message = nucleiDidNotRun || noAliveHosts
      ? "No vulnerability verdict: Nuclei did not scan because no responsive HTTP/HTTPS hosts were found."
      : "No vulnerabilities were reported by Nuclei for the reachable targets.";

    return (
      <div className="charts-section">
        <h2 className="section-title">📊 Vulnerability Analysis</h2>
        <div className={`analysis-message ${nucleiDidNotRun || noAliveHosts ? 'warning' : 'success'}`}>
          {message}
        </div>
      </div>
    );
  }

  // Severity distribution
  const severityCount = vulnerabilities.reduce((acc, v) => {
    const severity = (v.info?.severity || v.severity || 'unknown').toLowerCase();
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {});

  const severityData = {
    labels: Object.keys(severityCount).map(s => s.toUpperCase()),
    datasets: [{
      label: "Vulnerabilities by Severity",
      data: Object.values(severityCount),
      backgroundColor: [
        "rgba(255, 0, 64, 0.8)",    // Critical - Red
        "rgba(255, 102, 0, 0.8)",   // High - Orange
        "rgba(255, 170, 0, 0.8)",   // Medium - Yellow
        "rgba(0, 255, 65, 0.8)",    // Low - Green
        "rgba(0, 204, 255, 0.8)"    // Info - Blue
      ],
      borderColor: "#00ff41",
      borderWidth: 2,
    }],
  };

  // Type distribution (extract from template names)
  const typeCount = vulnerabilities.reduce((acc, v) => {
    const template = (v.info?.name || v.template || '').toLowerCase();
    if (template.includes('xss')) acc['XSS'] = (acc['XSS'] || 0) + 1;
    else if (template.includes('sql')) acc['SQLi'] = (acc['SQLi'] || 0) + 1;
    else if (template.includes('rce')) acc['RCE'] = (acc['RCE'] || 0) + 1;
    else if (template.includes('ssrf')) acc['SSRF'] = (acc['SSRF'] || 0) + 1;
    else if (template.includes('lfi') || template.includes('file')) acc['LFI'] = (acc['LFI'] || 0) + 1;
    else acc['Other'] = (acc['Other'] || 0) + 1;
    return acc;
  }, {});

  const typeData = {
    labels: Object.keys(typeCount),
    datasets: [{
      label: "Vulnerabilities by Type",
      data: Object.values(typeCount),
      backgroundColor: "rgba(0, 255, 65, 0.5)",
      borderColor: "#00ff41",
      borderWidth: 2,
    }],
  };

  // Risk radar chart
  const radarData = {
    labels: ['Critical', 'High', 'Medium', 'Low', 'Info'],
    datasets: [{
      label: 'Risk Profile',
      data: [
        severityCount.critical || 0,
        severityCount.high || 0,
        severityCount.medium || 0,
        severityCount.low || 0,
        severityCount.info || 0
      ],
      backgroundColor: 'rgba(255, 0, 64, 0.2)',
      borderColor: '#ff0040',
      borderWidth: 2,
      pointBackgroundColor: '#ff0040',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#ff0040'
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: '#00ff41',
          font: {
            family: "'Fira Code', monospace",
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 14, 39, 0.9)',
        titleColor: '#00ff41',
        bodyColor: '#00ff41',
        borderColor: '#00ff41',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: '#00ff41' },
        grid: { color: 'rgba(0, 255, 65, 0.1)' }
      },
      y: {
        ticks: { color: '#00ff41' },
        grid: { color: 'rgba(0, 255, 65, 0.1)' }
      }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: '#00ff41',
          font: { family: "'Fira Code', monospace", size: 12 }
        }
      }
    },
    scales: {
      r: {
        ticks: { color: '#00ff41', backdropColor: 'transparent' },
        grid: { color: 'rgba(0, 255, 65, 0.2)' },
        pointLabels: { color: '#00ff41', font: { size: 12 } }
      }
    }
  };

  return (
    <div className="charts-section">
      <h2 className="section-title">📊 Vulnerability Analysis Dashboard</h2>
      
      <div className="data-grid">
        <div className="data-card">
          <div className="data-card-title">Total Vulnerabilities</div>
          <div className="data-card-value">{vulnerabilities.length}</div>
        </div>
        <div className="data-card">
          <div className="data-card-title">Critical</div>
          <div className="data-card-value" style={{ color: '#ff0040' }}>
            {severityCount.critical || 0}
          </div>
        </div>
        <div className="data-card">
          <div className="data-card-title">High</div>
          <div className="data-card-value" style={{ color: '#ff6600' }}>
            {severityCount.high || 0}
          </div>
        </div>
        <div className="data-card">
          <div className="data-card-title">Medium</div>
          <div className="data-card-value" style={{ color: '#ffaa00' }}>
            {severityCount.medium || 0}
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3 className="chart-title">Severity Distribution</h3>
          <Doughnut data={severityData} options={chartOptions} />
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Vulnerability Types</h3>
          <Bar data={typeData} options={chartOptions} />
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Risk Radar</h3>
          <Radar data={radarData} options={radarOptions} />
        </div>
      </div>
    </div>
  );
}
