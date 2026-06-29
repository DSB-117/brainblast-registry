import { NextRequest } from "next/server";
import { serve } from "../../../lib/distribution";

// GET /api/healthz — liveness + corpus size.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return serve(req, "/healthz");
}
