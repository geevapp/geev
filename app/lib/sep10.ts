/**
 * SEP-10 Web Authentication implementation
 * 
 * This module implements the Stellar Ecosystem Proposal 10 (SEP-10) Web Authentication flow.
 * It provides functions to generate authentication challenges and verify signed transactions.
 * 
 * @see https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md
 */

import {
  Keypair,
  Transaction,
  TransactionBuilder,
  Operation,
  Networks,
  BASE_FEE,
  Account,
} from "@stellar/stellar-sdk";

// Lazy-loaded server keypair to avoid errors during module initialization in tests
let _serverKeypair: Keypair | null = null;
let _serverKeyError: Error | null = null;

function getServerKeypair(): Keypair {
  if (_serverKeyError) {
    throw _serverKeyError;
  }
  if (!_serverKeypair) {
    const secret = process.env.STELLAR_SERVER_SECRET;
    if (!secret) {
      _serverKeyError = new Error(
        "STELLAR_SERVER_SECRET environment variable is required for SEP-10 authentication"
      );
      throw _serverKeyError;
    }
    try {
      _serverKeypair = Keypair.fromSecret(secret);
    } catch (error) {
      _serverKeyError = error instanceof Error 
        ? error 
        : new Error("Invalid STELLAR_SERVER_SECRET");
      throw _serverKeyError;
    }
  }
  return _serverKeypair;
}

/**
 * Check if SEP-10 is properly configured
 */
export function isSEP10Configured(): boolean {
  try {
    getServerKeypair();
    return true;
  } catch {
    return false;
  }
}



// Challenge expiration time in seconds (15 minutes as per SEP-10 recommendation)
const CHALLENGE_EXPIRATION_SECONDS = 15 * 60;

// Transaction timeout bounds (5 minutes minimum as per SEP-10)
const MIN_TRANSACTION_TIMEOUT_SECONDS = 5 * 60;

// Home domain for the challenge transaction
const HOME_DOMAIN = process.env.STELLAR_HOME_DOMAIN || "geev.app";

// Web auth domain (optional, for additional security)
const WEB_AUTH_DOMAIN = process.env.STELLAR_WEB_AUTH_DOMAIN || HOME_DOMAIN;

/**
 * Generate a random nonce for the challenge transaction
 */
function generateNonce(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 64);
}

/**
 * Generate a SEP-10 challenge transaction (XDR)
 * 
 * @param clientPublicKey - The client's Stellar public key
 * @param homeDomain - The home domain for the challenge (optional)
 * @returns Object containing the transaction XDR and the transaction hash
 */
export function generateChallenge(
  clientPublicKey: string,
  homeDomain: string = HOME_DOMAIN
): { transactionXDR: string; transactionHash: string; nonce: string } {
  // Validate the client public key
  try {
    Keypair.fromPublicKey(clientPublicKey);
  } catch (error) {
    throw new Error("Invalid client public key");
  }

  const nonce = generateNonce();
  const now = Math.floor(Date.now() / 1000);
  const minTime = now;
  const maxTime = now + CHALLENGE_EXPIRATION_SECONDS;

  // Build the challenge transaction
  // SEP-10 requires a transaction with:
  // 1. Source account = server's public key
  // 2. Sequence number = 0
  // 3. Time bounds set
  // 4. A manage_data operation with the client's public key as the source
  const serverKeypair = getServerKeypair();
  const serverPublicKey = serverKeypair.publicKey();
  
  // Create a dummy account with sequence number 0 for the challenge
  const serverAccount = new Account(serverPublicKey, "0");
  
  const transaction = new TransactionBuilder(serverAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.PUBLIC,
  })
    .setTimeout(CHALLENGE_EXPIRATION_SECONDS)
    .addOperation(
      Operation.manageData({
        name: `${homeDomain} auth`,
        value: Buffer.from(nonce, "hex"),
        source: clientPublicKey,
      })
    )
    .addOperation(
      Operation.manageData({
        name: "web_auth_domain",
        value: WEB_AUTH_DOMAIN,
        source: serverPublicKey,
      })
    )
    .setTimebounds(minTime, maxTime)
    .build();

  // Sign the transaction with the server's key
  transaction.sign(serverKeypair);

  return {
    transactionXDR: transaction.toXDR(),
    transactionHash: transaction.hash().toString("hex"),
    nonce,
  };
}

/**
 * Verify a signed SEP-10 challenge transaction
 * 
 * @param signedXDR - The signed transaction XDR from the client
 * @param clientPublicKey - The expected client public key
 * @param homeDomain - The expected home domain
 * @returns Object containing verification result and extracted data
 */
