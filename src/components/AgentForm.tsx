import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const AgentForm = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_DJANGO_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${baseUrl}/agents/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, prompt }),
      });
      if (!response.ok) throw new Error("Failed to create agent");
      toast({ title: "Agent created" });
      setName("");
      setDescription("");
      setPrompt("");
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Agent</CardTitle>
        <CardDescription>Define a new agent prompt</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Textarea placeholder="Prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-32" />
        <Button onClick={handleSubmit} disabled={loading || !name || !prompt}>Create</Button>
      </CardContent>
    </Card>
  );
};

export default AgentForm;
