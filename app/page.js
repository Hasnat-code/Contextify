"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Auth from "@/components/Auth";
import Dashboard from "@/components/dashboard/Dashboard";

export default function Home() {
  const [user, setUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setCheckingUser(false);
    }

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setCheckingUser(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (checkingUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <Dashboard user={user} />;
}