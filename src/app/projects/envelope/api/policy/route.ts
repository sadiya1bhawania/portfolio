import { setActivePolicy, getActivePolicy, getCounts } from "../../lib/serverPolicyState";
import type { Policy } from "../../lib/policyTypes";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const policy = (await request.json()) as Policy;
  setActivePolicy(policy);
  return Response.json({ ok: true });
}

export async function GET() {
  return Response.json({ policy: getActivePolicy(), counts: getCounts() });
}
