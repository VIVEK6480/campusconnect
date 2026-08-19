import { NextRequest } from "next/server";

export function getAppUrl(req: NextRequest) {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost || req.headers.get("host");

  const forwardedProto = req.headers.get("x-forwarded-proto");

  let protocol =
    forwardedProto ||
    (process.env.NODE_ENV === "production"
      ? "https"
      : "http");

  protocol = protocol.split(",")[0].trim();

  if (protocol !== "http" && protocol !== "https") {
    protocol =
      process.env.NODE_ENV === "production"
        ? "https"
        : "http";
  }

  if (!host) {
    const configuredUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim();

    if (configuredUrl) {
      return configuredUrl.replace(/\/+$/, "");
    }

    return "http://localhost:3000";
  }

  return `${protocol}://${host}`.replace(/\/+$/, "");
}