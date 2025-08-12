// Legacy file kept intentionally empty to avoid route conflicts when using catch-all in `[...path]`.
export async function GET() {
  return new Response(
    JSON.stringify({ error: 'Use /api/{videos|thumbnails|processed}/...' }),
    {
      status: 400,
      headers: { 'content-type': 'application/json' },
    }
  );
}