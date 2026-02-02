import { connect } from "inngest/connect";
import { inngest } from "../lib/inngest/client";
import { processVideoFunction } from "../lib/inngest/functions/process-video";

async function main() {
  console.log("Starting Inngest Connect worker...");

  const connection = await connect({
    apps: [
      {
        client: inngest,
        functions: [processVideoFunction],
      },
    ],
  });

  console.log(`Connected with ID: ${connection.connectionId}`);
  console.log(`Connection state: ${connection.state}`);

  // Wait for the connection to close (happens on shutdown signal)
  await connection.closed;
  console.log("Connection closed");
}

main().catch((err) => {
  console.error("Worker error:", err);
  process.exit(1);
});
