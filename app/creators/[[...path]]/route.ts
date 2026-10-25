// Keep a permanent removal response so crawlers can retire old directory URLs.
export function GET() {
  return new Response("The creator directory has been removed.", {
    status: 410,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}
