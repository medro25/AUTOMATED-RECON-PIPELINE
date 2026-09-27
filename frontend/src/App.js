import React, { useState } from "react";
import ScanForm from "./components/ScanForm";
import ProgressTracker from "./components/ProgressTracker";
import ScanResults from "./components/ScanResults";
import Charts from "./components/Charts";
import "./styles.css";

function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);

  return (
    <div className="container">
      <h1>AUTOMATED RECON PIPELINE</h1>

      <ScanForm 
        setResults={setResults} 
        setLoading={setLoading} 
        setProgress={setProgress}
      />

      {loading && <ProgressTracker progress={progress} />}

      {results && (
        <>
          <ScanResults results={results} />
          <Charts results={results} />
        </>
      )}

      {!loading && !results && (
        <div className="empty-state">
          <div className="empty-state-icon"></div>
          <p>Enter a target domain above to begin reconnaissance</p>
        </div>
      )}
    </div>
  );
}

export default App;
