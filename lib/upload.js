import { supabase } from "@/lib/supabase";

async function extractTextFromPDF(file) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    disableWorker: true,
  }).promise;

  let fullText = "";

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    const pageText = content.items.map((item) => item.str).join(" ");

    fullText += `\n\nPage ${pageNumber}\n${pageText}`;
  }

  return fullText;
}

async function extractTextFromDOCX(file) {
  const mammoth = await import("mammoth");

  const arrayBuffer = await file.arrayBuffer();

  const result = await mammoth.extractRawText({
    arrayBuffer,
  });

  return result.value;
}

async function extractTextFromFile(file) {
  if (file.type === "text/plain" || file.type === "text/markdown") {
    return await file.text();
  }

  if (file.type === "application/pdf") {
    return await extractTextFromPDF(file);
  }

  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return await extractTextFromDOCX(file);
  }

  throw new Error("Unsupported file type.");
}

export async function uploadDocument(file, user) {
  if (!file) throw new Error("No file selected.");
  if (!user) throw new Error("User not logged in.");

  const allowedTypes = [
    "text/plain",
    "text/markdown",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only PDF, DOCX, TXT, and Markdown files are supported.");
  }

  const maxSize = 50 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error("File size must be less than 50MB.");
  }

  const extractedText = await extractTextFromFile(file);

  if (!extractedText || extractedText.trim().length < 20) {
    throw new Error("No readable text found in this file.");
  }

  const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const filePath = `${user.id}/${Date.now()}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: document, error: dbError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      title: file.name,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      status: "uploaded",
    })
    .select()
    .single();

  if (dbError) throw dbError;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Login session expired. Please login again.");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-document`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        documentId: document.id,
        text: extractedText,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    await supabase
      .from("documents")
      .update({
        status: "failed",
        error_message: result?.error || "Processing failed",
      })
      .eq("id", document.id);

    throw new Error(result?.error || "Processing failed");
  }

  return {
    ...document,
    status: "ready",
    chunks: result?.chunks ?? 0,
  };
}

export async function deleteDocument(document) {
  if (!document?.id) throw new Error("Document not found.");

  if (document.file_path) {
    await supabase.storage.from("documents").remove([document.file_path]);
  }

  await supabase.from("document_chunks").delete().eq("document_id", document.id);
  await supabase.from("documents").delete().eq("id", document.id);
}