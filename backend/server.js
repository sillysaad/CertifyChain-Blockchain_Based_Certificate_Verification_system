require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const QRCode = require('qrcode');
const { pinFileToIPFS, getFileHash } = require('./mockIpfs');
const { extractCertificateId } = require('./ocrService');
const { issueOnBlockchain, verifyByFileHash, getHashByCertId, getCertificateById, abi } = require('./smartContractService');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// ─────────────────────────────────────────────────────────────────────────────
// ALGORITHM: Certificate Prep (File verification -> Hash -> IPFS -> QR)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/admin/prepare-issue', upload.single('certificate'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file provided' });

        const { studentName, course, certificateId } = req.body;
        if (!studentName || !course || !certificateId) {
            return res.status(400).json({ success: false, error: 'studentName, course, and certificateId are required' });
        }

        // Generate SHA-256 hash of the certificate file
        const { cid, fileHash } = await pinFileToIPFS(req.file.buffer);
        console.log(`[Prepare Issue] SHA-256 hash = ${fileHash}, IPFS CID = ${cid}`);

        // Generate QR Code → encodes the Certificate ID for fast retrieval
        const qrData = `certid:${certificateId}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 200, margin: 1 });
        console.log(`[Prepare Issue] QR code generated for cert ID = ${certificateId}`);

        res.json({
            success: true,
            fileHash,
            ipfsHash: cid,
            qrCode: qrCodeDataUrl,
            message: 'File processing complete. Ready for MetaMask signature.'
        });

    } catch (error) {
        console.error('[Prepare Issue] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ALGORITHM: Certificate Verification (Image Upload)
// Step 1: User uploads certificate image
// Step 2: Apply OCR using Tesseract → extract Certificate ID
// Step 3: Generate SHA-256 hash of uploaded file
// Step 4: Fetch stored hash from Blockchain using Certificate ID
// Step 5: Compare Generated Hash == Stored Hash
//         → VALID if match, FAKE if not
// Step 6: Display result
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/verify', upload.single('certificate'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file provided' });

        // STEP 3: Generate SHA-256 hash of uploaded file
        const generatedHash = getFileHash(req.file.buffer);
        console.log(`[Verify] Step 3: Generated hash = ${generatedHash.substring(0, 16)}...`);

        let extractedId = null;
        let ocrText = '';

        // STEP 2: Apply OCR for images to extract Certificate ID
        if (req.file.mimetype.startsWith('image/')) {
            try {
                console.log('[Verify] Step 2: Running OCR...');
                const ocrResult = await extractCertificateId(req.file.buffer);
                extractedId = ocrResult.extractedId;
                ocrText = ocrResult.text ? ocrResult.text.trim().substring(0, 300) : '';
                console.log(`[Verify] Step 2: OCR extracted ID = "${extractedId}"`);
            } catch (ocrErr) {
                console.warn('[Verify] OCR failed (non-critical):', ocrErr.message);
            }
        }

        // STEP 4 & 5: Determine result
        // Primary path: look up blockchain by GENERATED HASH (most reliable — exact file match)
        const blockchainData = await verifyByFileHash(generatedHash);

        let isAuthentic = false;
        let reason = '';
        let ocrMatch = 'N/A';
        let certData = null;

        if (blockchainData.isValid) {
            // Hash matched on chain → VALID
            isAuthentic = true;
            certData = blockchainData;
            console.log('[Verify] Step 5: Hash matched blockchain → VALID');

            // Also cross-check OCR ID vs stored ID
            if (extractedId) {
                ocrMatch = extractedId === blockchainData.certificateId
                    ? `✓ OCR ID matched (${extractedId})`
                    : `⚠ OCR ID mismatch — OCR: "${extractedId}", Chain: "${blockchainData.certificateId}"`;
            }
        } else {
            // Hash not found — try lookup by OCR-extracted Certificate ID
            // Step 4: Fetch stored HASH from blockchain using extracted Certificate ID
            if (extractedId) {
                console.log(`[Verify] Step 4: Hash not found, trying lookup by OCR cert ID = "${extractedId}"`);
                const storedHash = await getHashByCertId(extractedId);

                if (storedHash && storedHash.length > 0) {
                    // Step 5: Compare generated hash vs stored hash
                    if (generatedHash === storedHash) {
                        // Should not normally reach here (already checked above), but handles edge cases
                        isAuthentic = true;
                        const certById = await getCertificateById(extractedId);
                        certData = certById;
                        ocrMatch = `✓ OCR ID matched and hash verified (${extractedId})`;
                        console.log('[Verify] Step 5: Hash matched via cert ID → VALID');
                    } else {
                        isAuthentic = false;
                        reason = `Certificate ID "${extractedId}" exists on blockchain, but the FILE HAS BEEN TAMPERED — hash does not match.`;
                        ocrMatch = `✗ Hash mismatch: generated vs stored`;
                        console.log('[Verify] Step 5: Cert ID found but hash mismatch → FAKE/TAMPERED');
                    }
                } else {
                    isAuthentic = false;
                    reason = extractedId
                        ? `Certificate ID "${extractedId}" not found on blockchain.`
                        : 'File hash not found on blockchain — certificate was not issued or has been tampered with.';
                    console.log('[Verify] Step 5: Not found on blockchain → FAKE');
                }
            } else {
                isAuthentic = false;
                reason = 'File hash not found on blockchain.';
            }
        }

        res.json({
            success: true,
            isAuthentic,
            reason: isAuthentic ? null : reason,
            message: isAuthentic
                ? '✅ Certificate is VALID — confirmed on the blockchain.'
                : '❌ Certificate is FAKE or TAMPERED.',
            generatedHash,
            extractedId,
            ocrText,
            ocrMatch,
            certificateData: certData
        });

    } catch (error) {
        console.error('[Verify] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ALGORITHM: QR Code Verification
// Step 1: Scan QR Code → extract Certificate ID
// Step 2: Fetch certificate details from Blockchain using Certificate ID
// Step 3: Display Student Name, Course, Status
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/verify-qr/:certificateId', async (req, res) => {
    try {
        const { certificateId } = req.params;
        console.log(`[QR Verify] Looking up cert ID = "${certificateId}"`);

        const certData = await getCertificateById(certificateId);

        if (!certData.isValid) {
            return res.json({
                success: true,
                isAuthentic: false,
                message: `❌ Certificate ID "${certificateId}" not found on blockchain.`
            });
        }

        res.json({
            success: true,
            isAuthentic: true,
            message: '✅ Certificate is VALID — confirmed on the blockchain.',
            certificateData: certData
        });

    } catch (error) {
        console.error('[QR Verify] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ ok: true, contractAddress: process.env.CONTRACT_ADDRESS || 'NOT SET' });
});

app.get('/api/contract-info', (req, res) => {
    res.json({
        success: true,
        address: process.env.CONTRACT_ADDRESS,
        abi: abi
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ CertifyChain Backend on http://localhost:${PORT}`);
    console.log(`   Contract: ${process.env.CONTRACT_ADDRESS || 'NOT SET'}`);
});
