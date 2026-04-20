"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAISettingsContext } from "@/contexts/ai-settings-context";
import type { AIProviderConfig } from "@/lib/types";
import {
  Settings,
  Bot,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  Zap,
  Globe,
  Key,
  Server,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";

// ─── Provider metadata ────────────────────────────────────────────────────────

interface ProviderMeta {
  id: string;
  displayName: string;
  description: string;
  docsUrl: string;
  modelOptions: string[];
  color: string;
  icon: React.ReactNode;
}

const PROVIDER_META: Record<string, ProviderMeta> = {
  "google-gemini": {
    id: "google-gemini",
    displayName: "Google Gemini",
    description: "Access Gemini 2.0 Flash, 1.5 Pro and more via Google AI Studio",
    docsUrl: "https://aistudio.google.com/app/apikey",
    modelOptions: [
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-1.0-pro",
    ],
    color: "text-blue-400",
    icon: <GoogleIcon />,
  },
  openai: {
    id: "openai",
    displayName: "OpenAI",
    description: "GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo and the latest OpenAI models",
    docsUrl: "https://platform.openai.com/api-keys",
    modelOptions: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    color: "text-emerald-400",
    icon: <OpenAIIcon />,
  },
  anthropic: {
    id: "anthropic",
    displayName: "Anthropic",
    description: "Claude Opus, Sonnet, and Haiku — the Claude model family",
    docsUrl: "https://console.anthropic.com/settings/keys",
    modelOptions: [
      "claude-opus-4-7",
      "claude-sonnet-4-6",
      "claude-haiku-4-5-20251001",
      "claude-3-5-sonnet-20241022",
    ],
    color: "text-orange-400",
    icon: <AnthropicIcon />,
  },
  groq: {
    id: "groq",
    displayName: "Groq",
    description: "Ultra-fast inference for Llama, Mixtral, Gemma and more",
    docsUrl: "https://console.groq.com/keys",
    modelOptions: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
    ],
    color: "text-purple-400",
    icon: <GroqIcon />,
  },
  openrouter: {
    id: "openrouter",
    displayName: "OpenRouter",
    description: "Unified API for 300+ models — OpenAI, Anthropic, Meta, and more",
    docsUrl: "https://openrouter.ai/keys",
    modelOptions: [
      "openai/gpt-4o",
      "anthropic/claude-sonnet-4-6",
      "meta-llama/llama-3.3-70b-instruct",
      "google/gemini-2.0-flash-001",
      "mistralai/mistral-large",
    ],
    color: "text-pink-400",
    icon: <OpenRouterIcon />,
  },
  mistral: {
    id: "mistral",
    displayName: "Mistral AI",
    description: "Mistral Large, Small and open-weight models from Mistral AI",
    docsUrl: "https://console.mistral.ai/api-keys",
    modelOptions: [
      "mistral-large-latest",
      "mistral-medium-latest",
      "mistral-small-latest",
      "open-mixtral-8x22b",
    ],
    color: "text-sky-400",
    icon: <MistralIcon />,
  },
  ollama: {
    id: "ollama",
    displayName: "Ollama (Local)",
    description: "Run open-source models locally — no API key required",
    docsUrl: "https://ollama.com/download",
    modelOptions: ["llama3.2", "llama3.1", "mistral", "gemma2", "phi3", "qwen2.5"],
    color: "text-gray-400",
    icon: <OllamaIcon />,
  },
};

// ─── SVG Provider Icons ───────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function OpenAIIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
    </svg>
  );
}

function AnthropicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674L5.18 8.37l-1.6 4.06H7.1l1.05 2.63H3.07L1.5 20H-2L5.04 3.52h1.529z"/>
    </svg>
  );
}

function GroqIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
    </svg>
  );
}

function OpenRouterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>
    </svg>
  );
}

function MistralIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M3 3h4v4H3zM17 3h4v4h-4zM3 10h4v4H3zM10 10h4v4h-4zM17 10h4v4h-4zM10 17h4v4h-4zM3 17h4v4H3zM17 17h4v4h-4z"/>
    </svg>
  );
}

function OllamaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm1-13h-2v5l4 2.5 1-1.73-3-1.77z"/>
    </svg>
  );
}

// ─── Form Schemas ─────────────────────────────────────────────────────────────

const providerFormSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().url("Must be a valid URL").min(1, "Base URL is required"),
  model: z.string().min(1, "Model name is required"),
});

const customProviderSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  apiKey: z.string().optional(),
  baseUrl: z.string().url("Must be a valid URL").min(1, "Base URL is required"),
  model: z.string().min(1, "Model name is required"),
});

type ProviderFormValues = z.infer<typeof providerFormSchema>;
type CustomProviderFormValues = z.infer<typeof customProviderSchema>;

// ─── Configure Provider Dialog ────────────────────────────────────────────────

