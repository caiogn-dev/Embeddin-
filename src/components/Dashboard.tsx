
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, FileText, Search } from "lucide-react";

// Types
interface DashboardStats {
  totalDocuments: number;
  totalChunks: number;
  totalTokens: number;
  recentDocuments: Document[];
}

interface Document {
  id: number;
  name: string;
  created_at: string;
  chunks: number;
  tokens: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    totalChunks: 0,
    totalTokens: 0,
    recentDocuments: [],
  });

  const { data: documents, isLoading } = useQuery({
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

  useEffect(() => {
    if (documents) {
      const totalChunks = documents.reduce((acc, doc) => acc + doc.chunks, 0);
      const totalTokens = documents.reduce((acc, doc) => acc + doc.tokens, 0);
      
      setStats({
        totalDocuments: documents.length,
        totalChunks,
        totalTokens,
        recentDocuments: [...documents].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 5),
      });
    }
  }, [documents]);

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">Loading dashboard data...</p>
          <Progress value={80} className="w-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalDocuments}</div>
          <p className="text-xs text-muted-foreground">
            Processed documents in the system
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
          <Search className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalChunks}</div>
          <p className="text-xs text-muted-foreground">
            Searchable text chunks created
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalTokens}</div>
          <p className="text-xs text-muted-foreground">
            Tokens processed across all documents
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
          <CardDescription>
            Recently processed documents in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentDocuments.length > 0 ? (
            <div className="space-y-2">
              {stats.recentDocuments.map((doc) => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="font-medium">{doc.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No documents have been processed yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
