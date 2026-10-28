import Board from "./board";
import { getCurrentMember } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const member = await getCurrentMember().catch(() => null);
  return <Board signedIn={!!member} userName={member?.name} />;
}
