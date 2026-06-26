/**
 * Stellar utility layer
 * Wraps Horizon API calls for payment verification, submission, and balance reads.
 */
import {
  Keypair,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
  Account,
  Memo,
  Horizon,
} from "@stellar/stellar-sdk";

const HORIZON_URL =
  process.env.STELLAR_HORIZON_URL ?? "https://horizon.stellar.org";

export function getNetworkPassphrase(): string {
  return process.env.STELLAR_NETWORK === "testnet"
    ? Networks.TESTNET
    : Networks.PUBLIC;
}

const NETWORK_PASSPHRASE = getNetworkPassphrase();

const horizon = new Horizon.Server(HORIZON_URL);

/**
 * Verify that a given transaction hash represents a payment to `destinationAddress`
 * of at least `expectedAmount` in any supported asset.
 * Returns the payment's `from` address along with verified amount and asset.
 * Throws with a human-readable message on failure.
 */
export async function verifyStellarPayment(
  txHash: string,
  destinationAddress: string,
  expectedAmount: number,
): Promise<{ amount: number; asset: string; from: string }> {
  let tx: any;
  try {
    tx = await horizon.transactions().transaction(txHash).call();
  } catch {
    throw new Error("Transaction not found on Stellar network");
  }

  if (!tx.successful) throw new Error("Stellar transaction was not successful");

  // Pull the operations for this transaction
  const ops = await horizon.operations().forTransaction(txHash).call();

  const payment = ops.records.find(
    (op: any) => op.type === "payment" && op.to === destinationAddress,
  ) as any | undefined;

  if (!payment) {
    throw new Error(
      "No matching payment operation found for the given destination",
    );
  }

  const onChainAmount = parseFloat(payment.amount);
  if (onChainAmount < expectedAmount) {
    throw new Error(
      `On-chain amount (${onChainAmount}) is less than the requested amount (${expectedAmount})`,
    );
  }

  const asset =
    payment.asset_type === "native" ? "XLM" : payment.asset_code ?? "UNKNOWN";

  return { amount: onChainAmount, asset, from: payment.from };
}

interface WithdrawalParams {
  sourceAddress: string;
  destinationAddress: string;
  amount: number;
  asset: string;
}

/**
 * Build and submit a Stellar payment from the platform's server keypair.
 * Returns the transaction hash on success, throws on failure.
 */
export async function submitStellarWithdrawal(
  params: WithdrawalParams,
): Promise<string> {
  const secret = process.env.STELLAR_SERVER_SECRET;
  if (!secret) throw new Error("STELLAR_SERVER_SECRET is not configured");

  const serverKeypair = Keypair.fromSecret(secret);

  const { destinationAddress, amount, asset } = params;

  const accountData = await horizon.loadAccount(serverKeypair.publicKey());
  const account = new Account(serverKeypair.publicKey(), accountData.sequence);

  const stellarAsset =
    asset === "XLM"
      ? Asset.native()
      : new Asset(asset, process.env.STELLAR_ASSET_ISSUER ?? "");

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: destinationAddress,
        asset: stellarAsset,
        amount: amount.toFixed(7),
      }),
    )
    .setTimeout(180)
    .build();

  tx.sign(serverKeypair);

  let result: Horizon.HorizonApi.SubmitTransactionResponse;
  try {
    result = await horizon.submitTransaction(tx);
  } catch (error: any) {
    // Handle Horizon error response which may contain extras with result_codes
    const resultCodes = error?.response?.data?.extras?.result_codes;
    const errorMessage = resultCodes
      ? `Stellar submission failed: ${JSON.stringify(resultCodes)}`
      : `Stellar submission failed: ${error?.message || "Unknown error"}`;
    throw new Error(errorMessage);
  }

  if (!result.successful) {
    throw new Error(
      `Stellar submission failed: Transaction was not successful`,
    );
  }

  return result.hash;
}

export interface AssetBalance {
  code: string;
  issuer: string | null;
  balance: number;
}

/**
 * Fetch all asset balances for a Stellar address from Horizon.
 */
export async function getLiveBalances(
  stellarAddress?: string | null,
): Promise<AssetBalance[]> {
  if (!stellarAddress) return [];
  const account = await horizon.loadAccount(stellarAddress);
  return account.balances.map((b: any) => ({
    code: b.asset_type === "native" ? "XLM" : b.asset_code,
    issuer: b.asset_type === "native" ? null : b.asset_issuer,
    balance: parseFloat(b.balance),
  }));
}

export interface ChainTransaction {
  txHash: string;
  type: string;
  amount: number;
  asset: string;
  from: string;
  to: string;
  createdAt: string;
}

/**
 * Fetch recent payment operations for a Stellar address and normalise them
 * into the same shape as local WalletTransaction records.
 */
export async function getLiveTransactions(
  stellarAddress: string,
  limit = 20,
): Promise<ChainTransaction[]> {
  const ops = await horizon
    .operations()
    .forAccount(stellarAddress)
    .order("desc")
    .limit(limit)
    .call();

  return ops.records
    .filter((op: any) => op.type === "payment")
    .map((op: any) => ({
      txHash: op.transaction_hash,
      type: op.to === stellarAddress ? "fund" : "withdraw",
      amount: parseFloat(op.amount),
      asset: op.asset_type === "native" ? "XLM" : op.asset_code,
      from: op.from,
      to: op.to,
      createdAt: op.created_at,
    }));
}
