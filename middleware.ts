import type { NextRequest } from "next/server";
import { proxy } from "./src/proxy";

export async function middleware(request: NextRequest) {
  return proxy(request);
}

export const config = {
  // Exclude the whole `/_next/` tree and any dotted filename. Turbopack CSS
  // chunks are named `[root-of-the-server]__*.css`; the brackets break a
  // `_next/static`-only negative lookahead, so those requests used to fall
  // through to the auth bounce and the browser received HTML (or an empty
  // body) instead of CSS.
  matcher: ["/((?!_next/|favicon.ico|icon$|.*\\..*).*)"],
};
