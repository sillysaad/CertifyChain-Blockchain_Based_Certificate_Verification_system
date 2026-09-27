// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CertificateRegistry {
    address public admin;

    struct Certificate {
        string certificateId;
        string studentName;
        string course;
        string ipfsHash;
        string fileHash;
        uint256 timestamp;
        bool isValid;
    }

    // Primary lookup: fileHash  → Certificate
    mapping(string => Certificate) private certsByHash;

    // Secondary lookup: certificateId → fileHash (for QR code / ID-based lookup)
    mapping(string => string) private hashByCertId;

    event CertificateIssued(string fileHash, string certificateId, string studentName);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /// @notice Issue a certificate — only callable by admin
    function issueCertificate(
        string memory _fileHash,
        string memory _certificateId,
        string memory _studentName,
        string memory _course,
        string memory _ipfsHash
    ) public onlyAdmin {
        require(!certsByHash[_fileHash].isValid, "Certificate with this file hash already exists");
        require(bytes(hashByCertId[_certificateId]).length == 0, "Certificate ID already registered");

        certsByHash[_fileHash] = Certificate({
            certificateId: _certificateId,
            studentName: _studentName,
            course: _course,
            ipfsHash: _ipfsHash,
            fileHash: _fileHash,
            timestamp: block.timestamp,
            isValid: true
        });

        // Enable ID-based lookup (for QR verification)
        hashByCertId[_certificateId] = _fileHash;

        emit CertificateIssued(_fileHash, _certificateId, _studentName);
    }

    /// @notice Verify by file hash (primary method — used after hashing uploaded file)
    function verifyCertificate(string memory _fileHash) public view returns (
        bool isValid,
        string memory certificateId,
        string memory studentName,
        string memory course,
        string memory ipfsHash,
        uint256 timestamp
    ) {
        Certificate memory cert = certsByHash[_fileHash];
        if (cert.isValid) {
            return (true, cert.certificateId, cert.studentName, cert.course, cert.ipfsHash, cert.timestamp);
        }
        return (false, "", "", "", "", 0);
    }

    /// @notice Get stored file hash by certificate ID (used for QR code verification)
    function getHashByCertId(string memory _certificateId) public view returns (string memory fileHash) {
        return hashByCertId[_certificateId];
    }

    /// @notice Get full certificate details by certificate ID (for QR display)
    function getCertificateById(string memory _certificateId) public view returns (
        bool isValid,
        string memory certificateId,
        string memory studentName,
        string memory course,
        string memory ipfsHash,
        string memory fileHash,
        uint256 timestamp
    ) {
        string memory hash = hashByCertId[_certificateId];
        if (bytes(hash).length == 0) {
            return (false, "", "", "", "", "", 0);
        }
        Certificate memory cert = certsByHash[hash];
        return (cert.isValid, cert.certificateId, cert.studentName, cert.course, cert.ipfsHash, cert.fileHash, cert.timestamp);
    }
}
