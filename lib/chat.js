import { supabase } from "@/lib/supabase";

export async function askDocument({ documentId, message, sessionId }) {
  if (!documentId) throw new Error("Please select a document first.");
  if (!message.trim()) throw new Error("Message cannot be empty.");

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Login session expired. Please login again.");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        documentId,
        sessionId,
        message,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error || "Chat request failed");
  }

  return result;
}