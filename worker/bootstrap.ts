// Bootstrap file - sets up WebSocket polyfill before any other imports
import { WebSocket } from "ws";

// Add WebSocket to global scope for Inngest Connect
Object.assign(globalThis, { WebSocket });

// Now import and run the main worker
import("./index.js");
