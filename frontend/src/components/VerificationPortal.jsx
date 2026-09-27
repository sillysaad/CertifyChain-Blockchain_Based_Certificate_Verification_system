import React, { useState, useRef, useCallback } from 'react';

const IMAGE_ALGO_STEPS = [
    { num: 1, label: 'Start' },
    { num: 2, label: 'Upload certificate image' },
    { num: 3, label: 'Apply OCR (Tesseract)' },
    { num: 4, label: 'Extract Certificate ID' },
    { num: 5, label: 'Generate SHA-256 hash' },
    { num: 6, label: 'Fetch from Blockchain' },
    { num: 7, label: 'Compare hashes' },
    { num: 8, label: 'Display result' },
    { num: 9, label: 'End' },
];

const QR_ALGO_STEPS = [
    { num: 1, label: 'Start' },
    { num: 2, label: 'Scan QR Code' },
    { num: 3, label: 'Extract Certificate ID' },
    { num: 4, label: 'Fetch from Blockchain' },
    { num: 5, label: 'Display details' },
    { num: 6, label: 'End' },
];

const TABS = ['📄 Upload Image / PDF', '🔍 Verify by Certificate ID'];

const VerificationPortal = () => {
    const [tab, setTab] = useState(0);
    const [file, setFile] = useState(null);
    const [certId, setCertId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [currentStep, setCurrentStep] = useState(-1);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const reset = () => { setResult(null); setError(''); setCurrentStep(-1); setCompletedSteps([]); };

    const handleFileSelect = useCallback((selectedFile) => {
        if (!selectedFile) return;
        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
        if (!allowed.includes(selectedFile.type)) {
            setError('Please upload an image (PNG, JPG, WEBP) or PDF file.');
            return;
        }
        setFile(selectedFile);
        reset();
    }, []);

    const handleDragEnter = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }, []);
    const handleDragLeave = useCallback((e) => {
        e.preventDefault(); e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false);
    }, []);
    const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) handleFileSelect(dropped);
    }, [handleFileSelect]);

    const animateStep = (stepIndex) => new Promise(resolve => {
        setCurrentStep(stepIndex);
        setTimeout(() => { setCompletedSteps(prev => [...prev, stepIndex]); resolve(); }, 400);
    });

    const handleFileVerify = async e => {
        e.preventDefault();
        if (!file) { setError('Please select a file.'); return; }
        setLoading(true); reset();
        await animateStep(0); await animateStep(1); await animateStep(2);
        const data = new FormData();
        data.append('certificate', file);
        try {
            await animateStep(3); await animateStep(4);
            const resp = await fetch('http://localhost:5000/api/verify', { method: 'POST', body: data });
            const json = await resp.json();
            await animateStep(5); await animateStep(6); await animateStep(7);
            if (json.success) { await animateStep(8); setResult(json); }
            else setError(json.error || 'Verification error');
        } catch { setError('Cannot connect to backend. Is the server running?'); }
        finally { setLoading(false); }
    };

    const handleQRVerify = async e => {
        e.preventDefault();
        if (!certId.trim()) { setError('Please enter a Certificate ID.'); return; }
        setLoading(true); reset();
        await animateStep(0); await animateStep(1); await animateStep(2);
        try {
            const resp = await fetch(`http://localhost:5000/api/verify-qr/${encodeURIComponent(certId.trim())}`);
            const json = await resp.json();
            await animateStep(3); await animateStep(4);
            if (json.success) { await animateStep(5); setResult(json); }
            else setError(json.error || 'Verification error');
        } catch { setError('Cannot connect to backend. Is the server running?'); }
        finally { setLoading(false); }
    };

    const getStepState = (index) => {
        if (completedSteps.includes(index)) return 'completed';
        if (currentStep === index) return 'active';
        return '';
    };

    const activeSteps = tab === 0 ? IMAGE_ALGO_STEPS : QR_ALGO_STEPS;
    const isValid = result?.isAuthentic;
    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };
    const fileIcon = file?.type === 'application/pdf' ? '📄' : '🖼️';

    return (
        <div className="verify-page page-enter">
            <div className="page-header" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h2 className="gradient-text">Verify Certificate</h2>
                <p>Upload an image for OCR+blockchain check, or enter a Certificate ID</p>
            </div>

            {/* Algorithm Stepper */}
            <div className="algo-stepper" key={tab}>
                {activeSteps.map((step, i) => (
                    <React.Fragment key={i}>
                        <div className={`algo-step ${getStepState(i)}`}>
                            <div className="step-number">{completedSteps.includes(i) ? '✓' : step.num}</div>
                            <span className="step-label">{step.label}</span>
                        </div>
                        {i < activeSteps.length - 1 && (
                            <div className={`step-connector ${completedSteps.includes(i) ? 'completed' : ''}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            <div className="glass-panel">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Verify Certificate Authenticity</h3>
                    <p style={{ fontSize: '0.9rem' }}>
                        Upload the certificate image/PDF for OCR+blockchain check, or enter a Certificate ID for instant lookup.
                    </p>
                </div>

                {/* Tabs */}
                <div className="tab-bar">
                    {TABS.map((t, i) => (
                        <button key={i} className={`tab-btn ${tab === i ? 'active' : ''}`}
                            onClick={() => { setTab(i); reset(); setFile(null); setCertId(''); setIsDragOver(false); }}>
                            {t}
                        </button>
                    ))}
                </div>

                {/* Tab 1: File Upload */}
                {tab === 0 && (
                    <form onSubmit={handleFileVerify} style={{ marginTop: '1rem' }}>
                        <div
                            className={`dropzone ${isDragOver ? 'drag-over' : ''} ${file && !isDragOver ? 'has-file' : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver} onDrop={handleDrop}
                        >
                            <input ref={fileInputRef} type="file" id="verify-file" accept="image/*,application/pdf"
                                style={{ display: 'none' }} onChange={e => handleFileSelect(e.target.files[0])} />
                            {isDragOver ? (
                                <div className="dropzone-drag-content">
                                    <span className="drop-icon" style={{ fontSize: '3.5rem' }}>🎯</span>
                                    <h3 style={{ color: '#00f0ff' }}>Drop it here!</h3>
                                    <p>Release to upload</p>
                                </div>
                            ) : file ? (
                                <div className="dropzone-file-content">
                                    <span className="drop-icon">{fileIcon}</span>
                                    <h3 style={{ color: '#00ff88' }}>{file.name}</h3>
                                    <p style={{ color: '#5a7a99' }}>{formatFileSize(file.size)} — Click or drag to change</p>
                                    <div className="file-type-badge">{file.type === 'application/pdf' ? 'PDF' : 'IMAGE'}</div>
                                </div>
                            ) : (
                                <div className="dropzone-empty-content">
                                    <span className="drop-icon">📤</span>
                                    <h3>Drag & Drop or Click to Browse</h3>
                                    <p>Supports PNG, JPG, WEBP, PDF</p>
                                    <div className="dropzone-hint">
                                        <span>🖱️ Click</span><span>or</span><span>📂 Drag file here</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ minWidth: 240 }}>
                                {loading ? <><span className="loader"></span>Verifying...</> : '🔍 Verify Now'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Tab 2: Certificate ID */}
                {tab === 1 && (
                    <form onSubmit={handleQRVerify} style={{ marginTop: '1rem' }}>
                        <div style={{
                            textAlign: 'center', marginBottom: '1.5rem', padding: '1.5rem',
                            background: 'rgba(0,240,255,0.03)', border: '1px solid rgba(0,240,255,0.10)', borderRadius: 12,
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📷</div>
                            <p style={{ marginBottom: '1.5rem', color: '#5a7a99', fontSize: '0.9rem' }}>
                                Scan the QR code on the certificate, then paste the Certificate ID below. Or enter it manually.
                            </p>
                            <div className="form-group" style={{ textAlign: 'left', maxWidth: 420, margin: '0 auto' }}>
                                <label className="form-label">Certificate ID</label>
                                <input className="form-input" type="text" placeholder="e.g. CERT-2024-0042"
                                    value={certId} onChange={e => { setCertId(e.target.value); reset(); }} required />
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ minWidth: 240 }}>
                                {loading ? <><span className="loader"></span>Looking up...</> : '🔗 Fetch from Blockchain'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Error */}
                {error && (
                    <div className="result-banner result-fake" style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>❌</span>
                            <div>
                                <strong style={{ color: '#ff3c3c' }}>Verification Error</strong>
                                <p style={{ margin: 0, color: '#ff3c3c', fontSize: '0.9rem' }}>{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className={`result-banner ${isValid ? 'result-valid' : 'result-fake'}`} style={{ marginTop: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.35rem 0.9rem', borderRadius: 50,
                                fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em',
                                background: isValid ? 'rgba(0,255,136,0.15)' : 'rgba(255,60,60,0.15)',
                                color: isValid ? '#00ff88' : '#ff3c3c',
                                border: `1px solid ${isValid ? 'rgba(0,255,136,0.4)' : 'rgba(255,60,60,0.4)'}`,
                            }}>
                                {isValid ? '✅ VALID' : '❌ FAKE / TAMPERED'}
                            </span>
                            <p style={{ color: isValid ? '#00ff88' : '#ff3c3c', margin: 0, fontWeight: 500 }}>{result.message}</p>
                        </div>

                        {!isValid && result.reason && (
                            <p style={{ color: '#ff3c3c', marginBottom: '1rem', fontSize: '0.9rem' }}>{result.reason}</p>
                        )}

                        {isValid && result.certificateData && (
                            <div style={{
                                background: 'rgba(0,240,255,0.04)',
                                backdropFilter: 'blur(16px)',
                                borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem',
                                border: '1px solid rgba(0,240,255,0.15)',
                                boxShadow: '0 0 30px rgba(0,240,255,0.06)',
                                position: 'relative', overflow: 'hidden',
                            }}>
                                {/* HUD corner brackets */}
                                <div style={{ position: 'absolute', top: 8, left: 8, width: 12, height: 12, borderTop: '2px solid rgba(0,240,255,0.6)', borderLeft: '2px solid rgba(0,240,255,0.6)', borderRadius: '2px 0 0 0' }} />
                                <div style={{ position: 'absolute', bottom: 8, right: 8, width: 12, height: 12, borderBottom: '2px solid rgba(0,240,255,0.6)', borderRight: '2px solid rgba(0,240,255,0.6)', borderRadius: '0 0 2px 0' }} />
                                <div className="data-table">
                                    <div className="data-row">
                                        <span>Student Name</span>
                                        <strong style={{ color: '#e8f4ff' }}>{result.certificateData.studentName}</strong>
                                    </div>
                                    <div className="data-row">
                                        <span>Course</span>
                                        <strong style={{ color: '#e8f4ff' }}>{result.certificateData.course}</strong>
                                    </div>
                                    <div className="data-row">
                                        <span>Certificate ID</span>
                                        <code style={{ color: '#00f0ff', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", textShadow: '0 0 8px rgba(0,240,255,0.5)', fontSize: '0.85rem' }}>
                                            {result.certificateData.certificateId}
                                        </code>
                                    </div>
                                    <div className="data-row">
                                        <span>IPFS Storage</span>
                                        <code className="hash">{result.certificateData.ipfsHash}</code>
                                    </div>
                                    <div className="data-row">
                                        <span>Status</span>
                                        <strong style={{ color: '#00ff88', textShadow: '0 0 8px rgba(0,255,136,0.4)' }}>✅ Authenticated on Blockchain</strong>
                                    </div>
                                    <div className="data-row">
                                        <span>Issued At</span>
                                        <strong style={{ color: '#a8c4e0', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.82rem' }}>
                                            {result.certificateData.timestamp
                                                ? new Date(Number(result.certificateData.timestamp) * 1000).toLocaleString()
                                                : 'N/A'}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        )}

                        {result.generatedHash && (
                            <div className="processing-log">
                                <div className="log-entry success">✓ OCR scan completed</div>
                                {result.extractedId && <div className="log-entry success">✓ Extracted ID: {result.extractedId}</div>}
                                <div className="log-entry success">✓ SHA-256 hash: {result.generatedHash.substring(0, 28)}...</div>
                                <div className="log-entry success">✓ Blockchain query complete</div>
                                <div className="log-entry success">
                                    ✓ Result: {isValid ? 'Hash MATCHED — Certificate is VALID' : 'Hash MISMATCH — Certificate is FAKE'}
                                </div>
                                {result.ocrMatch && result.ocrMatch !== 'N/A' && (
                                    <div className="log-entry success">✓ OCR: {result.ocrMatch}</div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerificationPortal;
