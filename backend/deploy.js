const fs = require('fs');
const path = require('path');
const ethers = require('ethers');

async function deploy() {
    const compiledDir = path.join(__dirname, '../smart_contracts/compiled');
    const files = fs.readdirSync(compiledDir);

    // Find the ABI and BIN files
    const abiFile = files.find(f => f.endsWith('.abi'));
    const binFile = files.find(f => f.endsWith('.bin'));

    if (!abiFile || !binFile) {
        console.error('ERROR: Could not find compiled .abi or .bin files in', compiledDir);
        console.error('Files found:', files);
        process.exit(1);
    }

    console.log('Using compiled files:', abiFile, binFile);

    const abi = JSON.parse(fs.readFileSync(path.join(compiledDir, abiFile), 'utf8'));
    const bytecode = fs.readFileSync(path.join(compiledDir, binFile), 'utf8').trim();

    // Connect to local Ganache (running on 8545)
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

    // Use Ganache's default first account private key (from the mnemonic "test test test...")
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log('Deploying with wallet:', wallet.address);

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    console.log('Deploying CertificateRegistry...');
    
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    console.log('SUCCESS! CertificateRegistry deployed at:', address);

    // Write address to .env file
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    if (envContent.includes('CONTRACT_ADDRESS=')) {
        envContent = envContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${address}`);
    } else {
        envContent += `\nCONTRACT_ADDRESS=${address}`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('.env updated with CONTRACT_ADDRESS =', address);
    return address;
}

deploy().catch(err => {
    console.error('Deploy failed:', err.message);
    process.exit(1);
});
