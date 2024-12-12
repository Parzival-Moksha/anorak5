let queryCounter = 0;  // This will reset when the server restarts

export async function GET() {
  return Response.json({ count: queryCounter });
}

export async function POST() {
  queryCounter += 1;
  return Response.json({ count: queryCounter });
} 