import { redirect } from "next/navigation";
import type { Route } from "next";

export default function NewResourcePage() {
  redirect("/submit" as Route);
}

