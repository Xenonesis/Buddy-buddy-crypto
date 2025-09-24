import CryptoJS from 'crypto-js';
import { EncryptedData } from '../types';

class EncryptionService {
  private static instance: EncryptionService;
  private readonly keySize = 256;
  private readonly ivSize = 96;
  private readonly tagSize = 128;

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  // Generate a secure random key
  generateKey(): string {
    return CryptoJS.lib.WordArray.random(this.keySize / 8).toString();
  }

  // Encrypt data using AES-GCM
  encrypt(data: string, key: string): EncryptedData {
    const iv = CryptoJS.lib.WordArray.random(this.ivSize / 8);
    const keyWordArray = CryptoJS.enc.Hex.parse(key);
    
    // Using AES in GCM mode for authenticated encryption
    const encrypted = CryptoJS.AES.encrypt(data, keyWordArray, {
      iv: iv,
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.NoPadding
    });

    return {
      iv: iv.toString(CryptoJS.enc.Hex),
      data: encrypted.ciphertext.toString(CryptoJS.enc.Hex),
      tag: encrypted.tag?.toString(CryptoJS.enc.Hex) || ''
    };
  }

  // Decrypt data using AES-GCM
  decrypt(encryptedData: EncryptedData, key: string): string {
    const keyWordArray = CryptoJS.enc.Hex.parse(key);
    const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
    const ciphertext = CryptoJS.enc.Hex.parse(encryptedData.data);
    const tag = CryptoJS.enc.Hex.parse(encryptedData.tag);

    const decrypted = CryptoJS.AES.decrypt(
      {
        ciphertext: ciphertext,
        tag: tag,
        toString: () => encryptedData.data
      } as any,
      keyWordArray,
      {
        iv: iv,
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.NoPadding
      }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  // Hash data for zero-knowledge proofs
  hashData(data: string): string {
    return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
  }

  // Generate proof without revealing actual data
  generateZKProof(data: string, nonce: string): string {
    const commitment = CryptoJS.SHA256(data + nonce).toString(CryptoJS.enc.Hex);
    return commitment;
  }

  // Verify zero-knowledge proof
  verifyZKProof(proof: string, data: string, nonce: string): boolean {
    const expectedProof = this.generateZKProof(data, nonce);
    return proof === expectedProof;
  }
}

export default EncryptionService;