function ConfigureProviderDialog({
  provider,
  meta,
  open,
  onOpenChange,
}: {
  provider: AIProviderConfig;
  meta: ProviderMeta | undefined;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { updateProvider, setActiveProvider, settings } = useAISettingsContext();
  const { toast } = useToast();
  const [showKey, setShowKey] = useState(false);

  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: {
      apiKey: provider.apiKey,
      baseUrl: provider.baseUrl,
      model: provider.model,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        apiKey: provider.apiKey,
        baseUrl: provider.baseUrl,
        model: provider.model,
      });
    }
  }, [open, provider, form]);

  function onSubmit(values: ProviderFormValues) {
    updateProvider(provider.id, {
      apiKey: values.apiKey ?? "",
      baseUrl: values.baseUrl,
      model: values.model,
      enabled: true,
    });
    if (settings.activeProviderId === null) {
      setActiveProvider(provider.id);
    }
    toast({ title: "Provider saved", description: `${provider.name} has been configured.` });
    onOpenChange(false);
  }

  const modelOptions = meta?.modelOptions ?? [];
  const isOllama = provider.id === "ollama";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={meta?.color}>{meta?.icon}</span>
            Configure {provider.name}
          </DialogTitle>
          <DialogDescription>
            {meta?.description ?? "Set up this AI provider connection."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            {!isOllama && (
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5" />
                      API Key
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showKey ? "text" : "password"}
                          placeholder="sk-••••••••••••••••"
                          className="pr-10 font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKey((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Stored locally in your browser.{" "}
                      {meta?.docsUrl && (
                        <a
                          href={meta.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-primary hover:underline"
                        >
                          Get API key <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    Base URL
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://api.example.com/v1" className="font-mono text-sm" />
                  </FormControl>
                  <FormDescription>
                    {isOllama ? "Your local Ollama server URL." : "API endpoint — pre-filled with the default."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5" />
                    Model
                  </FormLabel>
                  {modelOptions.length > 0 ? (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modelOptions.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                        <SelectItem value="__custom__">Custom model…</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <FormControl>
                      <Input {...field} placeholder="e.g. gpt-4o" className="font-mono text-sm" />
                    </FormControl>
                  )}
                  {field.value === "__custom__" && (
                    <FormControl>
                      <Input
                        placeholder="Enter model ID"
                        className="mt-2 font-mono text-sm"
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                  )}
                  <FormDescription>The model ID to use for AI features.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Connection</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Custom Provider Dialog ───────────────────────────────────────────────

function AddCustomProviderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { addCustomProvider, setActiveProvider, settings } = useAISettingsContext();
  const { toast } = useToast();
  const [showKey, setShowKey] = useState(false);

  const form = useForm<CustomProviderFormValues>({
    resolver: zodResolver(customProviderSchema),
    defaultValues: { name: "", apiKey: "", baseUrl: "", model: "" },
  });

  function onSubmit(values: CustomProviderFormValues) {
    const id = addCustomProvider({
      name: values.name,
      apiKey: values.apiKey ?? "",
      baseUrl: values.baseUrl,
      model: values.model,
      enabled: true,
    });
    if (settings.activeProviderId === null) {
      setActiveProvider(id);
    }
    toast({ title: "Custom provider added", description: `${values.name} has been added.` });
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add Custom Provider
          </DialogTitle>
          <DialogDescription>
            Connect any OpenAI-compatible API endpoint — self-hosted models, Cloudflare AI, Together AI, or others.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="My Custom Provider" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    Base URL
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://your-api.example.com/v1" className="font-mono text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5" />
                    Model ID
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. llama-3.1-70b" className="font-mono text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5" />
                    API Key{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showKey ? "text" : "password"}
                        placeholder="Your API key"
                        className="pr-10 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormDescription>Stored locally in your browser only.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Provider</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Provider Card ────────────────────────────────────────────────────────────

function ProviderCard({ provider }: { provider: AIProviderConfig }) {
  const { updateProvider, setActiveProvider, removeProvider, settings } =
    useAISettingsContext();
  const { toast } = useToast();
  const [configOpen, setConfigOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const meta = PROVIDER_META[provider.id];
  const isActive = settings.activeProviderId === provider.id;
  const isConfigured = provider.apiKey.length > 0 || provider.id === "ollama";

  function handleToggle(checked: boolean) {
    updateProvider(provider.id, { enabled: checked });
    if (!checked && isActive) {
      setActiveProvider(null);
    }
  }

  function handleSetActive() {
    if (!provider.enabled) {
      toast({
        title: "Provider not enabled",
        description: "Enable the provider first before setting it as active.",
        variant: "destructive",
      });
      return;
    }
    setActiveProvider(provider.id);
    toast({ title: "Active provider updated", description: `${provider.name} is now the active AI provider.` });
  }

  return (
    <>
      <Card
        className={`relative transition-all duration-200 ${
          isActive
            ? "border-primary/60 bg-primary/5 shadow-md shadow-primary/10"
            : "border-border hover:border-border/80"
        }`}
      >
        {isActive && (
          <div className="absolute -top-2.5 left-4">
            <Badge className="text-xs bg-primary text-primary-foreground px-2 py-0.5 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Active
            </Badge>
          </div>
        )}

        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            {/* Left: icon + info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted ${meta?.color ?? "text-muted-foreground"}`}
              >
                {meta?.icon ?? <Server className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm leading-tight">{provider.name}</h3>
                  {provider.isCustom && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      Custom
                    </Badge>
                  )}
                  {isConfigured && provider.enabled && (
                    <Badge
                      variant="secondary"
                      className="text-xs px-1.5 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-0.5" />
                      Connected
                    </Badge>
                  )}
                  {!isConfigured && (
                    <Badge
                      variant="secondary"
                      className="text-xs px-1.5 py-0 bg-amber-500/10 text-amber-400 border-amber-500/20"
                    >
                      <AlertCircle className="h-3 w-3 mr-0.5" />
                      Not configured
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                  {meta?.description ?? "Custom OpenAI-compatible endpoint"}
                </p>
                {provider.enabled && provider.model && (
                  <p className="text-xs text-muted-foreground/70 font-mono mt-1 truncate">
                    {provider.model}
                  </p>
                )}
              </div>
            </div>

            {/* Right: toggle */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Switch
                checked={provider.enabled}
                onCheckedChange={handleToggle}
                aria-label={`Enable ${provider.name}`}
              />
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 text-xs"
              onClick={() => setConfigOpen(true)}
            >
              <Settings className="h-3.5 w-3.5" />
              Configure
            </Button>

            {!isActive && provider.enabled && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
                onClick={handleSetActive}
              >
                <Zap className="h-3.5 w-3.5" />
                Set Active
              </Button>
            )}

            {provider.isCustom && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfigureProviderDialog
        provider={provider}
        meta={meta}
        open={configOpen}
        onOpenChange={setConfigOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove provider?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{provider.name}</strong> and delete its stored API key from your browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removeProvider(provider.id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── AI Integration Tab ───────────────────────────────────────────────────────

function AIIntegrationTab() {
  const { settings, activeProvider } = useAISettingsContext();
  const [addOpen, setAddOpen] = useState(false);

  const builtInProviders = settings.providers.filter((p) => !p.isCustom);
  const customProviders = settings.providers.filter((p) => p.isCustom);

  return (
    <div className="space-y-6">
      {/* Active provider banner */}
      <Card className="border-border/50 bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Active AI Provider</p>
              {activeProvider ? (
                <p className="text-sm text-muted-foreground truncate">
                  <span className="font-semibold text-foreground">{activeProvider.name}</span>
                  {" · "}
                  <span className="font-mono text-xs">{activeProvider.model}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No provider selected — configure one below and set it as active.
                </p>
              )}
            </div>
            {!activeProvider && (
              <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 shrink-0">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not set
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Privacy note */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
        <Key className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="text-blue-400 font-medium">API keys are stored locally in your browser</span> and never
          sent to our servers. They are only used when making AI requests directly from your device.
        </p>
      </div>

      {/* Built-in providers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">Providers</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enable and configure AI service providers
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {builtInProviders.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      </div>

      {/* Custom providers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">Custom Connections</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add any OpenAI-compatible API endpoint
            </p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Custom
          </Button>
        </div>

        {customProviders.length === 0 ? (
          <button
            onClick={() => setAddOpen(true)}
            className="w-full rounded-lg border border-dashed border-border/60 p-6 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors group"
          >
            <Plus className="h-8 w-8 mx-auto text-muted-foreground/40 group-hover:text-primary/60 mb-2 transition-colors" />
            <p className="text-sm text-muted-foreground">
              Add a custom OpenAI-compatible endpoint
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Self-hosted models, Together AI, Cloudflare AI, LM Studio, and more
            </p>
          </button>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {customProviders.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
            <button
              onClick={() => setAddOpen(true)}
              className="rounded-lg border border-dashed border-border/60 p-5 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors group flex flex-col items-center justify-center gap-2 min-h-[140px]"
            >
              <Plus className="h-6 w-6 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
              <p className="text-xs text-muted-foreground">Add another</p>
            </button>
          </div>
        )}
      </div>

      <AddCustomProviderDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

// ─── General Tab ──────────────────────────────────────────────────────────────

function GeneralTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Your account preferences and display settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="text-sm font-medium">Theme</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Application appearance</p>
            </div>
            <Badge variant="secondary">Dark</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="text-sm font-medium">Language</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Display language</p>
            </div>
            <Badge variant="secondary">English</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Privacy</CardTitle>
          <CardDescription>Control how your data is used.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Analytics</Label>
              <p className="text-xs text-muted-foreground">
                Help improve the app with anonymous usage data
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("general");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "ai") setActiveTab("ai");
  }, [searchParams]);

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account, preferences, and AI integrations.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="h-10">
          <TabsTrigger value="general" className="gap-2 text-sm">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2 text-sm">
            <Bot className="h-4 w-4" />
            AI Integration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab />
        </TabsContent>

        <TabsContent value="ai">
          <AIIntegrationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
