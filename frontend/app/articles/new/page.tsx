import { redirect } from "next/navigation";
import type { Route } from "next";

export default function NewArticlePage() {
  redirect("/submit" as Route);
}
