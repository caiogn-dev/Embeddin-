import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Upload as UploadIcon, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import * as pdfjsLib from 'pdfjs-dist';

interface UploadProps {
  onUploadComplete?: () => void;
}

interface ProgressState {
  current: number;
  total: number;
}

const Upload: React.FC<UploadProps> = ({ onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'extracting' | 'converting' | 'uploading' | 'error'>('idle');
  const [progress, setProgress] = useState<ProgressState>({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // Set up pdf.js worker
  useEffect(() => {
    import('pdfjs-dist/build/pdf.worker.min.mjs').then(worker => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = worker;
    });
  }, []);

  // Mutation to store processed data in the backend
  const storeMutation = useMutation({
    mutationFn: async (data: { markdown: string }) => {
      const baseUrl = 'http://127.0.0.1:8000/api/documents/upload/';
      const markdown = {
        markdown: data.markdown,
      };
      const response = await fetch(`${baseUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(markdown),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors || 'Failed to store data');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Processing Complete',
        description: `Document stored successfully with ID: ${data.document_id}`,
      });
      resetState();
      if (onUploadComplete) onUploadComplete();
    },
    onError: (error: Error) => {
      setError(error.message);
      setStatus('error');
      toast({
        title: 'Storage Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reset component state after processing
  const resetState = () => {
    setFile(null);
    setStatus('idle');
    setProgress({ current: 0, total: 0 });
    setError(null);
  };

  // Extract text from PDF using pdf.js
  const extractTextFromPDF = async (
    file: File,
    onProgress: (current: number, total: number) => void
  ): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    const totalPages = pdf.numPages;
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
      onProgress(i, totalPages);
    }
    return fullText;
  };

  // Convert text to Markdown
  const convertToMarkdown = (text: string): string => {
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    let markdown = '';
    
    paragraphs.forEach((paragraph, index) => {
      const trimmed = paragraph.trim();
      if (trimmed) {
        // Basic Markdown formatting: add paragraph breaks
        markdown += trimmed + '\n\n';
      }
    });

    return markdown.trim();
  };

  // Process the uploaded PDF
  const handleProcess = async () => {
    if (!file) return;
    setStatus('extracting');
    setProgress({ current: 0, total: 0 });

    try {
      // Step 1: Extract text
      const text = await extractTextFromPDF(file, (current, total) => {
        setProgress({ current, total });
      });

      // Step 2: Convert to Markdown
      setStatus('converting');
      const markdown = convertToMarkdown(text);
      setProgress({ current: 0, total: 0 });

      // Step 3: Store data
      setStatus('uploading');
      storeMutation.mutate({ markdown });
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      toast({
        title: 'Invalid File Type',
        description: 'Only PDF files are accepted',
        variant: 'destructive',
      });
      return;
    }
    setFile(pdfFiles[0]);
    setStatus('idle');
    setProgress({ current: 0, total: 0 });
    setError(null);
  }, []);

  // Remove selected file
  const removeFile = () => {
    setFile(null);
    setStatus('idle');
    setProgress({ current: 0, total: 0 });
    setError(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload PDF Document</CardTitle>
          <CardDescription>
            Upload a PDF document to convert to Markdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'
            }`}
          >
            <input {...getInputProps()} />
            <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-1">
              {isDragActive ? 'Drop the files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to select files
            </p>
            <p className="text-xs text-muted-foreground">
              Only PDF files are accepted
            </p>
          </div>
          {status !== 'idle' && status !== 'error' && (
            <div className="mt-6 space-y-2">
              <p className="capitalize">Processing: {status}</p>
              {progress.total > 0 && (
                <div>
                  <p>{progress.current} / {progress.total}</p>
                  <Progress value={(progress.current / progress.total) * 100} />
                </div>
              )}
            </div>
          )}
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        {file && status === 'idle' && (
          <CardFooter className="flex flex-col items-start">
            <h3 className="font-medium mb-2">Selected File:</h3>
            <div className="w-full">
              <div className="flex items-center justify-between py-2 px-3 bg-secondary rounded-md mb-2">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={removeFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={handleProcess} disabled={status !== 'idle'}>
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
            <li>Extract text from PDF using pdf.js</li>
            <li>Convert text to Markdown format</li>
            <li>Store Markdown in the backend</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default Upload;