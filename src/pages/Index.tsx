
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import Dashboard from "@/components/Dashboard";
import DocumentsList from "@/components/DocumentsList";
import SearchInterface from "@/components/SearchInterface";
import Upload from "@/components/Upload";
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Function to test API connectivity
  const { data: apiStatus, isError } = useQuery({
    queryKey: ["apiStatus"],
    queryFn: async () => {
      try {
        // Just a simple check to see if the API is reachable
        const baseUrl = import.meta.env.VITE_DJANGO_API_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${baseUrl}/list-documents/`, {
          method: "GET",
        });
        
        if (!response.ok) {
          throw new Error("API connectivity issue");
        }
        
        return { connected: true };
      } catch (error) {
        console.error("API connection error:", error);
        return { connected: false, error };
      }
    },
    retry: 1,
  });

  useEffect(() => {
    if (isError || (apiStatus && !apiStatus.connected)) {
      toast({
        title: "API Connection Issue",
        description: "Could not connect to the backend API. Please ensure the Django server is running.",
        variant: "destructive",
      });
    }
  }, [apiStatus, isError]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Document Processing Dashboard
        </h1>
        <p className="text-lg text-muted-foreground">
          Upload PDFs, process them, and perform semantic search using RAG
        </p>
      </div>

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Dashboard />
        </TabsContent>

        <TabsContent value="upload">
          <Upload onUploadComplete={() => setActiveTab("documents")} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsList />
        </TabsContent>

        <TabsContent value="search">
          <SearchInterface />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
