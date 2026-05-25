import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let extractedText = "";

    // Text Extraction
    if (file.type === "application/pdf") {
      extractedText = (await pdfParse(buffer)).text;
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      extractedText = (await mammoth.extractRawText({ buffer })).value;
    } else if (file.type === "text/plain") {
      extractedText = buffer.toString("utf-8");
    } else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    // 1. Insert file record
    const { data: fileRecord, error: fileError } = await supabase
      .from("uploaded_files")
      .insert({ file_name: file.name, file_path: "path", file_size: file.size })
      .select()
      .single();

    if (fileError) throw fileError;

    // 2. Chunk and Embed
    const chunks = extractedText.match(/.{1,1000}/g) || [];
    console.log(`DEBUG: Found ${chunks.length} chunks.`);

    for (const chunk of chunks) {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
      });

      console.log("DEBUG: Inserting chunk...");
      const { error: insertError } = await supabase.from("document_chunks").insert({
        document_id: fileRecord.id,
        content: chunk,
        embedding: embeddingResponse.data[0].embedding,
      });

      if (insertError) {
        console.error("CRITICAL SUPABASE ERROR:", insertError);
        throw insertError;
      }
    }

    return NextResponse.json({ success: true, fileName: file.name, chunksProcessed: chunks.length });

  } catch (error) {
    console.error("API ROUTE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}