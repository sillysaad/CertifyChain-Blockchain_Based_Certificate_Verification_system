const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const IPFS_DIR = path.join(__dirname, 'ipfs-data');

if (!fs.existsSync(IPFS_DIR)) {
  fs.mkdirSync(IPFS_DIR, { recursive: true });
}

/**
 * Mocks pinning a file to IPFS. Returns a pseudo-CID based on the SHA-256 hash.
 */
function pinFileToIPFS(buffer) {
  return new Promise((resolve) => {
    // Generate a pseudo-CID using sha256. In real IPFS, it uses multihash (e.g. Qm...)
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const cid = `QmMockIPFS${hash.substring(0, 36)}`; 
    
    // Save to local directory to mock decentralized storage
    const filePath = path.join(IPFS_DIR, cid);
    fs.writeFileSync(filePath, buffer);
    
    // Note: We also need the raw file hash for the smart contract mapping 
    // (since it maps SHA-256 fileHash -> Certificate details)
    resolve({ cid, fileHash: hash });
  });
}

function getFileHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = { pinFileToIPFS, getFileHash };
