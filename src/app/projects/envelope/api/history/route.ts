import { getHistory } from "../../lib/runHistory";
import { getCounts } from "../../lib/serverPolicyState";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ history: getHistory(), counts: getCounts() });
}
