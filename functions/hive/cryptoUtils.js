const crypto = require('crypto');

/**
 * SLIM-6.1: Application-Layer Field-Level Encryption
 * Encrypts highly sensitive PII before it is written to the database.
 * Relies on AES-256-GCM. 
 * (In production, process.env.ENCRYPTION_KEY is injected securely via Secret Manager)
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'); // 256-bit key
const ALGORITHM = 'aes-256-gcm';

function encrypt(text) {
    if (!text) return text;
    const iv = crypto.randomBytes(12); // GCM standard
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag: authTag.toString('hex')
    };
}

function decrypt(cipherObj) {
    if (!cipherObj || !cipherObj.iv) return cipherObj;
    const decipher = crypto.createDecipheriv(
        ALGORITHM, 
        Buffer.from(ENCRYPTION_KEY, 'hex'), 
        Buffer.from(cipherObj.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(cipherObj.authTag, 'hex'));
    
    let decrypted = decipher.update(cipherObj.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = { encrypt, decrypt };
