"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Lock, Unlock, Save, Plus, Trash2, Info } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Template {
  id: string;
  name: string;
  templateText: string;
  isLocked: boolean;
  updatedAt: string;
}

export default function TemplateBuilder() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("editor");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      setTemplates(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load templates");
      setLoading(false);
    }
  };

  const createNewTemplate = () => {
    const newTemp = {
      id: "new",
      name: "New Band 9 Template",
      templateText: "",
      isLocked: false,
      updatedAt: new Date().toISOString(),
    };
    setCurrentTemplate(newTemp);
    setActiveTab("editor");
  };

  const handleSave = async () => {
    if (!currentTemplate) return;

    if (!currentTemplate.name.trim()) {
      toast.error("Please provide a template name");
      return;
    }

    try {
      const isNew = currentTemplate.id === "new";
      const url = isNew ? "/api/templates" : `/api/templates/${currentTemplate.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentTemplate.name,
          templateText: currentTemplate.templateText,
          isLocked: currentTemplate.isLocked,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      const savedTemplate = await res.json();
      toast.success("Template saved successfully");
      
      if (isNew) {
        setTemplates([savedTemplate, ...templates]);
        setCurrentTemplate(savedTemplate);
      } else {
        setTemplates(templates.map(t => t.id === savedTemplate.id ? savedTemplate : t));
        setCurrentTemplate(savedTemplate);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save template");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");

      setTemplates(templates.filter(t => t.id !== id));
      if (currentTemplate?.id === id) setCurrentTemplate(null);
      toast.success("Template deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete template");
    }
  };

  const toggleLock = async () => {
    if (!currentTemplate || currentTemplate.id === "new") return;
    
    const newLockState = !currentTemplate.isLocked;
    setCurrentTemplate({ ...currentTemplate, isLocked: newLockState });
    
    // Auto-save lock state
    try {
       const res = await fetch(`/api/templates/${currentTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentTemplate,
          isLocked: newLockState,
        }),
      });
      if(res.ok) {
        const updated = await res.json();
        setTemplates(templates.map(t => t.id === updated.id ? updated : t));
        toast.success(newLockState ? "Template Locked" : "Template Unlocked");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update lock state");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Template Builder</h1>
        <Button onClick={createNewTemplate} disabled={loading}>
          <Plus className="mr-2 h-4 w-4" /> New Template
        </Button>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>How to use templates in drills</AlertTitle>
        <AlertDescription>
          After creating and saving your template, click the <Lock className="inline h-3 w-3" /> <strong>Lock</strong> button to finalize it.
          Locked templates can be used in the <Link href="/drills/template-fill" className="text-primary underline">Template Fill Drill</Link>.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar: List of Templates */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <p>Loading...</p>
              ) : templates.length === 0 ? (
                <p className="text-muted-foreground">No templates yet.</p>
              ) : (
                templates.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors flex justify-between items-center ${
                      currentTemplate?.id === t.id ? "bg-accent border-primary" : ""
                    }`}
                    onClick={() => setCurrentTemplate(t)}
                  >
                    <div className="truncate">
                      <p className="font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {t.isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Editor Area */}
        <div className="md:col-span-2">
          {currentTemplate ? (
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                  <Input
                    value={currentTemplate.name}
                    onChange={(e) =>
                      !currentTemplate.isLocked &&
                      setCurrentTemplate({ ...currentTemplate, name: e.target.value })
                    }
                    className="text-lg font-bold border-none px-0 h-auto focus-visible:ring-0"
                    placeholder="Template Name"
                    disabled={currentTemplate.isLocked}
                  />
                  <CardDescription>
                    {currentTemplate.isLocked
                      ? "Locked for memorization practice"
                      : "Drafting mode"}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  {currentTemplate.id !== "new" && (
                     <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleLock}
                      title={currentTemplate.isLocked ? "Unlock" : "Lock"}
                    >
                      {currentTemplate.isLocked ? (
                        <Lock className="h-5 w-5 text-orange-500" />
                      ) : (
                        <Unlock className="h-5 w-5" />
                      )}
                    </Button>
                  )}
                  <Button onClick={handleSave} disabled={currentTemplate.isLocked}>
                    <Save className="mr-2 h-4 w-4" /> Save
                  </Button>
                  {currentTemplate.id !== "new" && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(currentTemplate.id)}
                      disabled={currentTemplate.isLocked}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="editor">Editor</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="editor" className="h-[500px]">
                    <Textarea
                      value={currentTemplate.templateText}
                      onChange={(e) =>
                        setCurrentTemplate({
                          ...currentTemplate,
                          templateText: e.target.value,
                        })
                      }
                      placeholder="Start writing your Band 9 template here... Use [TOPIC], [POINT], etc. as placeholders."
                      className="h-full font-mono text-sm leading-relaxed resize-none p-4"
                      disabled={currentTemplate.isLocked}
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="h-[500px] overflow-auto border rounded-md p-4 bg-muted/20">
                    <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                      {currentTemplate.templateText || (
                        <span className="text-muted-foreground italic">
                          Empty template...
                        </span>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="mt-4 text-xs text-muted-foreground flex justify-between">
                    <span>Status: {currentTemplate.isLocked ? "Ready for Drills" : "In Progress"}</span>
                    <span>Words: {currentTemplate.templateText.split(/\s+/).filter(w => w.length > 0).length}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
              <p>Select a template or create a new one to get started.</p>
              <Button variant="outline" className="mt-4" onClick={createNewTemplate}>
                Create Template
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

