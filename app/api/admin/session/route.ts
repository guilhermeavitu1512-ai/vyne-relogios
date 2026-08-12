import { getAdminSession } from "@/lib/server/auth";

export async function GET(request: Request) {
  const session = await getAdminSession(request);
  if (!session) {
    return Response.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json(
    { authenticated: true, user: { username: session.username }, csrfToken: session.csrfToken },
    { headers: { "Cache-Control": "no-store" } },
  );
}
