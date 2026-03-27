/**
 * Soroban Blockchain Indexer Service
 * 
 * This service syncs on-chain data from the Geev Soroban smart contract
 * to the local PostgreSQL database for fast querying.
 * 
 * Features:
 * - Fetches events from Soroban RPC using getEvents
 * - Processes GiveawayCreated, HelpRequestPosted, DonationReceived events
 * - Tracks last processed ledger sequence for idempotency
 * - Prevents duplicate event processing
 */

import { prisma } from "./prisma";

// Configuration
const SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const CONTRACT_ID = process.env.GEEV_CONTRACT_ID || "";
const INDEXER_POLL_INTERVAL_MS = parseInt(process.env.INDEXER_POLL_INTERVAL_MS || "5000");
const NETWORK = process.env.SOROBAN_NETWORK || "testnet";

// Event topics we want to index
const EVENT_TOPICS = [
  "HelpRequestPosted",
  "DonationReceived", 
  "RefundClaimed",
  "RequestCancelled",
];

/**
 * Soroban RPC Event Response
 */
interface SorobanEvent {
  type: "contract";
  ledger: number;
  ledgerClosedAt: string;
  contractId: string;
  id: string;
  pagingToken: string;
  topic: string[];
  value: string;
  inSuccessfulContractCall: boolean;
  txHash: string;
}

interface GetEventsResponse {
  events: SorobanEvent[];
  latestLedger: number;
}

/**
 * Get or initialize the indexer state
 */
async function getIndexerState(): Promise<{
  lastLedgerSeq: number;
  contractId: string;
}> {
  let state = await prisma.indexerState.findUnique({
    where: { id: "singleton" },
  });

  if (!state) {
    // Initialize with a default starting ledger (current ledger - 1000)
    // In production, you might want to start from a specific deployment ledger
    const startLedger = await getCurrentLedger() - 1000;
    
    state = await prisma.indexerState.create({
      data: {
        id: "singleton",
        lastLedgerSeq: startLedger > 0 ? startLedger : 1,
        contractId: CONTRACT_ID,
        network: NETWORK,
      },
    });
  }

  return {
    lastLedgerSeq: state.lastLedgerSeq,
    contractId: state.contractId,
  };
}

/**
 * Update the last processed ledger sequence
 */
async function updateLastLedgerSeq(ledgerSeq: number): Promise<void> {
  await prisma.indexerState.update({
    where: { id: "singleton" },
    data: { lastLedgerSeq: ledgerSeq },
  });
}

/**
 * Get the current ledger from Soroban RPC
 */
async function getCurrentLedger(): Promise<number> {
  try {
    const response = await fetch(SOROBAN_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getLatestLedger",
      }),
    });

    const data = await response.json();
    return data.result?.sequence || 1;
  } catch (error) {
    console.error("Failed to get current ledger:", error);
    return 1;
  }
}

/**
 * Fetch events from Soroban RPC
 */
async function fetchEvents(
  startLedger: number,
  endLedger: number
): Promise<SorobanEvent[]> {
  try {
    const response = await fetch(SOROBAN_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getEvents",
        params: {
          startLedger,
          endLedger,
          filters: [
            {
              type: "contract",
              contractIds: CONTRACT_ID ? [CONTRACT_ID] : undefined,
            },
          ],
          pagination: {
            limit: 100,
          },
        },
      }),
    });

    const data: { result?: GetEventsResponse; error?: any } = await response.json();
    
    if (data.error) {
      console.error("Soroban RPC error:", data.error);
      return [];
    }

    return data.result?.events || [];
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return [];
  }
}

/**
 * Check if an event has already been processed
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.processedEvent.findUnique({
    where: { eventId },
  });
  return !!existing;
}

/**
 * Mark an event as processed
 */
async function markEventProcessed(
  eventId: string,
  eventType: string,
  txHash: string,
  ledgerSeq: number
): Promise<void> {
  await prisma.processedEvent.create({
    data: {
      eventId,
      eventType,
      txHash,
      ledgerSeq,
    },
  });
}

/**
 * Parse event topic to extract event type and data
 */
function parseEventTopic(topic: string[]): {
  eventType: string;
  requestId?: bigint;
  address?: string;
} {
  // Topics are base64-encoded XDR strings
  // First topic is usually the event type symbol
  const eventType = topic[0] || "Unknown";
  
  // Try to extract additional data from topics
  let requestId: bigint | undefined;
  let address: string | undefined;

  // Parse based on known event structures
  if (topic.length >= 2) {
    try {
      // topic[1] could be request_id (u64) or address
      const decoded = Buffer.from(topic[1], "base64").toString("hex");
      // Check if it looks like a u64 (16 hex chars)
      if (decoded.length === 16) {
        requestId = BigInt("0x" + decoded);
      }
    } catch {
      // Not a valid u64, might be an address
    }
  }

  if (topic.length >= 3) {
    try {
      // topic[2] is usually an address
      address = topic[2];
    } catch {
      // Ignore parsing errors
    }
  }

  return { eventType, requestId, address };
}

