import { sessionCookie } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  (await cookies()).delete(sessionCookie.name);
  return Response.redirect(new URL("/", req.url), 303);
}
