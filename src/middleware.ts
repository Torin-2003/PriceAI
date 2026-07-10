import { NextResponse, type NextRequest } from "next/server";

const ACTIVE_DEPLOYMENT_ID = process.env.NEXT_DEPLOYMENT_ID;
const STALE_CSS_BROWSER_SECONDS = 86400;
const STALE_CSS_EDGE_SECONDS = 604800;

function isStaleDeploymentCssRequest(request: NextRequest) {
  const requestedDeploymentId = request.nextUrl.searchParams.get("dpl");

  return Boolean(ACTIVE_DEPLOYMENT_ID && requestedDeploymentId && requestedDeploymentId !== ACTIVE_DEPLOYMENT_ID);
}

export function middleware(request: NextRequest) {
  if (!isStaleDeploymentCssRequest(request)) {
    return NextResponse.next();
  }

  // Search Console can retain old deployment CSS URLs after the asset bundle is replaced.
  return new Response("", {
    status: 200,
    headers: {
      "Cache-Control": `public, max-age=${STALE_CSS_BROWSER_SECONDS}, s-maxage=${STALE_CSS_EDGE_SECONDS}, stale-while-revalidate=${STALE_CSS_EDGE_SECONDS}`,
      "Content-Type": "text/css; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-PriceAI-Static-Fallback": "stale-deployment-css",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const config = {
  matcher: "/_next/static/css/:path*",
};
