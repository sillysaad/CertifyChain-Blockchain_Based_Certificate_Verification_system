import React, { useState, useRef, useCallback } from 'react';
import { ethers } from 'ethers';

const ALGO_STEPS = [
    { num: 1, label: 'Start' },
    { num: 2, label: 'Upload & hash certificate' },
    { num: 3, label: 'Upload to IPFS' },
    { num: 4, label: 'Awaiting MetaMask Approval' },
    { num: 5, label: 'Store on Blockchain' },
    { num: 6, label: 'End' },
];

const AdminDashboard = ({ walletAddress, account }) => {
    // Support both prop names
    const connectedAddress = walletAddress || account || null;
    const [form, setForm] = useState({ studentName: '', course: '', certificateId: '' });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [currentStep, setCurrentStep] = useState(-1);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleFileSelect = useCallback((selectedFile) => {
        if (!selectedFile) return;
        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
        if (!allowed.includes(selectedFile.type)) {
            setError('Please upload an image (PNG, JPG, WEBP) or PDF file.');
            return;
        }
        setFile(selectedFile);
        setError('');
        setResult(null);
        setCurrentStep(-1);
        setCompletedSteps([]);
    }, []);

    // ── Drag & Drop handlers ─────────────────────────────────────────────────
    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only clear if leaving the dropzone itself (not a child)
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragOver(false);
        }
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) handleFileSelect(dropped);
    }, [handleFileSelect]);

    const animateStep = (stepIndex) => {
        return new Promise(resolve => {
            setCurrentStep(stepIndex);
            setTimeout(() => {
                setCompletedSteps(prev => [...prev, stepIndex]);
                resolve();
            }, 500);
        });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!connectedAddress) { setError('Please connect your MetaMask wallet using the button in the top right to issue certificates.'); return; }
        if (!file) { setError('Please select a certificate file.'); return; }
        setLoading(true);
        setError('');
        setResult(null);
        setCurrentStep(-1);
        setCompletedSteps([]);

        try {
            await animateStep(0); // Start
            await animateStep(1); // Upload & Hash

            const data = new FormData();
            Object.entries(form).forEach(([k, v]) => data.append(k, v));
            data.append('certificate', file);

            // Step 1: Prepare data via backend (Hash + IPFS)
            const resp = await fetch('http://localhost:5000/api/admin/prepare-issue', {
                method: 'POST',
                body: data,
            });
            const prepJson = await resp.json();
            if (!prepJson.success) throw new Error(prepJson.error || 'Failed to prepare certificate');

            await animateStep(2); // Upload to IPFS

            // Step 2: Get Contract Info (Address + ABI)
            const contractResp = await fetch('http://localhost:5000/api/contract-info');
            const contractInfo = await contractResp.json();
            if (!contractInfo.success) throw new Error('Failed to load contract specifics');

            await animateStep(3); // Await MetaMask

            // Step 3: Trigger MetaMask Transaction
            if (!window.ethereum) throw new Error("MetaMask is not installed. Please install it to continue.");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, signer);

            // Send transaction
            const tx = await contract.issueCertificate(
                prepJson.fileHash,
                form.certificateId.trim(),
                form.studentName.trim(),
                form.course.trim(),
                prepJson.ipfsHash
            );

            await animateStep(4); // Store on Blockchain (Mining)

            // Wait for confirmation
            const receipt = await tx.wait();

            await animateStep(5); // End

            setResult({
                certificateId: form.certificateId,
                fileHash: prepJson.fileHash,
                ipfsHash: prepJson.ipfsHash,
                transactionHash: receipt.hash,
                qrCode: prepJson.qrCode
            });
            setForm({ studentName: '', course: '', certificateId: '' });
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (err) {
            console.error(err);
            if (err.message.includes('user rejected')) {
                setError('Transaction was rejected in MetaMask.');
            } else if (err.message.includes('missing revert data')) {
                setError('Transaction failed. Make sure you are connected as the Admin account.');
            } else {
                setError(err.reason || err.message || 'Cannot process transaction. Check console logs.');
            }
            setCurrentStep(-1);
        } finally {
            setLoading(false);
        }
    };

    const getStepState = (index) => {
        if (completedSteps.includes(index)) return 'completed';
        if (currentStep === index) return 'active';
        return '';
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const fileIcon = file?.type === 'application/pdf' ? '📄' : '🖼️';

    return (
        <div className="admin-page page-enter">
            <div className="page-header" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h2 className="gradient-text">Admin Portal</h2>
                <p>Issue new certificates on the blockchain</p>

                {/* Wallet status banner */}
                {connectedAddress ? (
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                        marginTop: '0.85rem', padding: '0.5rem 1.1rem',
                        background: 'rgba(5,150,105,0.08)', border: '1.5px solid rgba(5,150,105,0.25)',
                        borderRadius: 50, fontSize: '0.85rem',
                    }}>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" width={18} height={18} style={{ borderRadius: 4 }} />
                        <span style={{ fontWeight: 600, color: '#065f46' }}>MetaMask Connected</span>
                        <span style={{ fontFamily: 'monospace', color: '#059669', fontSize: '0.82rem' }}>
                            {connectedAddress.slice(0, 8)}…{connectedAddress.slice(-6)}
                        </span>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', display: 'inline-block' }} />
                    </div>
                ) : (
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        marginTop: '0.85rem', padding: '0.5rem 1.1rem',
                        background: 'rgba(217,119,6,0.08)', border: '1.5px solid rgba(217,119,6,0.25)',
                        borderRadius: 50, fontSize: '0.82rem', color: '#92400e', fontWeight: 500,
                    }}>
                        ⚠️ No wallet connected — connect via the top-right button
                    </div>
                )}
            </div>

            {/* 7-Step Algorithm Stepper */}
            <div className="algo-stepper">
                {ALGO_STEPS.map((step, i) => (
                    <React.Fragment key={i}>
                        <div className={`algo-step ${getStepState(i)}`}>
                            <div className="step-number">
                                {completedSteps.includes(i) ? '✓' : step.num}
                            </div>
                            <span className="step-label">{step.label}</span>
                        </div>
                        {i < ALGO_STEPS.length - 1 && (
                            <div className={`step-connector ${completedSteps.includes(i) ? 'completed' : ''}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            <div className="glass-panel">
                <h3 style={{ marginBottom: '0.5rem' }}>Issue a New Certificate</h3>
                <p style={{ marginBottom: '2rem', fontSize: '0.9rem' }}>
                    Upload a student's certificate. The system will hash it, pin it to IPFS, and register it immutably on the blockchain.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Student Name</label>
                        <input className="form-input" type="text" name="studentName"
                            value={form.studentName} onChange={handleChange}
                            placeholder="e.g. Alice Johnson" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Course Title</label>
                        <input className="form-input" type="text" name="course"
                            value={form.course} onChange={handleChange}
                            placeholder="e.g. B.Tech Computer Science" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Certificate ID</label>
                        <input className="form-input" type="text" name="certificateId"
                            value={form.certificateId} onChange={handleChange}
                            placeholder="e.g. CERT-2024-0042" required />
                    </div>

                    {/* ── Drag & Drop Dropzone ── */}
                    <div className="form-group">
                        <label className="form-label">Upload Certificate (Image or PDF)</label>
                        <div
                            className={`dropzone ${isDragOver ? 'drag-over' : ''} ${file && !isDragOver ? 'has-file' : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef}
                                id="cert-file-input"
                                type="file"
                                accept="image/*,application/pdf"
                                style={{ display: 'none' }}
                                onChange={e => handleFileSelect(e.target.files[0])}
                            />

                            {isDragOver ? (
                                <div className="dropzone-drag-content">
                                    <span className="drop-icon" style={{ fontSize: '3.5rem' }}>🎯</span>
                                    <h3 style={{ color: 'var(--primary-light)' }}>Drop it here!</h3>
                                    <p>Release to upload</p>
                                </div>
                            ) : file ? (
                                <div className="dropzone-file-content">
                                    <span className="drop-icon">{fileIcon}</span>
                                    <h3 style={{ color: 'var(--success)' }}>{file.name}</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>{formatFileSize(file.size)} — Click or drag to change</p>
                                    <div className="file-type-badge">
                                        {file.type === 'application/pdf' ? 'PDF' : 'IMAGE'}
                                    </div>
                                </div>
                            ) : (
                                <div className="dropzone-empty-content">
                                    <span className="drop-icon">📤</span>
                                    <h3>Drag & Drop or Click to Browse</h3>
                                    <p>Supports PNG, JPG, WEBP, PDF</p>
                                    <div className="dropzone-hint">
                                        <span>🖱️ Click</span>
                                        <span>or</span>
                                        <span>📂 Drag file here</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', background: !connectedAddress ? '#4a5568' : '', cursor: !connectedAddress ? 'not-allowed' : 'pointer' }} disabled={loading || !connectedAddress}>
                        {loading ? (
                            <><span className="loader"></span>Awaiting MetaMask / Processing...</>
                        ) : !connectedAddress ? (
                            '⚠️ Connect Wallet to Issue'
                        ) : (
                            '🔗 Sign & Issue to Blockchain'
                        )}
                    </button>
                </form>

                {error && (
                    <div className="result-banner result-fake" style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>❌</span>
                            <div>
                                <strong style={{ color: 'var(--error)' }}>Error</strong>
                                <p style={{ margin: 0, color: 'var(--error)', fontSize: '0.9rem' }}>{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {result && (
                    <div className="result-banner result-valid" style={{ marginTop: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <span className="result-badge" style={{ 
                                background: 'var(--success)', 
                                color: '#fff', 
                                padding: '0.4rem 1rem', 
                                borderRadius: 'var(--radius-full)',
                                fontWeight: 800,
                                fontSize: '0.8rem'
                            }}>✅ SUCCESS</span>
                            <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '1.1rem' }}>Certificate registered on blockchain!</span>
                        </div>
                        <div style={{ background: 'rgba(0, 240, 255, 0.04)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.25rem', border: '1px solid rgba(0, 240, 255, 0.1)', boxShadow: 'inset 0 0 20px rgba(0, 240, 255, 0.02)' }}>
                            <div className="data-table">
                                <div className="data-row"><span>Certificate ID</span><strong style={{ color: 'var(--primary)' }}>{result.certificateId}</strong></div>
                                <div className="data-row"><span>File Hash</span><code className="hash">{result.fileHash}</code></div>
                                <div className="data-row"><span>IPFS Hash</span><code className="hash">{result.ipfsHash}</code></div>
                                <div className="data-row"><span>TX Hash</span><code className="hash">{result.transactionHash}</code></div>
                            </div>
                        </div>
                        {result.qrCode && (
                            <div className="qr-section">
                                <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '1rem' }}>QR Code for Quick Verification</p>
                                <img src={result.qrCode} alt="Certificate QR Code" width={160} />
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>Scan to verify this certificate instantly</p>
                                <a href={result.qrCode} download={`qr-${result.certificateId}.png`} className="btn btn-outline btn-sm" style={{ marginTop: '0.75rem' }}>
                                    ⬇ Download QR Code
                                </a>
                            </div>
                        )}
                        <div className="processing-log" style={{ marginTop: '1.25rem' }}>
                            <div className="log-entry success">✓ SHA-256 hash generated: {result.fileHash?.substring(0, 24)}...</div>
                            <div className="log-entry success">✓ Uploaded to IPFS: {result.ipfsHash?.substring(0, 24)}...</div>
                            <div className="log-entry success">✓ Stored on Blockchain TX: {result.transactionHash?.substring(0, 24)}...</div>
                            <div className="log-entry success">✓ QR Code generated for: {result.certificateId}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