export function verifyChallenge(
  signedXDR: string,
  clientPublicKey: string,
  homeDomain: string = HOME_DOMAIN
): {
  valid: boolean;
  error?: string;
  clientPublicKey?: string;
} {
  try {
    // Decode the transaction
    const transaction = TransactionBuilder.fromXDR(
      signedXDR,
      Networks.PUBLIC
    ) as Transaction;

    const serverKeypair = getServerKeypair();
    const serverPublicKey = serverKeypair.publicKey();

    // 1. Verify the transaction source is the server
    if (transaction.source !== serverPublicKey) {
      return { valid: false, error: "Invalid transaction source" };
    }

    // 2. Verify the sequence number is 0 (as per SEP-10)
    if (transaction.sequence !== "0") {
      return { valid: false, error: "Invalid sequence number" };
    }

    // 3. Verify time bounds exist and are valid
    const timeBounds = transaction.timeBounds;
    if (!timeBounds) {
      return { valid: false, error: "Missing time bounds" };
    }

    const now = Math.floor(Date.now() / 1000);
    const minTime = parseInt(timeBounds.minTime, 10);
    const maxTime = parseInt(timeBounds.maxTime, 10);

    // Check if transaction has expired
    if (now > maxTime) {
      return { valid: false, error: "Transaction has expired" };
    }

    // Check minimum time bounds duration (prevent replay attacks with very short windows)
    if (maxTime - minTime < MIN_TRANSACTION_TIMEOUT_SECONDS) {
      return { valid: false, error: "Invalid time bounds duration" };
    }

    // 4. Verify the transaction has at least one operation
    const operations = transaction.operations;
    if (operations.length === 0) {
      return { valid: false, error: "No operations in transaction" };
    }

    // 5. Verify the first operation is a manageData with the client's public key as source
    const firstOp = operations[0];
    if (firstOp.type !== "manageData") {
      return { valid: false, error: "First operation must be manageData" };
    }

    // Check the operation name matches the home domain
    const expectedName = `${homeDomain} auth`;
    if (firstOp.name !== expectedName) {
      return { valid: false, error: "Invalid home domain in challenge" };
    }

    // Verify the source account of the first operation matches the expected client
    if (firstOp.source !== clientPublicKey) {
      return { valid: false, error: "Client public key mismatch" };
    }

    // 6. Verify the transaction is signed by the server
    const serverSignatureValid = transaction.signatures.some((sig: any) => {
      try {
        return serverKeypair.verify(
          transaction.hash(),
          sig.signature()
        );
      } catch {
        return false;
      }
    });

    if (!serverSignatureValid) {
      return { valid: false, error: "Invalid server signature" };
    }

    // 7. Verify the transaction is signed by the client
    const clientKeypair = Keypair.fromPublicKey(clientPublicKey);
    const clientSignatureValid = transaction.signatures.some((sig: any) => {
      try {
        return clientKeypair.verify(transaction.hash(), sig.signature());
      } catch {
        return false;
      }
    });

    if (!clientSignatureValid) {
      return { valid: false, error: "Invalid client signature" };
    }

    // 8. Verify web_auth_domain if present (optional check for additional security)
    const webAuthOp = operations.find(
      (op: any) => op.type === "manageData" && op.name === "web_auth_domain"
    );
    if (webAuthOp && webAuthOp.value) {
      const authDomain = Buffer.from(webAuthOp.value).toString();
      if (authDomain !== WEB_AUTH_DOMAIN) {
        return { valid: false, error: "Invalid web auth domain" };
      }
    }

    return {
      valid: true,
      clientPublicKey,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown verification error",
    };
  }
}

/**
 * Extract the client public key from a signed challenge transaction
 * This is useful when you want to identify the signer without full verification
 * 
 * @param signedXDR - The signed transaction XDR
 * @returns The client public key or null if extraction fails
 */
export function extractClientPublicKey(signedXDR: string): string | null {
  try {
    const transaction = TransactionBuilder.fromXDR(
      signedXDR,
      Networks.PUBLIC
    ) as Transaction;

    const firstOp = transaction.operations[0];
    if (firstOp?.type === "manageData" && firstOp.source) {
      return firstOp.source;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get the server's public key
 */
export function getServerPublicKey(): string {
  return getServerKeypair().publicKey();
}

/**
 * Get the home domain
 */
export function getHomeDomain(): string {
  return HOME_DOMAIN;
}

/**
 * Get the web auth domain
 */
export function getWebAuthDomain(): string {
  return WEB_AUTH_DOMAIN;
}
