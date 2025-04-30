import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Search, ArrowUp, ArrowDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Types
interface Chunk {
  id: number;
  chunk_text: string;
  chunk_index: number;
}

interface Document {
  id: number;
  markdown: string;
  created_at: string;
  updated_at: string;
  chunks: Chunk[];
  token_count: number;
}

type SortField = "name" | "created_at" | "chunk_count" | "token_count";
type SortDirection = "asc" | "desc";

// Função para derivar um nome a partir do markdown
const deriveDocumentName = (markdown: string): string => {
  const maxLength = 50;
  const cleanText = markdown.replace(/(\r\n|\n|\r)/gm, " ").trim();
  return cleanText.length > maxLength
    ? `${cleanText.substring(0, maxLength)}...`
    : cleanText || "Untitled Document";
};

const DocumentsList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: documents, isLoading, isError, error } = useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: async () => {
      try {
        const baseUrl = import.meta.env.VITE_DJANGO_API_URL || "http://127.0.0.1:8000";
        const url = `${baseUrl}/list-documents/`;
        console.log("Fetching documents from:", url);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        });
        clearTimeout(timeoutId);

        console.log("API Response Status:", response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error Response:", errorText);
          throw new Error(`Failed to fetch documents: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log("API Response Data:", data);

        if (Array.isArray(data)) {
          return data;
        } else if (data && Array.isArray(data.documents)) {
          return data.documents;
        } else {
          console.warn("Unexpected API response format:", data);
          return [];
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
        if (error.name === "AbortError") {
          console.log("Request timed out, retrying once...");
          try {
            const baseUrl = import.meta.env.VITE_DJANGO_API_URL || "http://127.0.0.1:8000";
            const response = await fetch(`${baseUrl}/list-documents/`);
            console.log("Retry API Response Status:", response.status);
            if (!response.ok) {
              throw new Error("Failed to fetch documents on retry");
            }
            const data = await response.json();
            console.log("Retry API Response Data:", data);
            if (Array.isArray(data)) {
              return data;
            } else if (data && Array.isArray(data.documents)) {
              return data.documents;
            } else {
              console.warn("Unexpected API response format on retry:", data);
              return [];
            }
          } catch (retryError) {
            console.error("Retry failed:", retryError);
            throw retryError;
          }
        }
        throw error;
      }
    },
  });

  const { data: chunks, isLoading: isLoadingChunks } = useQuery<Chunk[]>({
    queryKey: ["documentChunks", selectedDocument?.id],
    queryFn: async () => {
      if (!selectedDocument) return [];
      const baseUrl = import.meta.env.VITE_DJANGO_API_URL || "http://127.0.0.1:8000";
      const url = `${baseUrl}/documents/${selectedDocument.id}/chunks/`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch chunks");
      return response.json();
    },
    enabled: !!selectedDocument,
  });

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedDocuments = documents
    ? [...documents].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case "name":
            comparison = deriveDocumentName(a.markdown).localeCompare(deriveDocumentName(b.markdown));
            break;
          case "created_at":
            comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            break;
          case "chunk_count":
            comparison = a.chunks.length - b.chunks.length;
            break;
          case "token_count":
            comparison = a.token_count - b.token_count;
            break;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      })
    : [];

  const filteredDocuments = sortedDocuments.filter((doc) =>
    deriveDocumentName(doc.markdown).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedDocuments = filteredDocuments.slice(start, end);

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">Loading documents...</p>
          <Progress value={80} className="w-64" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTitle>Failed to Load Documents</AlertTitle>
            <AlertDescription>
              {error?.message || "An error occurred while fetching documents."}
              <br />
              Please check your network connection or server status and try again later.
              <br />
              <span className="text-xs">Error details can be found in the browser console.</span>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
          <CardDescription>
            Browse and manage your processed documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {filteredDocuments.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">ID</TableHead>
                      <TableHead>
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() => handleSort("name")}
                        >
                          Document
                          {sortField === "name" && (
                            sortDirection === "asc" ? 
                              <ArrowUp className="ml-1 h-4 w-4" /> : 
                              <ArrowDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() => handleSort("created_at")}
                        >
                          Created At
                          {sortField === "created_at" && (
                            sortDirection === "asc" ? 
                              <ArrowUp className="ml-1 h-4 w-4" /> : 
                              <ArrowDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div
                          className="flex items-center justify-center cursor-pointer"
                          onClick={() => handleSort("chunk_count")}
                        >
                          Chunks
                          {sortField === "chunk_count" && (
                            sortDirection === "asc" ? 
                              <ArrowUp className="ml-1 h-4 w-4" /> : 
                              <ArrowDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div
                          className="flex items-center justify-center cursor-pointer"
                          onClick={() => handleSort("token_count")}
                        >
                          Tokens
                          {sortField === "token_count" && (
                            sortDirection === "asc" ? 
                              <ArrowUp className="ml-1 h-4 w-4" /> : 
                              <ArrowDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDocuments.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell className="font-medium">{document.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-blue-500" />
                            <span>{deriveDocumentName(document.markdown)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(document.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center">{document.chunks.length}</TableCell>
                        <TableCell className="text-center">{document.token_count}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(document)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No documents found</p>
              <p className="text-muted-foreground">
                {searchTerm ? "Try a different search term" : "Upload documents to get started"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedDocument} onOpenChange={(isOpen) => !isOpen && setSelectedDocument(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription>
              Viewing information for document #{selectedDocument?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Document Name</h3>
                  <p>{deriveDocumentName(selectedDocument.markdown)}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Created At</h3>
                  <p>{new Date(selectedDocument.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Number of Chunks</h3>
                  <p>{selectedDocument.chunks.length}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Total Tokens</h3>
                  <p>{selectedDocument.token_count}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Content Preview</h3>
                <p className="text-sm text-muted-foreground">{selectedDocument.markdown.substring(0, 200)}...</p>
              </div>

              {isLoadingChunks ? (
                <p>Loading chunks...</p>
              ) : (
                <div>
                  <h3 className="font-semibold mb-2">Chunk Previews</h3>
                  <div className="bg-secondary p-4 rounded-md text-sm max-h-64 overflow-y-auto">
                    {chunks?.map((chunk) => (
                      <div key={chunk.id} className="mb-2">
                        <span className="font-medium">Chunk {chunk.chunk_index} (ID: {chunk.id}):</span>
                        <p className="mt-1 text-muted-foreground">
                          {chunk.chunk_text.substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedDocument(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentsList;