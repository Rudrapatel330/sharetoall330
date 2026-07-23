'use client';

import { useState, useRef } from 'react';
import './globals.css';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ code?: string; error?: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [downloadCode, setDownloadCode] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setUploadResult({ code: data.code });
        setFile(null);
      } else {
        setUploadResult({ error: data.error || 'Upload failed' });
      }
    } catch (err) {
      setUploadResult({ error: 'Upload failed due to network error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadCode) return;
    setDownloading(true);
    setDownloadError('');

    try {
      const response = await fetch(`/api/download/${downloadCode}`);
      if (!response.ok) {
        const data = await response.json();
        setDownloadError(data.error || 'File not found');
        setDownloading(false);
        return;
      }

      // Extract filename from header if possible
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'downloaded-file';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setDownloadCode('');
    } catch (err) {
      setDownloadError('Download failed due to network error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="main-container">
      <header className="header">
        <h1>ShareToAll</h1>
        <p>Secure, fast, and simple file sharing across any device.</p>
      </header>

      <div className="card-container">
        {/* Upload Card */}
        <div className="card">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Send File
          </h2>
          
          <div 
            className={`upload-zone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              className="file-input" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                  setUploadResult(null);
                }
              }}
            />
            <div className="upload-icon">📁</div>
            {file ? (
              <p>Selected: <strong>{file.name}</strong> ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
            ) : (
              <p>Drag & drop your file here, or click to browse</p>
            )}
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? 'Uploading...' : 'Get Share Code'}
            </button>
          </div>

          {uploadResult?.code && (
            <div className="result-box">
              <p className="success-msg">Your file is ready! Use this code to download:</p>
              <div className="code-display" onClick={() => navigator.clipboard.writeText(uploadResult.code || '')}>
                {uploadResult.code}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>(Click to copy)</p>
            </div>
          )}

          {uploadResult?.error && (
            <div className="result-box error">
              <p className="error-msg">{uploadResult.error}</p>
            </div>
          )}
        </div>

        {/* Download Card */}
        <div className="card">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Receive File
          </h2>
          
          <div className="input-group">
            <p style={{ color: 'var(--text-secondary)' }}>Enter the 6-digit code to securely download your file.</p>
            
            <input 
              type="text" 
              className="code-input"
              placeholder="000000"
              maxLength={6}
              value={downloadCode}
              onChange={(e) => setDownloadCode(e.target.value.replace(/\D/g, ''))}
            />

            <button 
              className="btn btn-primary" 
              onClick={handleDownload}
              disabled={downloadCode.length !== 6 || downloading}
            >
              {downloading ? 'Downloading...' : 'Download File'}
            </button>
          </div>

          {downloadError && (
            <div className="result-box error">
              <p className="error-msg">{downloadError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
