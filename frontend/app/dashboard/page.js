"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: "", text: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const getUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (!data.user) {
        router.push("/login");
      } else {
        setUser(data.user);
        await fetchUploadedFiles(data.user.id);
      }

      setLoading(false);
    };

    getUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Get file icon based on extension
  const getFileIcon = (fileName) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const icons = {
      pdf: "📕",
      doc: "📝",
      docx: "📝",
      txt: "📄",
      xls: "📊",
      xlsx: "📊",
      ppt: "📽️",
      pptx: "📽️",
      jpg: "🖼️",
      jpeg: "🖼️",
      png: "🖼️",
      gif: "🖼️",
      zip: "📦",
      rar: "📦",
    };
    return icons[ext] || "📄";
  };

  // Filter files based on search query
  const filteredFiles = uploadedFiles.filter((file) =>
    file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);
  const startIndex = (currentPage - 1) * filesPerPage;
  const paginatedFiles = filteredFiles.slice(startIndex, startIndex + filesPerPage);

  // Reset to page 1 when search changes
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const fetchUploadedFiles = async (userId) => {
    setLoadingFiles(true);
    try {
      console.log("📂 Fetching uploaded files for user:", userId);
      
      const { data, error } = await supabase
        .from("uploaded_files")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching files:", error);
        setUploadMessage({ type: "error", text: `Failed to fetch files: ${error.message}` });
      } else {
        console.log("✅ Fetched files:", data?.length || 0);
        setUploadedFiles(data || []);
      }
    } catch (err) {
      console.error("❌ Fetch exception:", err);
      setUploadMessage({ type: "error", text: "Exception while fetching files" });
    } finally {
      setLoadingFiles(false);
    }
  };

  // ============================================
  // FIXED: Proper Supabase Upload Implementation
  // ============================================
  const uploadFile = async () => {
    if (!file || !user) {
      console.warn("⚠️ Missing file or user");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadMessage({ type: "", text: "" });

    try {
      console.log("🚀 Starting upload...");
      console.log("📄 File name:", file.name);
      console.log("📦 File size:", file.size, "bytes");
      console.log("👤 User ID:", user.id);

      // Step 1: Generate unique filename with timestamp
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      console.log("🔤 Generated storage path:", fileName);

      // Step 2: Simulate progress (10% - starting)
      setUploadProgress(10);

      // Step 3: Upload file to Supabase Storage
      // NOTE: Supabase JS client does NOT support onUploadProgress
      // We'll simulate progress with setTimeout steps
      console.log("⏳ Uploading to storage bucket...");
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false, // Don't overwrite existing files
        });

      if (uploadError) {
        console.error("❌ Upload error:", uploadError);
        console.error("Error code:", uploadError.error);
        console.error("Error message:", uploadError.message);
        
        setUploadMessage({
          type: "error",
          text: `Upload failed: ${uploadError.message || "Unknown error"}`,
        });
        setUploading(false);
        return;
      }

      console.log("✅ File uploaded to storage:", uploadData);
      setUploadProgress(70);

      // Step 4: Insert file metadata into database
      console.log("📝 Inserting metadata into database...");

      const { data: dbData, error: dbError } = await supabase
        .from("uploaded_files")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          created_at: new Date().toISOString(),
        })
        .select();

      if (dbError) {
        console.error("❌ Database insert error:", dbError);
        console.error("Error code:", dbError.code);
        console.error("Error message:", dbError.message);

        // Try to rollback storage upload on DB failure
        console.log("🔄 Attempting to rollback storage upload...");
        await supabase.storage.from("documents").remove([fileName]);

        setUploadMessage({
          type: "error",
          text: `Database save failed: ${dbError.message || "Unknown error"}`,
        });
        setUploading(false);
        return;
      }

      console.log("✅ Database record created:", dbData);
      setUploadProgress(100);
      // Step 5: Trigger document processing API
// Step 5: Trigger document processing API
console.log("🧠 Starting document processing...");

// Create multipart form data
const formData = new FormData();
formData.append("file", file);

