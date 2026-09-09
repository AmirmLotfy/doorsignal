import { verifyRingWebhookSignature } from '@doorsignal/ring-client';

// In-memory deduplication set for local dev / fast testing with 24-hour TTL simulation
const processedRequests = new Map<string, number>();

export function checkAndStoreRequestId(requestId: string): boolean {
  const now = Date.now();
  // Clear expired entries (> 24 hours)
  for (const [id, ts] of processedRequests.entries()) {
    if (now - ts > 24 * 60 * 60 * 1000) {
      processedRequests.delete(id);
    }
  }

  if (processedRequests.has(requestId)) {
    return false; // Already processed
  }

  processedRequests.set(requestId, now);
  return true;
}

export function verifyAndDeduplicate(
  rawBody: string,
  signatureHeader: string,
  requestId: string,
  secret: string
): { success: boolean; isDuplicate: boolean; error?: string } {
  const verification = verifyRingWebhookSignature({
    rawBody,
    signatureHeader,
    webhookSecret: secret
  });

  if (!verification.isValid) {
    return { success: false, isDuplicate: false, error: verification.reason };
  }

  const isNew = checkAndStoreRequestId(requestId);
  if (!isNew) {
    return { success: true, isDuplicate: true };
  }

  return { success: true, isDuplicate: false };
}
