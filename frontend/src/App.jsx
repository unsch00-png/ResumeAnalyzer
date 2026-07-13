import { useState, useEffect } from 'react';
import API from './api';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await API.get('/history');
      setHistory(res.data);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a PDF resume first');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await API.post('/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      fetchHistory();
    } catch (err) {
      console.error(err);
      setError('Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (item) => {
    setResult(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistory = async (e, id) => {
    e.stopPropagation();
    try {
      await API.delete(`/history/${id}`);
      fetchHistory();
    } catch (err) {
      console.error('Error deleting history item:', err);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <h1>📄 AI Resume Analyzer</h1>
        <p>Upload your resume and get instant AI-powered feedback</p>
      </header>

      <div className="main-layout">
        <div className="main-content">
          <div className="upload-card">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="file-input"
            />
            <button onClick={handleAnalyze} disabled={loading} className="btn-analyze">
              {loading ? 'Analyzing...' : 'Analyze Resume'}
            </button>
            {error && <p className="error">{error}</p>}
          </div>

          {result && (
            <div className="results">
              <div className="score-card">
                <p className="score-label">Overall Score</p>
                <p className="score-number">{result.overallScore}/100</p>
              </div>

              <div className="section">
                <h3>✅ Strengths</h3>
                <ul>
                  {result.strengths.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="section">
                <h3>⚠️ Weaknesses</h3>
                <ul>
                  {result.weaknesses.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="section">
                <h3>🔑 Missing Keywords</h3>
                <div className="keywords">
                  {result.missingKeywords.map((kw, i) => (
                    <span key={i} className="keyword-tag">{kw}</span>
                  ))}
                </div>
              </div>

              <div className="section">
                <h3>💡 Suggestions</h3>
                <ul>
                  {result.suggestions.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="sidebar">
            <h3>📜 Recent Analyses</h3>
            {history.map((item) => (
              <div
                key={item._id}
                className="history-item"
                onClick={() => handleHistoryClick(item)}
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                <button
                  onClick={(e) => handleDeleteHistory(e, item._id)}
                  className="history-delete-btn"
                >
                  ✕
                </button>
                <p className="history-name">{item.fileName}</p>
                <p className="history-date">{new Date(item.createdAt).toLocaleString()}</p>
                <span className="history-score">{item.overallScore}/100</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;