const processResponse = await fetch("/api/process-document", {
  method: "POST",
  body: formData,
});

const processData = await processResponse.json();

if (!processResponse.ok) {
  console.error("❌ Processing error:", processData);

  setUploadMessage({
    type: "error",
    text: `Document uploaded but processing failed: ${
      processData.error || "Unknown error"
    }`,
  });

  setUploading(false);
  return;
}

console.log("✅ Document processed successfully:", processData);

setUploadProgress(100);

// Success message
setUploadMessage({
  type: "success",
  text: `✓ File uploaded and processed successfully! Chunks created: ${
    processData.chunksProcessed || 0
  }`,
});

// Reset form
setFile(null);
setUploadProgress(0);

// Refresh uploaded files
await fetchUploadedFiles(user.id);

console.log("✅ Upload complete!");
      // Step 5: Success! Reset and refresh
      

      console.log("✅ Upload complete!");
    } catch (err) {
      console.error("❌ Unexpected error during upload:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });

      setUploadMessage({
        type: "error",
        text: `Unexpected error: ${err.message || "Please try again"}`,
      });
    } finally {
      setUploading(false);
      // Auto-clear message after 4 seconds
      setTimeout(() => setUploadMessage({ type: "", text: "" }), 4000);
    }
  };

  // ============================================
  // FIXED: Proper Download with Fresh Signed URL
  // ============================================
  const getDownloadUrl = async (filePath) => {
    try {
      console.log("🔗 Generating signed URL for:", filePath);

      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error("❌ Signed URL error:", error);
        console.error("Error message:", error.message);
        setUploadMessage({
          type: "error",
          text: `Failed to generate download link: ${error.message}`,
        });
        return null;
      }

      console.log("✅ Signed URL generated successfully");
      return data.signedUrl;
    } catch (err) {
      console.error("❌ Signed URL exception:", err);
      return null;
    }
  };

  const handleDownload = async (filePath, fileName) => {
    console.log("📥 Download requested for:", fileName);
    const url = await getDownloadUrl(filePath);
    if (url) {
      console.log("✅ Opening download URL in new tab");
      window.open(url, "_blank");
    }
  };

  // ============================================
  // FIXED: Proper Delete with Rollback
  // ============================================
  const deleteFile = async (fileId, filePath) => {
    try {
      console.log("🗑️ Delete requested for file ID:", fileId);
      console.log("📄 File path:", filePath);

      // Step 1: Delete from storage first
      console.log("🔄 Deleting from storage...");
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([filePath]);

      if (storageError) {
        console.error("❌ Storage delete error:", storageError);
        setUploadMessage({
          type: "error",
          text: `Failed to delete from storage: ${storageError.message}`,
        });
        return;
      }

      console.log("✅ Deleted from storage");

      // Step 2: Delete from database
      console.log("🔄 Deleting database record...");
      const { error: dbError } = await supabase
        .from("uploaded_files")
        .delete()
        .eq("id", fileId)
        .eq("user_id", user.id); // Safety: only delete own files

      if (dbError) {
        console.error("❌ Database delete error:", dbError);
        setUploadMessage({
          type: "error",
          text: `Failed to delete from database: ${dbError.message}`,
        });
        return;
      }

      console.log("✅ Deleted from database");

      // Step 3: Success and refresh
      setUploadMessage({
        type: "success",
        text: "✓ File deleted successfully!",
      });

      await fetchUploadedFiles(user.id);
      console.log("✅ Delete complete!");
    } catch (err) {
      console.error("❌ Unexpected error during delete:", err);
      setUploadMessage({
        type: "error",
        text: `Unexpected error: ${err.message}`,
      });
    }

    setTimeout(() => setUploadMessage({ type: "", text: "" }), 4000);
  };

  return (
    <div className="dashboard-container">
      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Sora:wght@300;400;500;600;700&display=swap");

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5e6f8 0%, #e8d4f5 25%, #d9c5f0 50%, #c8b5eb 75%, #b8a5e6 100%);
          padding: 40px 20px;
          font-family: "Sora", sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .dashboard-container::before {
          content: "";
          position: fixed;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle at 30% 30%, rgba(200, 150, 255, 0.15), transparent 70%);
          border-radius: 50%;
          top: -100px;
          left: -100px;
          pointer-events: none;
          z-index: 0;
        }

        .dashboard-container::after {
          content: "";
          position: fixed;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle at 70% 70%, rgba(180, 120, 255, 0.1), transparent 70%);
          border-radius: 50%;
          bottom: -150px;
          right: -150px;
          pointer-events: none;
          z-index: 0;
        }

        .dashboard-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          animation: slideDown 0.8s ease;
        }

        .header-left h1 {
          font-size: 48px;
          font-weight: 800;
          background: linear-gradient(135deg, #6b4ba0 0%, #9b5fc9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
          font-family: "Poppins", sans-serif;
          letter-spacing: -1px;
        }

        .header-subtitle {
          color: #888;
          font-size: 16px;
          font-weight: 400;
        }

        .logout-btn {
          background: linear-gradient(135deg, #e74c3c 0%, #e67e73 100%);
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: "Poppins", sans-serif;
          position: relative;
          overflow: hidden;
          letter-spacing: 0.3px;
          box-shadow: 0 8px 20px rgba(231, 76, 60, 0.2);
        }

        .logout-btn::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .logout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(231, 76, 60, 0.4);
        }

        .logout-btn:hover::before {
          left: 100%;
        }

        .logout-btn:active {
          transform: translateY(0);
        }

        /* Main Content Grid */
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 40px;
        }

        /* Welcome Card */
        .welcome-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 28px;
          padding: 50px;
          box-shadow: 0 20px 60px rgba(120, 80, 200, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.4);
          animation: slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards;
          opacity: 0;
          position: relative;
          overflow: hidden;
        }

        .welcome-card::before {
          content: "";
          position: absolute;
          top: -50%;
          right: -50%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle at center, rgba(155, 95, 201, 0.08), transparent 70%);
          border-radius: 50%;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .welcome-card h2 {
          font-size: 28px;
          font-weight: 700;
          color: #6b4ba0;
          margin-bottom: 16px;
          font-family: "Poppins", sans-serif;
          position: relative;
          z-index: 1;
        }

        .user-email {
          font-size: 16px;
          color: #666;
          margin-bottom: 24px;
          padding: 12px 16px;
          background: rgba(184, 165, 230, 0.1);
          border-radius: 10px;
          border-left: 3px solid #9b5fc9;
          position: relative;
          z-index: 1;
          word-break: break-all;
        }

        .user-email strong {
          color: #9b5fc9;
          font-weight: 600;
        }

        .welcome-message {
          font-size: 15px;
          color: #888;
          line-height: 1.6;
          position: relative;
          z-index: 1;
        }

        /* Stats Card */
        .stats-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 28px;
          padding: 50px;
          box-shadow: 0 20px 60px rgba(120, 80, 200, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.4);
          animation: slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards;
          opacity: 0;
          position: relative;
          overflow: hidden;
        }

        .stats-card::before {
          content: "";
          position: absolute;
          bottom: -50%;
          left: -50%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle at center, rgba(184, 165, 230, 0.08), transparent 70%);
          border-radius: 50%;
        }

        .stats-card h2 {
          font-size: 28px;
          font-weight: 700;
          color: #6b4ba0;
          margin-bottom: 24px;
          font-family: "Poppins", sans-serif;
          position: relative;
          z-index: 1;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid rgba(184, 165, 230, 0.2);
          position: relative;
          z-index: 1;
        }

        .stat-item:last-child {
          border-bottom: none;
        }

        .stat-label {
          font-size: 15px;
          color: #666;
          font-weight: 500;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #6b4ba0 0%, #9b5fc9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-family: "Poppins", sans-serif;
        }

        /* Features Section */
        .features-section {
          animation: slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s forwards;
          opacity: 0;
        }

        .section-title {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #6b4ba0 0%, #9b5fc9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 24px;
          font-family: "Poppins", sans-serif;
          letter-spacing: -0.5px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 20px 60px rgba(120, 80, 200, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.4);
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: "";
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle at center, rgba(155, 95, 201, 0.1), transparent 70%);
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 30px 80px rgba(120, 80, 200, 0.25);
        }

        .feature-card:hover::before {
          top: -30%;
          right: -30%;
        }

        .feature-icon {
          font-size: 40px;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }

        .feature-card h3 {
          font-size: 18px;
          font-weight: 700;
          color: #6b4ba0;
          margin-bottom: 10px;
          font-family: "Poppins", sans-serif;
          position: relative;
          z-index: 1;
        }

        .feature-card p {
          font-size: 14px;
          color: #888;
          line-height: 1.5;
          position: relative;
          z-index: 1;
        }

        /* Upload Section */
        .upload-section {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 28px;
          padding: 50px;
          box-shadow: 0 20px 60px rgba(120, 80, 200, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.4);
          animation: slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s forwards;
          opacity: 0;
          position: relative;
          overflow: hidden;
          margin-top: 40px;
        }

        .upload-section::before {
          content: "";
          position: absolute;
          bottom: -50%;
          left: -50%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle at center, rgba(155, 95, 201, 0.08), transparent 70%);
          border-radius: 50%;
        }

        .upload-section h2 {
          font-size: 28px;
          font-weight: 700;
          color: #6b4ba0;
          margin-bottom: 24px;
          font-family: "Poppins", sans-serif;
          position: relative;
          z-index: 1;
        }

        .upload-form {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .file-input-wrapper {
          position: relative;
        }

        .file-input-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #6b4ba0;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .file-input {
          width: 100%;
          padding: 14px 16px;
          border: 2px dashed #b8a5e6;
          border-radius: 14px;
          font-size: 15px;
          font-family: "Sora", sans-serif;
          background: linear-gradient(135deg, rgba(250, 251, 252, 0.5) 0%, rgba(245, 248, 250, 0.5) 100%);
          transition: all 0.3s ease;
          cursor: pointer;
          color: #666;
        }

        .file-input:hover {
          border-color: #9b5fc9;
          background: linear-gradient(135deg, rgba(250, 251, 252, 0.8) 0%, rgba(245, 248, 250, 0.8) 100%);
        }

        .file-input:focus {
          outline: none;
          border-color: #9b5fc9;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(184, 165, 230, 0.1);
        }

        .file-name {
          font-size: 14px;
          color: #9b5fc9;
          font-weight: 600;
          margin-top: 10px;
          padding: 10px 12px;
          background: rgba(184, 165, 230, 0.1);
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .clear-file {
          background: none;
          border: none;
          color: #e74c3c;
          cursor: pointer;
          font-weight: 600;
          transition: color 0.3s ease;
          font-size: 12px;
        }

        .clear-file:hover {
          color: #c0392b;
        }

        .upload-btn {
          background: linear-gradient(135deg, #9b5fc9 0%, #b8a5e6 100%);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: "Poppins", sans-serif;
          position: relative;
          overflow: hidden;
          letter-spacing: 0.3px;
          width: 100%;
          max-width: 300px;
        }

        .upload-btn::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .upload-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(155, 95, 201, 0.4);
        }

        .upload-btn:hover:not(:disabled)::before {
          left: 100%;
        }

        .upload-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .upload-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .upload-info {
          font-size: 13px;
          color: #999;
          margin-top: 16px;
          position: relative;
          z-index: 1;
        }

        /* Upload Messages */
        .upload-message {
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 20px;
          animation: slideDown 0.5s ease;
          position: relative;
          z-index: 1;
        }

        .upload-message.success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }

        .upload-message.error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        /* Uploaded Files Section */
        .files-section {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 28px;
          padding: 50px;
          box-shadow: 0 20px 60px rgba(120, 80, 200, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.4);
          animation: slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards;
          opacity: 0;
          position: relative;
          overflow: hidden;
          margin-top: 40px;
        }

        .files-section::before {
          content: "";
          position: absolute;
          top: -50%;
          right: -50%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle at center, rgba(155, 95, 201, 0.08), transparent 70%);
          border-radius: 50%;
        }

        .files-section h2 {
          font-size: 28px;
          font-weight: 700;
          color: #6b4ba0;
          margin-bottom: 24px;
          font-family: "Poppins", sans-serif;
          position: relative;
          z-index: 1;
        }

        .files-list {
          position: relative;
          z-index: 1;
        }

        .files-empty {
          text-align: center;
          padding: 40px 20px;
          color: #999;
        }

        .files-empty p {
          font-size: 15px;
          margin-bottom: 8px;
        }

        .files-empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: rgba(184, 165, 230, 0.05);
          border: 1px solid rgba(184, 165, 230, 0.2);
          border-radius: 12px;
          margin-bottom: 12px;
          transition: all 0.3s ease;
          animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }

        .file-item:hover {
          background: rgba(184, 165, 230, 0.1);
          box-shadow: 0 4px 12px rgba(120, 80, 200, 0.1);
        }

        .file-item:nth-child(1) {
          animation-delay: 0s;
        }

        .file-item:nth-child(2) {
          animation-delay: 0.1s;
        }

        .file-item:nth-child(3) {
          animation-delay: 0.2s;
        }

        .file-item:nth-child(4) {
          animation-delay: 0.3s;
        }

        .file-item:nth-child(5) {
          animation-delay: 0.4s;
        }

        .file-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .file-icon {
          font-size: 24px;
        }

        .file-details {
          flex: 1;
        }

        .file-name-display {
          font-size: 15px;
          font-weight: 600;
          color: #6b4ba0;
          margin-bottom: 4px;
          word-break: break-word;
        }

        .file-meta {
          font-size: 12px;
          color: #999;
          display: flex;
          gap: 16px;
        }

        .file-actions {
          display: flex;
          gap: 10px;
        }

        .file-btn {
          padding: 8px 12px;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: "Poppins", sans-serif;
        }

        .file-btn-download {
          background: linear-gradient(135deg, #9b5fc9 0%, #b8a5e6 100%);
          color: white;
        }

        .file-btn-download:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(155, 95, 201, 0.3);
        }

        .file-btn-delete {
          background: #ffe5e5;
          color: #e74c3c;
        }

        .file-btn-delete:hover {
          background: #ffd4d4;
        }

        .loading-files {
          text-align: center;
          padding: 30px;
          color: #999;
          font-size: 14px;
        }

        /* Progress Bar */
        .progress-container {
          margin-bottom: 16px;
        }

        .progress-label {
          font-size: 13px;
          font-weight: 600;
          color: #6b4ba0;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(184, 165, 230, 0.2);
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(184, 165, 230, 0.3);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #9b5fc9 0%, #b8a5e6 100%);
          border-radius: 10px;
          transition: width 0.3s ease;
          box-shadow: 0 0 10px rgba(155, 95, 201, 0.4);
        }

        /* Search Bar */
        .search-container {
          margin-bottom: 24px;
          position: relative;
          z-index: 1;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px 12px 40px;
          border: 2px solid #e8d4f5;
          border-radius: 12px;
          font-size: 15px;
          font-family: "Sora", sans-serif;
          background: linear-gradient(135deg, #fafbfc 0%, #f5f8fa 100%);
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #b8a5e6;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(184, 165, 230, 0.1);
        }

        .search-input::placeholder {
          color: #aaa;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          pointer-events: none;
          color: #999;
        }

        /* Pagination */
        .pagination-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid rgba(184, 165, 230, 0.2);
          position: relative;
          z-index: 1;
        }

        .pagination-info {
          font-size: 13px;
          color: #999;
          margin-right: 16px;
        }

        .pagination-btn {
          width: 36px;
          height: 36px;
          border: 1px solid rgba(184, 165, 230, 0.3);
          background: rgba(184, 165, 230, 0.05);
          color: #6b4ba0;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          font-family: "Poppins", sans-serif;
        }

        .pagination-btn:hover:not(:disabled) {
          background: rgba(155, 95, 201, 0.1);
          border-color: #b8a5e6;
          transform: translateY(-2px);
        }

        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pagination-btn.active {
          background: linear-gradient(135deg, #9b5fc9 0%, #b8a5e6 100%);
          color: white;
          border-color: #9b5fc9;
        }

        .pagination-dots {
          color: #ccc;
          margin: 0 4px;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(155, 95, 201, 0.2);
          border-top: 4px solid #9b5fc9;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .loading-text {
          font-size: 16px;
          color: #666;
          font-weight: 500;
        }

        /* Responsive Design */
        @media (max-width: 968px) {
          .content-grid {
            grid-template-columns: 1fr;
          }

          .header {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }

          .header-left h1 {
            font-size: 36px;
          }

          .welcome-card,
          .stats-card {
            padding: 40px;
          }

          .features-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }
        }

        @media (max-width: 480px) {
          .dashboard-container {
            padding: 20px 16px;
          }

          .header {
            gap: 16px;
          }

          .header-left h1 {
            font-size: 28px;
          }

          .welcome-card,
          .stats-card {
            padding: 28px;
          }

          .welcome-card h2,
          .stats-card h2 {
            font-size: 22px;
          }

          .section-title {
            font-size: 24px;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .logout-btn {
            width: 100%;
          }
        }
      `}</style>

      {loading ? (
        <div className="dashboard-wrapper">
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Loading your dashboard...</p>
          </div>
        </div>
      ) : (
        <div className="dashboard-wrapper">
          {/* Header */}
          <div className="header">
            <div className="header-left">
              <h1>Dashboard</h1>
              <p className="header-subtitle">Welcome to your RAG SaaS platform</p>
            </div>
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>

          {/* Main Content Grid */}
          <div className="content-grid">
            {/* Welcome Card */}
            <div className="welcome-card">
              <h2>👋 Welcome Back</h2>
              {user && (
                <>
                  <div className="user-email">
                    Logged in as: <strong>{user.email}</strong>
                  </div>
                  <p className="welcome-message">
                    Great to see you! You're all set up and ready to start exploring the platform. Dive into your documents, leverage our advanced RAG capabilities, and unlock the power of intelligent search.
                  </p>
                </>
              )}
            </div>

            {/* Quick Stats Card */}
            <div className="stats-card">
              <h2>📊 Quick Stats</h2>
              <div className="stat-item">
                <span className="stat-label">Documents</span>
                <span className="stat-value">{uploadedFiles.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Queries Processed</span>
                <span className="stat-value">0</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Active Projects</span>
                <span className="stat-value">0</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">API Usage</span>
                <span className="stat-value">0%</span>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="features-section">
            <h2 className="section-title">✨ Getting Started</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">📄</div>
                <h3>Upload Documents</h3>
                <p>Start by uploading your documents to build your knowledge base for intelligent querying.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🔍</div>
                <h3>Smart Search</h3>
                <p>Use our advanced RAG-powered search to find exact information within your document collection.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3>Instant Answers</h3>
                <p>Get AI-generated answers based on your documents with full source attribution.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🔐</div>
                <h3>Enterprise Security</h3>
                <p>Your data is encrypted and secured with enterprise-grade security protocols.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📈</div>
                <h3>Analytics</h3>
                <p>Track usage, performance metrics, and optimize your RAG implementation.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🔗</div>
                <h3>API Integration</h3>
                <p>Seamlessly integrate our API into your existing applications and workflows.</p>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="upload-section">
            <h2>📤 Upload Documents</h2>

            {uploadMessage.text && (
              <div className={`upload-message ${uploadMessage.type}`}>
                {uploadMessage.text}
              </div>
            )}

            <div className="upload-form">
              <div className="file-input-wrapper">
                <label className="file-input-label" htmlFor="file-input">
                  Select a file
                </label>
                <input
                  id="file-input"
                  type="file"
                  className="file-input"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                  accept=".pdf,.txt,.doc,.docx"
                />
              </div>

              {file && (
                <div className="file-name">
                  <span>📎 {file.name}</span>
                  <button
                    className="clear-file"
                    onClick={() => setFile(null)}
                    disabled={uploading}
                  >
                    ✕ Clear
                  </button>
                </div>
              )}

              {uploading && uploadProgress > 0 && (
                <div className="progress-container">
                  <div className="progress-label">
                    <span>Uploading</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <button
                className="upload-btn"
                onClick={uploadFile}
                disabled={!file || uploading}
              >
                {uploading ? `⏳ Uploading (${uploadProgress}%)` : "📤 Upload Document"}
              </button>

              <p className="upload-info">
                💡 Supported formats: PDF, TXT, DOC, DOCX. Max file size: 50MB
              </p>
            </div>
          </div>

          {/* Uploaded Files List */}
          <div className="files-section">
            <h2>📚 Your Documents</h2>

            {loadingFiles ? (
              <div className="loading-files">Loading your documents...</div>
            ) : uploadedFiles.length === 0 ? (
              <div className="files-empty">
                <div className="files-empty-icon">📭</div>
                <p>No documents uploaded yet.</p>
                <p style={{ fontSize: "13px" }}>Upload your first document above to get started!</p>
              </div>
            ) : (
              <>
                {/* Search Bar */}
                <div className="search-container">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search files by name..."
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>

                {/* Files List */}
                {filteredFiles.length === 0 ? (
                  <div className="files-empty">
                    <div className="files-empty-icon">🔍</div>
                    <p>No files match your search.</p>
                    <p style={{ fontSize: "13px" }}>Try a different search term.</p>
                  </div>
                ) : (
                  <>
                    <div className="files-list">
                      {paginatedFiles.map((fileItem, index) => (
                        <div
                          key={fileItem.id}
                          className="file-item"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="file-info">
                            <div className="file-icon">{getFileIcon(fileItem.file_name)}</div>
                            <div className="file-details">
                              <div className="file-name-display" title={fileItem.file_name}>
                                {fileItem.file_name}
                              </div>
                              <div className="file-meta">
                                <span>📦 {(fileItem.file_size / 1024 / 1024).toFixed(2)} MB</span>
                                <span>📅 {new Date(fileItem.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="file-actions">
                            <button
                              className="file-btn file-btn-download"
                              onClick={() => handleDownload(fileItem.file_path, fileItem.file_name)}
                            >
                              ⬇️ Download
                            </button>
                            <button
                              className="file-btn file-btn-delete"
                              onClick={() => deleteFile(fileItem.id, fileItem.file_path)}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="pagination-container">
                        <span className="pagination-info">
                          Showing {startIndex + 1}-{Math.min(startIndex + filesPerPage, filteredFiles.length)} of{
                            filteredFiles.length
                          }
                        </span>

                        <button
                          className="pagination-btn"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        >
                          ⏮
                        </button>

                        <button
                          className="pagination-btn"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          ◀
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => {
                          const pageNum = i + 1;
                          const isVisible =
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);

                          if (!isVisible && i > 0 && i < totalPages - 1) {
                            return null;
                          }

                          if (
                            i > 0 &&
                            i < totalPages - 1 &&
                            ((i === 1 && currentPage > 3) ||
                              (i === totalPages - 2 && currentPage < totalPages - 2))
                          ) {
                            return (
                              <span key={`dots-${i}`} className="pagination-dots">
                                ...
                              </span>
                            );
                          }

                          return (
                            <button
                              key={pageNum}
                              className={`pagination-btn ${currentPage === pageNum ? "active" : ""}`}
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        <button
                          className="pagination-btn"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          ▶
                        </button>

                        <button
                          className="pagination-btn"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          ⏭
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}