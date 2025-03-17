'use client'

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function Home() {

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/");
    },
  });

  return (
    <div></div>
  );
}
