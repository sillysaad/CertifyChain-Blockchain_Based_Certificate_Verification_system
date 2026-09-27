require('dotenv').config();
const fs = require('fs');
const path = require('path');
const ethers = require('ethers');

// Load ABI from compiled output
const compiledDir = path.join(__dirname, '../smart_contracts/compiled');
const abiFile = fs.readdirSync(compiledDir).find(f => f.endsWith('.abi'));
const abi = JSON.parse(fs.readFileSync(path.join(compiledDir, abiFile), 'utf8'));

const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
// Ganache default account #0 (funded)
const adminPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const wallet = new ethers.Wallet(adminPrivateKey, provider);

function getContract() {
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) throw new Error('CONTRACT_ADDRESS not set. Run: node deploy.js');
    return new ethers.Contract(contractAddress, abi, wallet);
}

// ── Issue Certificate on Blockchain ───────────────────────────────────────────
async function issueOnBlockchain(fileHash, certificateId, studentName, course, ipfsHash) {
    const contract = getContract();
    console.log(`[Blockchain] Issuing cert ID="${certificateId}" fileHash="${fileHash.substring(0,16)}..."`);
    const tx = await contract.issueCertificate(fileHash, certificateId, studentName, course, ipfsHash);
    const receipt = await tx.wait();
    return { transactionHash: receipt.hash, success: true };
}

// ── Verify by File Hash (primary path) ────────────────────────────────────────
async function verifyByFileHash(fileHash) {
    const contract = getContract();
    const result = await contract.verifyCertificate(fileHash);
    return {
        isValid: result.isValid,
        certificateId: result.certificateId,
        studentName: result.studentName,
        course: result.course,
        ipfsHash: result.ipfsHash,
        timestamp: result.timestamp.toString()
    };
}

// ── Get stored file hash by Certificate ID (used in OCR/QR verify path) ───────
async function getHashByCertId(certificateId) {
    const contract = getContract();
    const storedHash = await contract.getHashByCertId(certificateId);
    return storedHash; // returns empty string if not found
}

// ── Get full certificate details by Certificate ID (QR code scan) ─────────────
async function getCertificateById(certificateId) {
    const contract = getContract();
    const result = await contract.getCertificateById(certificateId);
    return {
        isValid: result.isValid,
        certificateId: result.certificateId,
        studentName: result.studentName,
        course: result.course,
        ipfsHash: result.ipfsHash,
        fileHash: result.fileHash,
        timestamp: result.timestamp.toString()
    };
}

module.exports = { issueOnBlockchain, verifyByFileHash, getHashByCertId, getCertificateById, abi };
