import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  getAdminPassword,
} from "@/lib/env";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;

  if (!body?.password || body.password !== getAdminPassword()) {
    return Response.json({ ok: false, message: "后台密码不正确。" }, { status: 401 });
  }

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(createAdminSessionToken())}; Path=/; Max-Age=${ADMIN_SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax${secure}`,
      },
    },
  );
}
