import jsPDF from 'jspdf';
import { useState, useEffect } from 'react';
import API from './api';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('');
  const [jobDescription, setJobDescription] = useState('');
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
      setError('Please select a resume file first');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('resume', file);
    if (jobDescription.trim()) {
      formData.append('jobDescription', jobDescription);
    }

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

  const handleExportPDF = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text('Resume Analysis Report', 20, y);
    y += 12;

    doc.setFontSize(12);
    doc.text(`Overall Score: ${result.overallScore}/100`, 20, y);
    y += 8;

    if (result.jobMatchScore !== undefined && result.jobMatchScore !== null) {
      doc.text(`Job Match Score: ${result.jobMatchScore}/100`, 20, y);
      y += 10;
    } else {
      y += 4;
    }

    const addSection = (title, items) => {
      doc.setFontSize(14);
      doc.text(title, 20, y);
      y += 8;
      doc.setFontSize(11);
      items.forEach((item) => {
        const lines = doc.splitTextToSize(`• ${item}`, 170);
        lines.forEach((line) => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 20, y);
          y += 6;
        });
      });
      y += 6;
    };

    addSection('Strengths', result.strengths);
    addSection('Weaknesses', result.weaknesses);
    addSection('Missing Keywords', result.missingKeywords);
    addSection('Suggestions', result.suggestions);

    if (result.jobMatchGaps && result.jobMatchGaps.length > 0) {
      addSection('Job Match Gaps', result.jobMatchGaps);
    }

    doc.save('Resume_Analysis_Report.pdf');
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
            <div className="upload-row">
              <div className="upload-field">
                <label className="upload-label">Document Type *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="doc-type-select"
                >
                  <option value="">Document Type</option>
                  <option value=".pdf">PDF</option>
                  <option value=".docx">DOCX</option>
                </select>
              </div>

              <div className="upload-field">
                <label className="upload-label">Select file from your computer</label>
                <label className={`choose-file-btn ${!docType ? 'disabled' : ''}`}>
                  + Choose File
                  <input
                    type="file"
                    accept={docType || '.pdf,.docx'}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    disabled={!docType}
                  />
                </label>
                {file && <p className="file-name">{file.name}</p>}
              </div>
            </div>

            <div className="job-desc-field">
              <label className="upload-label">Job Description (optional)</label>
              <textarea
                placeholder="Paste a job description here to see how well your resume matches..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={5}
                className="job-desc-input"
              />
            </div>

            <button onClick={handleAnalyze} disabled={loading} className="btn-analyze">
              {loading ? 'Analyzing...' : 'Analyze Resume'}
            </button>
            {error && <p className="error">{error}</p>}
          </div>

          {result && (
            <div className="results">
              <button onClick={handleExportPDF} className="btn-export">
                📥 Export as PDF
              </button>

              <div className="score-card">
                <p className="score-label">Overall Score</p>
                <p className="score-number">{result.overallScore}/100</p>
              </div>

              {result.jobMatchScore !== undefined && result.jobMatchScore !== null && (
                <div className="job-match-card">
                  <p className="score-label">Job Match Score</p>
                  <p className="score-number">{result.jobMatchScore}/100</p>
                  {result.jobMatchGaps && result.jobMatchGaps.length > 0 && (
                    <div className="job-gaps">
                      <p className="job-gaps-title">Gaps for this role:</p>
                      <ul>
                        {result.jobMatchGaps.map((gap, i) => (
                          <li key={i}>{gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

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