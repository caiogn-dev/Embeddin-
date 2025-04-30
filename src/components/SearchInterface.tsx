import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

// Function to format response text with enhanced Markdown support
const formatResponseText = (text: string): React.ReactNode => {
  let displayText = text;
  try {
    const fixedJson = text.replace(/'/g, '"');
    const parsed = JSON.parse(fixedJson);
    if (parsed && typeof parsed === 'object' && 'result' in parsed) {
      displayText = parsed.result;
    }
  } catch (e) {
    console.warn('Failed to parse fixed JSON:', e);
  }
  // Processar displayText para formatação Markdown
  const blocks = displayText.split('\n\n');
  const htmlBlocks = blocks.map(block => {
    const trimmed = block.trim();
    if (trimmed.startsWith('### ')) {
      return `<h3>${trimmed.substring(4)}</h3>`;
    } else if (trimmed.startsWith('#### ')) {
      return `<h4>${trimmed.substring(5)}</h4>`;
    } else if (/^\s*- /.test(trimmed)) {
      const lines = block.split('\n');
      const listItems = lines
        .map(line => {
          const match = line.match(/^\s*- (.+)$/);
          return match ? `<li>${match[1]}</li>` : line;
        })
        .filter(item => item.startsWith('<li>'));
      return `<ul>${listItems.join('')}</ul>`;
    } else {
      let paragraph = trimmed;
      paragraph = paragraph.replace(/`([^`]+)`/g, '<code>$1</code>');
      paragraph = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      paragraph = paragraph.replace(/\*(.*?)\*/g, '<em>$1</em>');
      paragraph = paragraph.replace(/\n\n/g, '<br /><br />');
      return `<p>${paragraph}</p>`;
    }
  });
  const htmlContent = htmlBlocks.join('');
  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        lineHeight: '1.6',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        color: '#333',
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
// Utility to parse JSON safely
const tryParseJson = (str: string): { result?: string; query?: string } | null => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
};

const SearchInterface = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [synthesizedResponse, setSynthesizedResponse] = useState<string | { result: string }>("");
  const [displayedText, setDisplayedText] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);

  // Apply typewriter effect when synthesizedResponse changes
  const responseText = typeof synthesizedResponse === 'string'
    ? synthesizedResponse
    : (synthesizedResponse && typeof synthesizedResponse === 'object' && 'result' in synthesizedResponse
      ? synthesizedResponse.result
      : JSON.stringify(synthesizedResponse));
  useEffect(() => {
    if (!responseText) {
      setDisplayedText("");
      return;
    }
    let index = 0;
    const interval = setInterval(() => {
      if (index < responseText.length) {
        setDisplayedText(responseText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [responseText]);

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      setIsSearching(true);
      try {
        const baseUrl = import.meta.env.VITE_DJANGO_API_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${baseUrl}/rag_search/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        });
        if (!response.ok) throw new Error(`Search failed with status ${response.status}`);
        const data = await response.json();
        console.log("RAG API response:", data);
        return data;
      } catch (error) {
        console.error("RAG search error:", error);
        throw new Error("Failed to perform RAG search");
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
        setDisplayedText(""); // Reset displayed text
      } else {
        setSynthesizedResponse("");
        setDisplayedText("");
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
      <style>
        {`
          .formatted-text h3 {
            color: #2c3e50;
            margin-top: 1.5rem;
            font-size: 1.25rem;
            font-weight: 600;
          }
          .formatted-text h4 {
            color: #34495e;
            margin-top: 1rem;
            font-size: 1rem;
            font-weight: 500;
          }
          .formatted-text ul {
            list-style-type: disc;
            margin: 0.5rem 0;
            padding-left: 1.5rem;
          }
          .formatted-text li {
            margin-bottom: 0.25rem;
          }
          .formatted-text p {
            margin: 0.5rem 0;
            line-height: 1.6;
          }
          .formatted-text strong {
            font-weight: 700;
          }
          .formatted-text em {
            font-style: italic;
          }
          .formatted-text {
            color: #333;
            font-size: 0.9rem;
          }
        `}
      </style>

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
                Your query is processed by an AI model to generate a summary based on relevant document chunks retrieved via semantic search.
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
                  <div className="space-y-2">
                    {/* User's Query - Right Aligned */}
                    <div className="flex justify-end">
                      <div className="max-w-xs bg-blue-100 p-2 rounded-lg text-sm">
                        <strong>You:</strong> {searchTerm || 'User Query'}
                      </div>
                    </div>
                    {/* AI Response - Left Aligned */}
                    <div className="flex justify-start">
                      <div className="max-w-prose bg-gray-100 p-2 rounded-lg text-sm whitespace-pre-wrap">
                        <strong>AI:</strong> {formatResponseText(displayedText)}
                      </div>
                    </div>
                  </div>
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