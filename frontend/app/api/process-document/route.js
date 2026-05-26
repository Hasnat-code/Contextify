export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import mammoth from "mammoth";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    console.log("🚀 API HIT");

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      console.log("❌ No file received");

      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    console.log("📄 File received:", file.name);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let extractedText = "";

    // =========================
    // PDF TEXT EXTRACTION
    // =========================
    if (file.type === "application/pdf") {

      console.log("📕 Processing PDF");

      const pdfParse = (await import("pdf-parse")).default;

      const pdfData = await pdfParse(buffer);

      extractedText = pdfData.text;

    }

    // =========================
    // DOCX TEXT EXTRACTION
    // =========================
    else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {

      console.log("📝 Processing DOCX");

      const result = await mammoth.extractRawText({ buffer });

      extractedText = result.value;

    }

    // =========================
    // TXT TEXT EXTRACTION
    // =========================
    else if (file.type === "text/plain") {

      console.log("📄 Processing TXT");

      extractedText = buffer.toString("utf-8");

    }

    // =========================
    // UNSUPPORTED FILE
    // =========================
    else {

      console.log("❌ Unsupported file type:", file.type);

      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    // =========================
    // CHECK EXTRACTED TEXT
    // =========================
    console.log("✅ TEXT EXTRACTED");
    console.log("📏 Text length:", extractedText.length);

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "No text could be extracted from file" },
        { status: 400 }
      );
    }

    // =========================
    // SAVE FILE RECORD
    // =========================
    console.log("💾 Saving file record...");

    const { data: fileRecord, error: fileError } = await supabase
      .from("uploaded_files")
      .insert({
        file_name: file.name,
        file_path: file.name,
        file_size: file.size,
      })
      .select()
      .single();

    if (fileError) {
      console.error("❌ FILE INSERT ERROR:", fileError);
      throw fileError;
    }

    console.log("✅ File record saved:", fileRecord.id);

    // =========================
    // LANGCHAIN CHUNKING
    // =========================
    console.log("✂️ Creating chunks...");

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunkDocs = await splitter.createDocuments([extractedText]);

    const chunks = chunkDocs.map((doc) => doc.pageContent);

    console.log(`✅ TOTAL CHUNKS: ${chunks.length}`);

    // =========================
    // INSERT CHUNKS
    // =========================
    for (let i = 0; i < chunks.length; i++) {

      console.log(`📥 Inserting chunk ${i + 1}/${chunks.length}`);

      const { error: insertError } = await supabase
        .from("document_chunks")
        .insert({
          document_id: fileRecord.id,
          content: chunks[i],
        });

      if (insertError) {
        console.error("❌ CHUNK INSERT ERROR:", insertError);
        throw insertError;
      }
    }

    console.log("🎉 ALL CHUNKS INSERTED");

    return NextResponse.json({
      success: true,
      fileName: file.name,
      chunksProcessed: chunks.length,
    });

  } catch (error) {

    console.error("🔥 API ROUTE ERROR:");
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}