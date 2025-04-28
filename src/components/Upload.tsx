
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Upload as UploadIcon, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface UploadProps {
  onUploadComplete?: () => void;
}

const Upload = ({ onUploadComplete }: UploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${import.meta.env.VITE_DJANGO_API_URL || 'http://127.0.0.1:8002'}/upload/`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `Document has been processed successfully with ID: ${data.document_id}`,
      });
      setFiles([]);
      setUploadProgress(0);
      if (onUploadComplete) {
        onUploadComplete();
      }
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  // Simulated upload progress
  const startProgressSimulation = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 300);

    return interval;
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    const progressInterval = startProgressSimulation();
    
    try {
      await uploadMutation.mutateAsync(files[0]);
      setUploadProgress(100);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter for PDF files only
    const pdfFiles = acceptedFiles.filter(
      (file) => file.type === "application/pdf"
    );

    if (pdfFiles.length !== acceptedFiles.length) {
      toast({
        title: "Invalid File Type",
        description: "Only PDF files are accepted",
        variant: "destructive",
      });
    }

    setFiles(pdfFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload PDF Document</CardTitle>
          <CardDescription>
            Upload a PDF document to process it into text chunks for semantic search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/10"
                : "border-gray-300 hover:border-primary"
            }`}
          >
            <input {...getInputProps()} />
            <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-1">
              {isDragActive ? "Drop the files here" : "Drag & drop files here"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to select files
            </p>
            <p className="text-xs text-muted-foreground">
              Only PDF files are accepted
            </p>
          </div>

          {uploadMutation.isPending && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading and processing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </CardContent>
        
        {files.length > 0 && (
          <CardFooter className="flex flex-col items-start">
            <h3 className="font-medium mb-2">Selected Files:</h3>
            <div className="w-full">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 bg-secondary rounded-md mb-2"
                >
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleUpload}
                  disabled={files.length === 0 || uploadMutation.isPending}
                >
                  Process Document
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>

      <Alert>
        <AlertTitle>Processing Steps</AlertTitle>
        <AlertDescription className="space-y-2 mt-2">
          <ol className="list-decimal list-inside space-y-1">
            <li>PDF is converted to Markdown format</li>
            <li>Markdown is chunked into smaller sections</li>
            <li>Embeddings are generated using Ollama</li>
            <li>Chunks and embeddings are stored in PostgreSQL</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default Upload;
