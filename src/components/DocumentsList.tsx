
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Search, Trash, ArrowUp, ArrowDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Document {
  id: number;
  name: string;
  created_at: string;
  chunks: number;
  tokens: number;
}

type SortField = "name" | "created_at" | "chunks" | "tokens";
type SortDirection = "asc" | "desc";

const DocumentsList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: documents, isLoading, isError } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_DJANGO_API_URL || 'http://127.0.0.1:8002'}/list-documents/`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      return response.json() as Promise<Document[]>;
    },
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
            comparison = a.name.localeCompare(b.name);
            break;
          case "created_at":
            comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            break;
          case "chunks":
            comparison = a.chunks - b.chunks;
            break;
          case "tokens":
            comparison = a.tokens - b.tokens;
            break;
        }
        
        return sortDirection === "asc" ? comparison : -comparison;
      })
    : [];

  const filteredDocuments = sortedDocuments.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="text-center py-10">
        <p className="text-lg text-red-500">Failed to load documents</p>
        <p className="text-muted-foreground">Please try again later</p>
      </div>
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
                          Name
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
                          onClick={() => handleSort("chunks")}
                        >
                          Chunks
                          {sortField === "chunks" && (
                            sortDirection === "asc" ? 
                              <ArrowUp className="ml-1 h-4 w-4" /> : 
                              <ArrowDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div 
                          className="flex items-center justify-center cursor-pointer"
                          onClick={() => handleSort("tokens")}
                        >
                          Tokens
                          {sortField === "tokens" && (
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
                            <span>{document.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(document.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center">{document.chunks}</TableCell>
                        <TableCell className="text-center">{document.tokens}</TableCell>
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

              {/* Pagination */}
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
                  <p>{selectedDocument.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Created At</h3>
                  <p>{new Date(selectedDocument.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Number of Chunks</h3>
                  <p>{selectedDocument.chunks}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Total Tokens</h3>
                  <p>{selectedDocument.tokens}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Processing Information</h3>
                <div className="bg-secondary p-4 rounded-md text-sm">
                  <div className="mb-2">
                    <span className="font-medium">Processing Pipeline:</span>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>PDF converted to Markdown</li>
                      <li>Text chunked into {selectedDocument.chunks} sections</li>
                      <li>{selectedDocument.tokens} tokens processed</li>
                      <li>Embeddings generated and stored</li>
                    </ul>
                  </div>
                </div>
              </div>

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
