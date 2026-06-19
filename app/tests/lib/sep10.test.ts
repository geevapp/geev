import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Keypair, TransactionBuilder, Networks } from "@stellar/stellar-sdk";
import {
  generateChallenge,
  verifyChallenge,
  extractClientPublicKey,
  getServerPublicKey,
} from "@/lib/sep10";
import { getNetworkPassphrase } from "@/lib/stellar";

describe("SEP-10 End-to-End Auth", () => {
  const originalEnv = { ...process.env };
  let serverKeypair: Keypair;
  let clientKeypair: Keypair;

  beforeEach(() => {
    // Reset env
    process.env = { ...originalEnv };
    // Generate fresh keypairs for testing
    serverKeypair = Keypair.random();
    clientKeypair = Keypair.random();
    process.env.STELLAR_SERVER_SECRET = serverKeypair.secret();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Testnet Configuration", () => {
    beforeEach(() => {
      process.env.STELLAR_NETWORK = "testnet";
    });

    it("should resolve the testnet passphrase", () => {
      expect(getNetworkPassphrase()).toBe(Networks.TESTNET);
    });

    it("should generate, sign, and verify challenge successfully on testnet", () => {
      const clientPublicKey = clientKeypair.publicKey();
      
      // 1. Generate challenge on server
      const { transactionXDR, transactionHash } = generateChallenge(clientPublicKey);
      expect(transactionXDR).toBeDefined();
      expect(transactionHash).toBeDefined();

      // Verify the generated challenge uses the testnet passphrase
      const tx = TransactionBuilder.fromXDR(transactionXDR, Networks.TESTNET);
      expect(tx.networkPassphrase).toBe(Networks.TESTNET);

      // 2. Simulate client signing transaction with testnet passphrase
      tx.sign(clientKeypair);
      const signedXDR = tx.toXDR();

      // 3. Verify challenge on server
      const verification = verifyChallenge(signedXDR, clientPublicKey);
      expect(verification.valid).toBe(true);
      expect(verification.clientPublicKey).toBe(clientPublicKey);
      expect(verification.error).toBeUndefined();
    });

    it("should fail verification if client signs with a different passphrase", () => {
      const clientPublicKey = clientKeypair.publicKey();
      const { transactionXDR } = generateChallenge(clientPublicKey);

      // Simulate client signing with PUBLIC passphrase instead of TESTNET
      const tx = TransactionBuilder.fromXDR(transactionXDR, Networks.PUBLIC);
      tx.sign(clientKeypair);
      const signedXDR = tx.toXDR();

      const verification = verifyChallenge(signedXDR, clientPublicKey);
      expect(verification.valid).toBe(false);
      expect(verification.error).toContain("signature");
    });

    it("should extract client public key correctly on testnet", () => {
      const clientPublicKey = clientKeypair.publicKey();
      const { transactionXDR } = generateChallenge(clientPublicKey);
      
      const extracted = extractClientPublicKey(transactionXDR);
      expect(extracted).toBe(clientPublicKey);
    });
  });

  describe("Public/Mainnet Configuration", () => {
    beforeEach(() => {
      process.env.STELLAR_NETWORK = "public";
    });

    it("should resolve the public passphrase", () => {
      expect(getNetworkPassphrase()).toBe(Networks.PUBLIC);
    });

    it("should generate, sign, and verify challenge successfully on public network", () => {
      const clientPublicKey = clientKeypair.publicKey();
      
      // 1. Generate challenge on server
      const { transactionXDR } = generateChallenge(clientPublicKey);

      // Verify the generated challenge uses the public passphrase
      const tx = TransactionBuilder.fromXDR(transactionXDR, Networks.PUBLIC);
      expect(tx.networkPassphrase).toBe(Networks.PUBLIC);

      // 2. Simulate client signing transaction with public passphrase
      tx.sign(clientKeypair);
      const signedXDR = tx.toXDR();

      // 3. Verify challenge on server
      const verification = verifyChallenge(signedXDR, clientPublicKey);
      expect(verification.valid).toBe(true);
      expect(verification.clientPublicKey).toBe(clientPublicKey);
    });

    it("should fail verification if client signs with a different passphrase", () => {
      const clientPublicKey = clientKeypair.publicKey();
      const { transactionXDR } = generateChallenge(clientPublicKey);

      // Simulate client signing with TESTNET passphrase instead of PUBLIC
      const tx = TransactionBuilder.fromXDR(transactionXDR, Networks.TESTNET);
      tx.sign(clientKeypair);
      const signedXDR = tx.toXDR();

      const verification = verifyChallenge(signedXDR, clientPublicKey);
      expect(verification.valid).toBe(false);
      expect(verification.error).toContain("signature");
    });
  });
});