/**
 * Parse event value to extract data
 */
function parseEventValue(value: string): {
  amount?: bigint;
  goal?: bigint;
} {
  try {
    // Value is base64-encoded XDR
    const decoded = Buffer.from(value, "base64");
    
    // For simple tuple values like (amount,) or (goal,)
    // This is a simplified parser - in production, use proper XDR decoding
    if (decoded.length >= 8) {
      // Try to read as i128 (16 bytes) or i64 (8 bytes)
      const amount = decoded.readBigInt64BE(decoded.length - 8);
      return { amount };
    }
  } catch {
    // Ignore parsing errors
  }
  return {};
}

/**
 * Handle HelpRequestPosted event
 */
async function handleHelpRequestPosted(
  event: SorobanEvent,
  parsedTopic: { requestId?: bigint; address?: string },
  parsedValue: { goal?: bigint }
): Promise<void> {
  if (!parsedTopic.requestId) {
    console.warn("HelpRequestPosted event missing requestId");
    return;
  }

  const requestId = parsedTopic.requestId;
  
  // Check if already processed
  const eventId = `${event.txHash}-${event.id}`;
  if (await isEventProcessed(eventId)) {
    return;
  }

  // Parse value to get goal amount
  // In a real implementation, you'd fetch the full request data from the contract
  // or parse the event value more thoroughly
  const goalAmount = parsedValue.goal || BigInt(0);

  // Create or update the help request in database
  await prisma.onChainHelpRequest.upsert({
    where: { requestId },
    create: {
      requestId,
      creatorAddress: parsedTopic.address || event.contractId,
      tokenAddress: "", // Would need to fetch from contract or parse from event
      goal: Number(goalAmount) / 10_000_000, // Convert from stroops to units
      raisedAmount: 0,
      status: "OPEN",
      txHash: event.txHash,
      ledgerSeq: event.ledger,
    },
    update: {
      // Only update if this is a newer event
      txHash: event.txHash,
      ledgerSeq: event.ledger,
    },
  });

  await markEventProcessed(eventId, "HelpRequestPosted", event.txHash, event.ledger);
  console.log(`Indexed HelpRequestPosted: requestId=${requestId}`);
}

/**
 * Handle DonationReceived event
 */
async function handleDonationReceived(
  event: SorobanEvent,
  parsedTopic: { requestId?: bigint; address?: string },
  parsedValue: { amount?: bigint }
): Promise<void> {
  if (!parsedTopic.requestId || !parsedTopic.address) {
    console.warn("DonationReceived event missing requestId or donor address");
    return;
  }

  const requestId = parsedTopic.requestId;
  const donorAddress = parsedTopic.address;
  const amount = parsedValue.amount || BigInt(0);

  // Check if already processed
  const eventId = `${event.txHash}-${event.id}`;
  if (await isEventProcessed(eventId)) {
    return;
  }

  // Create donation record
  const donationId = `${event.txHash}-${requestId}-${donorAddress}`;
  await prisma.onChainDonation.create({
    data: {
      donationId,
      requestId,
      donorAddress,
      amount: Number(amount) / 10_000_000, // Convert from stroops to units
      txHash: event.txHash,
      ledgerSeq: event.ledger,
    },
  });

  // Update help request raised amount
  await prisma.onChainHelpRequest.update({
    where: { requestId },
    data: {
      raisedAmount: {
        increment: Number(amount) / 10_000_000,
      },
    },
  });

  // Check if fully funded and update status
  const helpRequest = await prisma.onChainHelpRequest.findUnique({
    where: { requestId },
  });

  if (helpRequest && helpRequest.raisedAmount >= helpRequest.goal) {
    await prisma.onChainHelpRequest.update({
      where: { requestId },
      data: { status: "FULLY_FUNDED" },
    });
  }

  await markEventProcessed(eventId, "DonationReceived", event.txHash, event.ledger);
  console.log(`Indexed DonationReceived: requestId=${requestId}, donor=${donorAddress}`);
}

/**
 * Handle RefundClaimed event
 */
async function handleRefundClaimed(
  event: SorobanEvent,
  parsedTopic: { requestId?: bigint; address?: string }
): Promise<void> {
  if (!parsedTopic.requestId) {
    console.warn("RefundClaimed event missing requestId");
    return;
  }

  const eventId = `${event.txHash}-${event.id}`;
  if (await isEventProcessed(eventId)) {
    return;
  }

  // Mark donation as refunded (you might want to add a status field)
  // For now, just track that the event was processed
  await markEventProcessed(eventId, "RefundClaimed", event.txHash, event.ledger);
  console.log(`Indexed RefundClaimed: requestId=${parsedTopic.requestId}`);
}

