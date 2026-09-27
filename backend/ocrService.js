const Tesseract = require('tesseract.js');

/**
 * Extracts text from an image buffer and attempts to find a Certificate ID.
 * Since this is generic, we'll look for simple patterns like "ID: 12345" 
 * or just return the raw text if we can't cleanly parse it.
 */
async function extractCertificateId(imageBuffer) {
    try {
        const result = await Tesseract.recognize(imageBuffer, 'eng');
        const text = result.data.text;
        
        // Simple regex to find something like "Certificate ID: <ID>" or "ID: <ID>"
        // This regex looks for "id:", "id ", "ID -", etc., followed by alphanumeric string.
        const idRegex = /(?:certificate\s+id|id)[\s\:\-]+([A-Z0-9\-]+)/i;
        const match = text.match(idRegex);

        let extractedId = null;
        if (match && match[1]) {
            extractedId = match[1].trim();
        }

        return { text, extractedId };
    } catch (error) {
        console.error("OCR Error:", error);
        throw error;
    }
}

module.exports = { extractCertificateId };
