"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { getStoredUser } from "@/lib/auth-storage";

export function ProfileEditLink({ username }: { username: string }) {
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    function sync() {
      setCanEdit(getStoredUser()?.username === username);
    }

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("ufaz-auth-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("ufaz-auth-changed", sync);
    };
  }, [username]);

  if (!canEdit) return null;

  return (
    <Link href="/profile/me" className="inline-flex items-center gap-2 border border-line px-3 py-2 font-sans text-sm font-bold text-accent transition-colors hover:border-accent hover:bg-clay">
      <Pencil className="h-4 w-4" />
      Edit
    </Link>
  );
}
