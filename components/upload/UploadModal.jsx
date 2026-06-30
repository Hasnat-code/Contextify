"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, FileText, Loader2 } from "lucide-react";
import { uploadDocument } from "@/lib/upload";

export default function UploadModal({ user, open, onClose, onUploaded }) {
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles) => {
      try {
        setError("");
        setLoading(true);
        setStage("Uploading and processing document...");

        const file = acceptedFiles[0];

        const document = await uploadDocument(file, user);

        onUploaded(document);
        onClose();
      } catch (err) {
        setError(err.message || "Upload failed");
      } finally {
        setLoading(false);
        setStage("");
      }
    },
    [user, onUploaded, onClose]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "text/plain": [".txt"],
      "text/markdown": [".md"],
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Upload Document</h2>

          <button onClick={onClose} disabled={loading}>
            <X size={22} />
          </button>
        </div>

        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center ${
            isDragActive ? "border-black bg-gray-100" : "border-gray-300"
          }`}
        >
          <input {...getInputProps()} />

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            {loading ? (
              <Loader2 className="animate-spin" size={28} />
            ) : (
              <Upload size={28} />
            )}
          </div>

          <p className="font-medium">
            {loading
              ? stage
              : isDragActive
              ? "Drop your file here"
              : "Drag & drop your file here"}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            TXT or Markdown only for now.
          </p>

          <button
            disabled={loading}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm text-white disabled:bg-gray-400"
          >
            <FileText size={16} />
            Choose File
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}