/**
 * Hashtag Monitoring Provider Registry
 *
 * Central registry for all hashtag monitoring providers.
 * Providers register themselves and can be looked up by name.
 */

import type { HashtagMonitoringProvider } from "./types";

const providers = new Map<string, HashtagMonitoringProvider>();

/**
 * Register a new hashtag monitoring provider
 */
export function registerProvider(provider: HashtagMonitoringProvider): void {
  if (providers.has(provider.name)) {
    console.warn(
      `Hashtag monitoring provider "${provider.name}" is already registered. Overwriting.`
    );
  }
  providers.set(provider.name, provider);
}

/**
 * Get a registered provider by name
 * @returns The provider or undefined if not found
 */
export function getProvider(name: string): HashtagMonitoringProvider | undefined {
  return providers.get(name);
}

/**
 * Get all registered provider names
 */
export function getProviderNames(): string[] {
  return Array.from(providers.keys());
}

/**
 * Check if a provider is registered
 */
export function hasProvider(name: string): boolean {
  return providers.has(name);
}

// Re-export types for convenience
export * from "./types";
