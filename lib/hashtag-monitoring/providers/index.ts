/**
 * Hashtag Monitoring Providers Registry
 *
 * This module imports all provider implementations, causing them
 * to self-register via registerProvider() on module load.
 *
 * Import this module from the webhook route to ensure all providers
 * are registered before handling requests.
 */

// Import providers to trigger their self-registration
import "./apify";

// Re-export for convenience if needed
export { apifyProvider } from "./apify";
