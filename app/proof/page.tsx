import { redirect } from "next/navigation";

// "How it works" was folded into /coverage (Coverage & proof). Keep the old
// route alive by redirecting so external links don't break.
export default function Proof() {
  redirect("/coverage");
}