/**
 * Handle RequestCancelled event
 */
async function handleRequestCancelled(
  event: SorobanEvent,
  parsedTopic: { requestId?: bigint }
): Promise<void> {
  if (!parsedTopic.requestId) {
    console.warn("RequestCancelled event missing requestId");
    return;
  }

  const requestId = parsedTopic.requestId;
  const eventId = `${event.txHash}-${event.id}`;

  if (await isEventProcessed(eventId)) {
    return;
  }

  await prisma.onChainHelpRequest.update({
    where: { requestId },
    data: { status: "CANCELLED" },
  });

  await markEventProcessed(eventId, "RequestCancelled", event.txHash, event.ledger);
  console.log(`Indexed RequestCancelled: requestId=${requestId}`);
}

/**
 * Process a single event
 */
async function processEvent(event: SorobanEvent): Promise<void> {
  const { eventType, requestId, address } = parseEventTopic(event.topic);
  const parsedValue = parseEventValue(event.value);

  console.log(`Processing event: ${eventType} at ledger ${event.ledger}`);

  try {
    switch (eventType) {
      case "HelpRequestPosted":
        await handleHelpRequestPosted(event, { requestId, address }, parsedValue);
        break;
      case "DonationReceived":
        await handleDonationReceived(event, { requestId, address }, parsedValue);
        break;
      case "RefundClaimed":
        await handleRefundClaimed(event, { requestId, address });
        break;
      case "RequestCancelled":
        await handleRequestCancelled(event, { requestId });
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`Error processing event ${eventType}:`, error);
    // Don't throw - continue processing other events
  }
}

/**
 * Run a single indexing iteration
 */
async function runIndexerIteration(): Promise<void> {
  if (!CONTRACT_ID) {
    console.warn("GEEV_CONTRACT_ID not set, skipping indexer");
    return;
  }

  const state = await getIndexerState();
  const currentLedger = await getCurrentLedger();

  // Don't fetch too far ahead (max 1000 ledgers at a time)
  const endLedger = Math.min(
    currentLedger,
    state.lastLedgerSeq + 1000
  );

  if (state.lastLedgerSeq >= endLedger) {
    console.log(`No new ledgers to process. Current: ${currentLedger}, Last processed: ${state.lastLedgerSeq}`);
    return;
  }

  console.log(`Fetching events from ledger ${state.lastLedgerSeq} to ${endLedger}`);

  const events = await fetchEvents(state.lastLedgerSeq, endLedger);

  if (events.length === 0) {
    console.log("No events found in range");
    await updateLastLedgerSeq(endLedger);
    return;
  }

  console.log(`Found ${events.length} events`);

  // Process events in order
  for (const event of events) {
    await processEvent(event);
  }

  // Update the last processed ledger
  await updateLastLedgerSeq(endLedger);
  console.log(`Updated last ledger to ${endLedger}`);
}

/**
 * Start the indexer in continuous loop mode
 */
export async function startIndexer(): Promise<void> {
  console.log("Starting Soroban Indexer...");
  console.log(`RPC URL: ${SOROBAN_RPC_URL}`);
  console.log(`Contract ID: ${CONTRACT_ID || "NOT SET"}`);
  console.log(`Poll interval: ${INDEXER_POLL_INTERVAL_MS}ms`);

  if (!CONTRACT_ID) {
    console.error("GEEV_CONTRACT_ID environment variable is required");
    return;
  }

  // Run immediately, then on interval
  await runIndexerIteration();

  setInterval(async () => {
    try {
      await runIndexerIteration();
    } catch (error) {
      console.error("Indexer iteration failed:", error);
    }
  }, INDEXER_POLL_INTERVAL_MS);
}

/**
 * Run indexer once (for manual triggering or cron jobs)
 */
export async function runIndexerOnce(): Promise<void> {
  console.log("Running indexer once...");
  await runIndexerIteration();
}

/**
 * Reset indexer state (use with caution)
 */
export async function resetIndexerState(startLedger?: number): Promise<void> {
  const ledger = startLedger || (await getCurrentLedger()) - 1000;
  
  await prisma.indexerState.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      lastLedgerSeq: ledger,
      contractId: CONTRACT_ID,
      network: NETWORK,
    },
    update: {
      lastLedgerSeq: ledger,
    },
  });

  console.log(`Indexer state reset to ledger ${ledger}`);
}

/**
 * Get indexer statistics
 */
export async function getIndexerStats(): Promise<{
  lastLedgerSeq: number;
  currentLedger: number;
  lag: number;
  processedEvents: number;
}> {
  const state = await getIndexerState();
  const currentLedger = await getCurrentLedger();
  const processedEvents = await prisma.processedEvent.count();

  return {
    lastLedgerSeq: state.lastLedgerSeq,
    currentLedger,
    lag: currentLedger - state.lastLedgerSeq,
    processedEvents,
  };
}