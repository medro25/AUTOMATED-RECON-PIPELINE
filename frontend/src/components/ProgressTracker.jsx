import React, { useEffect, useState } from "react";

export default function ProgressTracker({ progress }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!progress) return;

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - progress.startTime) / 1000);
      setElapsed(elapsedSeconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [progress]);

  if (!progress) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTime = Math.max(0, progress.estimatedTotal - elapsed);

  const getStepIcon = (status) => {
    switch (status) {
      case 'running': return '⚡';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="progress-section">
      <div className="progress-header">
        <h2 className="progress-title">
          🔍 RECONNAISSANCE IN PROGRESS
        </h2>
        <p className="progress-subtitle">
          Elapsed: {formatTime(elapsed)} | Remaining: ~{formatTime(remainingTime)}
        </p>
        <div className="estimated-time">
          ⏱️ ETA: ~{Math.ceil(remainingTime / 60)} minutes
        </div>
      </div>

      <div className="progress-steps">
        {progress.steps.map((step, index) => (
          <div 
            key={index}
            className={`progress-step ${step.status === 'running' ? 'active' : ''} ${step.status === 'completed' ? 'completed' : ''} ${step.status === 'error' ? 'error' : ''}`}
          >
            <div className="step-header">
              <span className="step-icon">{getStepIcon(step.status)}</span>
              <span className="step-name">
                [{index + 1}/4] {step.name}
              </span>
              <span className={`step-status ${step.status}`}>
                {step.status.toUpperCase()}
              </span>
            </div>
            
            <div className="step-details">
              {step.details}
              {step.status === 'running' && step.eta > 0 && (
                <span> (ETA: ~{step.eta}s)</span>
              )}
            </div>

            {step.status === 'running' && (
              <div className="step-progress-bar">
                <div 
                  className="step-progress-fill" 
                  style={{ width: `${step.progress}%` }}
                />
              </div>
            )}

            {step.status === 'completed' && (
              <div className="terminal-output">
                <div className="terminal-line">
                  ✓ Scan phase completed successfully
                </div>
              </div>
            )}

            {step.status === 'error' && (
              <div className="terminal-output">
                <div className="terminal-line error">
                  ✗ Scan phase failed or timed out
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}