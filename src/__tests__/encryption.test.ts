import { encrypt, decrypt, maskMedicareNumber } from "@/lib/encryption";

const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

beforeEach(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY;
});

afterEach(() => {
  delete process.env.ENCRYPTION_KEY;
});

describe("encrypt / decrypt", () => {
  it("should encrypt and decrypt a string successfully", () => {
    const plaintext = "1EG4-TE5-MK72";
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should produce different ciphertext each call (random IV)", () => {
    const plaintext = "MEDICARE-12345";
    const enc1 = encrypt(plaintext);
    const enc2 = encrypt(plaintext);
    expect(enc1).not.toBe(enc2);
    expect(decrypt(enc1)).toBe(plaintext);
    expect(decrypt(enc2)).toBe(plaintext);
  });

  it("should throw on invalid encrypted data format", () => {
    expect(() => decrypt("invalid")).toThrow("Invalid encrypted data format");
  });

  it("should throw when ENCRYPTION_KEY is not set", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY environment variable is not set");
  });

  it("should throw when ENCRYPTION_KEY is wrong length", () => {
    process.env.ENCRYPTION_KEY = "tooshort";
    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY must be a 64-character hex string");
  });
});

describe("maskMedicareNumber", () => {
  it("should mask all but the last 4 characters", () => {
    expect(maskMedicareNumber("1EG4TE5MK72")).toBe("*******MK72");
  });

  it("should handle short strings", () => {
    expect(maskMedicareNumber("AB")).toBe("****");
  });

  it("should handle empty string", () => {
    expect(maskMedicareNumber("")).toBe("****");
  });
});
