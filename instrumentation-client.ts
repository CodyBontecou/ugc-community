import { initBotId } from "botid/client/core";

// Define the paths that need bot protection.
// These are paths that are routed to by your app:
// - API endpoints (e.g., '/api/waitlist')
// - Server actions invoked from a page
// - Dynamic routes (e.g., '/api/user/*')

initBotId({
  protect: [
    // Public form endpoints - high priority for bot protection
    { path: "/api/waitlist", method: "POST" },
    { path: "/api/portfolio/contact", method: "POST" },

    // Invite redemption - prevent automated invite farming
    { path: "/api/invites/use", method: "POST" },

    // User operations
    { path: "/api/user/subdomain", method: "POST" },
    { path: "/api/user/username", method: "POST" },

    // Media upload - expensive operation
    { path: "/api/media/upload", method: "POST" },
  ],
});
