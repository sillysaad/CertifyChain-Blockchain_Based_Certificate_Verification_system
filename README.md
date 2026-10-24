# CertifyChain — Blockchain-Based Certificate Verification System

A full-stack decentralized application (dApp) that allows universities/admins to issue tamper-proof digital certificates on the blockchain and enables anyone to verify their authenticity using SHA-256 cryptographic hashing, OCR, and a QR code system.

---

## 📁 Project Structure

```
blockchain-cert-app/
├── smart_contracts/          # Solidity Smart Contract
│   ├── contracts/
│   │   └── CertificateRegistry.sol   # Main smart contract
│   ├── compiled/             # ABI + Bytecode output (auto-generated)
│   ├── scripts/
│   │   └── deploy.js         # Hardhat deploy script (reference only)
│   └── hardhat.config.js
│
├── backend/                  # Node.js Express API Server
│   ├── server.js             # Main API server (all routes)
│   ├── deploy.js             # ← Run this first to deploy the contract
│   ├── smartContractService.js  # ethers.js blockchain interactions
│   ├── mockIpfs.js           # SHA-256 hashing + local IPFS simulation
│   ├── ocrService.js         # Tesseract.js OCR image text extraction
│   ├── .env                  # Contract address + port (auto-updated by deploy.js)
│   └── ipfs-data/            # Mock IPFS storage folder
│
├── frontend/                 # React.js + Vite Frontend
│   └── src/
│       ├── App.jsx                         # Router + Nav
│       ├── components/
│       │   ├── AdminDashboard.jsx          # Issue certificates
│       │   └── VerificationPortal.jsx      # Verify certificates
│       ├── index.css                       # Premium glassmorphism UI
│       └── main.jsx
│
├── start.ps1                 # ⚡ One-click startup script
└── README.md                 # This file
```

---

## 🔧 Technology Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.24 |
| Blockchain | Local Ganache (Ethereum EVM) |
| Contract Compilation | solc 0.8.24 (via npx) |
| Backend | Node.js + Express |
| Blockchain Client | ethers.js |
| OCR | Tesseract.js |
| File Storage | IPFS (simulated/mock) |
| QR Codes | qrcode npm package |
| Frontend | React.js + Vite |
| Styling | Premium Vanilla CSS (Glassmorphism) |

---

## ⚡ Quick Start

### Prerequisites
- Node.js (v20+ recommended)
- npm

### Step 1 — Run the startup script (PowerShell)
```powershell
cd blockchain-cert-app
.\start.ps1
```

This automatically:
1. Starts a local Ganache blockchain on port 8545
2. Compiles the Solidity smart contract
3. Deploys the contract and saves the address to `backend/.env`
4. Starts the Express backend on port 5000
5. Starts the React frontend on port 5173

### Step 2 — Open the App
- 🌐 **Frontend:** http://localhost:5173
- 🔌 **Backend API:** http://localhost:5000/api/health

---

## 📊 Algorithm Flows

### 🏛️ Certificate Upload & Storage (Admin)
```
Start
  ↓ Admin uploads certificate (PDF/Image)
  ↓ Generate SHA-256 hash of file
  ↓ Extract details (Name, ID, Course) from form
  ↓ Upload certificate to IPFS → get IPFS CID
  ↓ Store on Blockchain: (CertID, StudentName, Hash, IPFS CID)
  ↓ Generate QR Code containing Certificate ID
End
```

### 🔍 Certificate Verification (Image Upload)
```
Start
  ↓ User uploads certificate image
  ↓ Apply OCR using Tesseract → extract Certificate ID
  ↓ Generate SHA-256 hash of uploaded file
  ↓ Fetch stored hash from Blockchain using Certificate ID
  ↓ Compare: Generated Hash == Stored Hash?
      → YES: Certificate is VALID ✅
      → NO:  Certificate is FAKE ❌
  ↓ Display result
End
```

### 📷 QR Code Verification
```
Start
  ↓ Scan QR Code on certificate (or enter ID manually)
  ↓ Extract Certificate ID
  ↓ Fetch certificate details from Blockchain
  ↓ Display: Student Name, Course, Status (Verified)
End
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check + contract address |
| POST | `/api/admin/issue` | Issue a certificate (multipart/form-data) |
| POST | `/api/verify` | Verify certificate by upload (image/pdf) |
| GET | `/api/verify-qr/:certId` | Verify by Certificate ID (QR code path) |

### Issue Certificate — Request Body
```
Form fields: studentName, course, certificateId
File field:  certificate (image or PDF)
```

### Issue Certificate — Response
```json
{
  "success": true,
  "fileHash": "sha256-hash-of-file",
  "ipfsHash": "QmMockIPFS...",
  "transactionHash": "0x...",
  "certificateId": "CERT-2024-0042",
  "qrCode": "data:image/png;base64,..."
}
```

---

## 🔐 Smart Contract — CertificateRegistry.sol

### Key Functions
| Function | Access | Description |
|---|---|---|
| `issueCertificate(...)` | Admin only | Store cert hash + metadata on chain |
| `verifyCertificate(fileHash)` | Public | Look up by SHA-256 file hash |
| `getHashByCertId(certId)` | Public | Look up stored hash by Certificate ID |
| `getCertificateById(certId)` | Public | Get full cert details by Certificate ID |

### Mappings
- `fileHash → Certificate struct` — primary lookup (upload verification)
- `certificateId → fileHash` — secondary lookup (QR code / OCR verification)

---

## 🎨 UI Pages

### Admin Portal — `/admin`
- Algorithm flow bar displayed at top
- Form: Student Name, Course Title, Certificate ID, File Upload
- On success: shows SHA-256 hash, IPFS CID, Transaction hash, **downloadable QR Code**

### Verification Portal — `/`
- **Tab 1: Upload Image / PDF** — drag & drop → OCR + hash → blockchain check → VALID/FAKE
- **Tab 2: Scan QR Code** — enter Certificate ID from QR code → blockchain lookup → student details

---

## 📝 Manual Setup (if not using start.ps1)

```powershell
# Terminal 1 — Blockchain
npx -y ganache -p 8545 -m "test test test test test test test test test test test junk"

# Terminal 2 — Compile Contract
cd smart_contracts
npx -y solc@0.8.24 --abi --bin --base-path . contracts/CertificateRegistry.sol -o compiled

# Terminal 3 — Deploy + Start Backend
cd backend
node deploy.js         # Deploys contract, saves address to .env
node server.js         # Starts API on port 5000

# Terminal 4 — Frontend
cd frontend
npm run dev            # Starts React on port 5173
```
<img width="1903" height="939" alt="image" src="https://github.com/user-attachments/assets/7fd64f02-13af-4ccb-bb23-026ed1c7e934" />
<img width="1902" height="939" alt="image" src="https://github.com/user-attachments/assets/a612d6ac-1b8e-480d-8087-ebc7ef3e35c4" />

<p align="center">
  ⭐ If you find this project interesting, consider giving the repository a star!
</p>
