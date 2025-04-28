import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, Search, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SearchResult {
  document_id: number;
  document_name: string;
  chunk_id: number;
  content: string;
  similarity: number;
}

const SearchInterface = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [synthesizedResponse, setSynthesizedResponse] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      setIsSearching(true);
      // Simulate a search request to the API
      try {
        const baseUrl = import.meta.env.VITE_DJANGO_API_URL || 'http://127.0.0.1:8002';
        const response = await fetch(`${baseUrl}/search/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        });
        if (!response.ok) throw new Error(`Search failed with status ${response.status}`);
        const data = await response.json();
        console.log("Search API response:", data);
        return data;
      } catch (error) {
        console.error("Search error:", error);
        throw new Error("Failed to perform search");
      } finally {
        setIsSearching(false);
      }
    },
    onSuccess: (data) => {
      if (data && data.results && Array.isArray(data.results)) {
        setSearchResults(data.results);
      } else {
        console.warn("Unexpected API response format:", data);
        setSearchResults([]);
        toast({
          title: "Warning",
          description: "Received unexpected data format from server",
          variant: "destructive",
        });
      }
      if (data && data.synthesized_response) {
        setSynthesizedResponse(data.synthesized_response);
      } else {
        setSynthesizedResponse("");
      }
      if (!searchHistory.includes(searchTerm) && searchTerm.trim() !== "") {
        setSearchHistory((prev) => [searchTerm, ...prev.slice(0, 9)]);
      }
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    searchMutation.mutate(searchTerm);
  };

  const handleHistoryItemClick = (item: string) => {
    setSearchTerm(item);
    searchMutation.mutate(item);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Semantic Search</CardTitle>
          <CardDescription>
            Search through your documents using natural language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Enter your search query..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching || !searchTerm.trim()}>
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>

            {isSearching && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Searching documents...</span>
                  <span>Processing query</span>
                </div>
                <Progress value={65} className="w-full" />
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>How it works</AlertTitle>
              <AlertDescription>
                Your query is converted to an embedding vector using Ollama and compared against document chunks in the database using vector similarity search.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="results">
        <TabsList>
          <TabsTrigger value="results">Search Results</TabsTrigger>
          <TabsTrigger value="history">Search History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {searchResults.length > 0
                  ? `Found ${searchResults.length} results for "${searchTerm}"`
                  : "Enter a search query above to find relevant documents"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {synthesizedResponse && (
                <div className="mb-6 border rounded-lg p-4 bg-primary/5">
                  <h3 className="font-medium text-lg mb-2">AI Summary</h3>
                  <p className="text-sm">{synthesizedResponse}</p>
                </div>
              )}
              {searchResults.length > 0 ? (
                <div className="space-y-6">
                  {searchResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="font-medium">{result.document_name}</span>
                        </div>
                        <div className="text-sm px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          {Math.round(result.similarity * 100)}% match
                        </div>
                      </div>
                      <p className="text-sm border-l-2 border-primary/30 pl-4 py-1">
                        {result.content}
                      </p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Document ID: {result.document_id} | Chunk ID: {result.chunk_id}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">No results to display</p>
                  <p className="text-muted-foreground">
                    Try searching for something above
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Search History</CardTitle>
              <CardDescription>
                Your recent search queries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchHistory.length > 0 ? (
                <div className="space-y-2">
                  {searchHistory.map((query, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 hover:bg-secondary rounded-md cursor-pointer"
                      onClick={() => handleHistoryItemClick(query)}
                    >
                      <div className="flex items-center">
                        <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{query}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        Use
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No search history yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SearchInterface;
