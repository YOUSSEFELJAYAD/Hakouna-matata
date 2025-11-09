"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, File, X, Check } from "lucide-react";

export function FileUpload({ folder, onUploadComplete }: { folder?: string; onUploadComplete?: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<Array<{ name: string; progress: number; status: string }>>([]);

  const uploadMutation = trpc.file.getUploadUrl.useMutation();
  const completeMutation = trpc.file.completeUpload.useMutation();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);

    for (const file of acceptedFiles) {
      setFiles(prev => [...prev, { name: file.name, progress: 0, status: "uploading" }]);

      try {
        const { uploadUrl, fileId, key } = await uploadMutation.mutateAsync({
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          folder,
        });

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        await completeMutation.mutateAsync({
          fileId,
          url: uploadUrl.split("?")[0],
        });

        setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: "complete", progress: 100 } : f));
      } catch (error) {
        setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: "error" } : f));
      }
    }

    setUploading(false);
    onUploadComplete?.();
  }, [folder, uploadMutation, completeMutation, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`p-8 border-2 border-dashed cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-gray-300"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-lg">Drop files here...</p>
          ) : (
            <div>
              <p className="text-lg mb-2">Drag & drop files here, or click to select</p>
              <p className="text-sm text-gray-500">Supports images, documents, videos up to 100MB</p>
            </div>
          )}
        </div>
      </Card>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center gap-2 p-3 border rounded">
              <File className="h-4 w-4" />
              <span className="flex-1 text-sm truncate">{file.name}</span>
              {file.status === "complete" && <Check className="h-4 w-4 text-green-600" />}
              {file.status === "error" && <X className="h-4 w-4 text-red-600" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
