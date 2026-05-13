"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { isUserAdmin, getRouterConfig, saveRouterConfig } from "@/lib/admin";
import type { RouterProvider, RouterCombo, RouterConfig } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Edit2, Eye, EyeOff, Route, Server, ShieldCheck, Star,
  Save, Loader2, CheckCircle2, Circle, ArrowUp, ArrowDown, Key,
  ExternalLink, Zap, ChevronDown, ChevronUp, Wifi, WifiOff, Play,
  Users, FlaskConical, RefreshCw, XCircle,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nanoid() { return Math.random().toString(36).slice(2, 10); }

function maskKey(key: string) {
  if (!key) return "—";
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}

// ─── Provider catalog ─────────────────────────────────────────────────────────

const PROVIDER_CATALOG = [
  { id: "openrouter",  name: "OpenRouter",       icon: "🌐", type: "openai" as RouterProvider["type"], baseUrl: "https://openrouter.ai/api/v1",                               description: "300+ models — ChatGPT, Claude, Gemini & more",        keysUrl: "https://openrouter.ai/settings/keys",            defaultModel: "openai/gpt-4o-mini",                    oauthKind: "openrouter" as const },
  { id: "openai",      name: "OpenAI",           icon: "🤖", type: "openai" as RouterProvider["type"], baseUrl: "https://api.openai.com/v1",                                   description: "GPT-4o, o1, o3-mini · Use OpenRouter OAuth for 1-click",            keysUrl: "https://platform.openai.com/api-keys",           defaultModel: "gpt-4o",                                oauthKind: null },
  { id: "anthropic",   name: "Anthropic",        icon: "🎨", type: "anthropic" as RouterProvider["type"], baseUrl: "https://api.anthropic.com/v1",                            description: "Claude Sonnet & Opus",           keysUrl: "https://console.anthropic.com/settings/keys",    defaultModel: "claude-sonnet-4-6",                     oauthKind: null },
  { id: "gemini",      name: "Google Gemini",    icon: "✨", type: "openai" as RouterProvider["type"], baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",    description: "Gemini 2.0 Flash & Pro",         keysUrl: "https://aistudio.google.com/app/apikey",         defaultModel: "gemini-2.0-flash",                      oauthKind: "google" as const },
  { id: "groq",        name: "Groq",             icon: "⚡", type: "openai" as RouterProvider["type"], baseUrl: "https://api.groq.com/openai/v1",                              description: "Ultra-fast inference",           keysUrl: "https://console.groq.com/keys",                  defaultModel: "llama-3.3-70b-versatile",               oauthKind: null },
  { id: "deepseek",    name: "DeepSeek",         icon: "🔮", type: "openai" as RouterProvider["type"], baseUrl: "https://api.deepseek.com/v1",                                description: "DeepSeek-R1, V3",                keysUrl: "https://platform.deepseek.com/api_keys",         defaultModel: "deepseek-chat",                         oauthKind: null },
  { id: "xai",         name: "xAI Grok",         icon: "🔭", type: "openai" as RouterProvider["type"], baseUrl: "https://api.x.ai/v1",                                        description: "Grok-2, Grok-3",                 keysUrl: "https://console.x.ai",                           defaultModel: "grok-2-1212",                           oauthKind: null },
  { id: "mistral",     name: "Mistral AI",       icon: "🌪️", type: "openai" as RouterProvider["type"], baseUrl: "https://api.mistral.ai/v1",                                  description: "Mistral Large, Codestral",       keysUrl: "https://console.mistral.ai/api-keys",            defaultModel: "mistral-large-latest",                  oauthKind: null },
  { id: "together",    name: "Together AI",      icon: "🤝", type: "openai" as RouterProvider["type"], baseUrl: "https://api.together.xyz/v1",                                description: "Open source models",             keysUrl: "https://api.together.xyz/settings/api-keys",     defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo", oauthKind: null },
  { id: "ollama",      name: "Ollama (Local)",   icon: "🦙", type: "openai" as RouterProvider["type"], baseUrl: "http://localhost:11434/v1",                                  description: "Local models, free & private",   keysUrl: null,                                             defaultModel: "llama3.2",                              oauthKind: null },
] as const;

type CatalogEntry = typeof PROVIDER_CATALOG[number];

const TYPE_LABELS: Record<RouterProvider["type"], string> = { openai: "OpenAI-compat", anthropic: "Anthropic", custom: "Custom" };
const STRATEGY_LABELS: Record<RouterCombo["strategy"], string> = { fallback: "Fallback", "round-robin": "Round-Robin" };
const EMPTY_CONFIG: RouterConfig = { providers: [], combos: [], activeComboId: null };

// ─── Provider dialog ──────────────────────────────────────────────────────────

function ProviderDialog({ open, initial, preset, onSave, onClose }: {
  open: boolean; initial: RouterProvider | null; preset?: CatalogEntry | null;
  onSave: (p: RouterProvider) => void; onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<RouterProvider["type"]>("openai");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) { setName(initial.name); setType(initial.type); setBaseUrl(initial.baseUrl); setApiKey(initial.apiKey); }
    else if (preset) { setName(preset.name); setType(preset.type); setBaseUrl(preset.baseUrl); setApiKey(""); }
    else { setName(""); setType("openai"); setBaseUrl(""); setApiKey(""); }
    setShowKey(false);
  }, [open, initial, preset]);

  function handleSave() {
    if (!name.trim() || !baseUrl.trim()) return;
    onSave({ id: initial?.id ?? nanoid(), name: name.trim(), type, baseUrl: baseUrl.trim(), apiKey: apiKey.trim(), enabled: initial?.enabled ?? true });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{initial ? "Edit Provider" : preset ? `Connect ${preset.name}` : "Add Custom Provider"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block">Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Provider" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as RouterProvider["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI-compatible</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Base URL *</Label>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.example.com/v1" />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">
              API Key
              {preset?.keysUrl && (
                <a href={preset.keysUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline inline-flex items-center gap-0.5 text-xs">
                  Get key <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </Label>
            <div className="relative">
              <Input type={showKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-…" className="pr-10" />
              <button type="button" onClick={() => setShowKey((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || !baseUrl.trim()}>{initial ? "Save Changes" : "Add Provider"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Combo dialog ─────────────────────────────────────────────────────────────

function ComboDialog({ open, initial, providers, onSave, onClose }: {
  open: boolean; initial: RouterCombo | null; providers: RouterProvider[];
  onSave: (c: RouterCombo) => void; onClose: () => void;
}) {
  const { currentUser } = useAuth();
  const [name, setName] = useState("");
  const [strategy, setStrategy] = useState<RouterCombo["strategy"]>("fallback");
  const [stickyLimit, setStickyLimit] = useState(1);
  const [models, setModels] = useState<string[]>([]);
  const [newProvider, setNewProvider] = useState("");
  const [newModel, setNewModel] = useState("");
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) { setName(initial.name); setStrategy(initial.strategy); setStickyLimit(initial.stickyLimit ?? 1); setModels([...initial.models]); }
    else { setName(""); setStrategy("fallback"); setStickyLimit(1); setModels([]); }
    setNewProvider(""); setNewModel(""); setFetchedModels([]);
  }, [open, initial]);

  async function fetchModels(pid: string) {
    if (!currentUser || !pid) return;
    setFetchingModels(true); setFetchedModels([]);
    try {
      const tok = await currentUser.getIdToken();
      const res = await fetch(`/api/ai/models?providerId=${encodeURIComponent(pid)}`, { headers: { Authorization: `Bearer ${tok}` } });
      const d = await res.json() as { models: string[] };
      setFetchedModels(d.models ?? []);
    } catch { /* silently fail — user can type manually */ } finally { setFetchingModels(false); }
  }

  function addModel() {
    const m = `${newProvider}/${newModel.trim()}`;
    if (!newProvider || !newModel.trim() || models.includes(m)) return;
    setModels((p) => [...p, m]); setNewModel("");
  }

  function move(idx: number, dir: -1 | 1) {
    setModels((prev) => { const n = [...prev]; const s = idx + dir; if (s < 0 || s >= n.length) return prev; [n[idx], n[s]] = [n[s], n[idx]]; return n; });
  }

  function handleSave() {
    if (!name.trim() || models.length === 0) return;
    onSave({ id: initial?.id ?? nanoid(), name: name.trim(), strategy, stickyLimit, models });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? "Edit Combo" : "New Routing Combo"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs mb-1.5 block">Combo Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Routing Combo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block">Strategy</Label>
              <Select value={strategy} onValueChange={(v) => setStrategy(v as RouterCombo["strategy"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fallback">Fallback</SelectItem>
                  <SelectItem value="round-robin">Round-Robin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {strategy === "round-robin" && (
              <div>
                <Label className="text-xs mb-1.5 block">Sticky limit</Label>
                <Input type="number" min={1} value={stickyLimit} onChange={(e) => setStickyLimit(Number(e.target.value))} />
              </div>
            )}
          </div>
          <div>
            <Label className="text-xs mb-2 block">Models (priority order)</Label>
            <div className="space-y-1.5 mb-3">
              {models.map((m, idx) => {
                const slash = m.indexOf("/"); const pId = m.slice(0, slash); const mName = m.slice(slash + 1);
                const prov = providers.find((p) => p.id === pId);
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs bg-muted/40 rounded px-2 py-1.5">
                    <span className="text-muted-foreground w-4 text-right">{idx + 1}.</span>
                    <span className="flex-1 truncate font-medium">{prov?.name ?? pId} / <span className="font-mono text-foreground/70">{mName}</span></span>
                    <div className="flex gap-0.5">
                      <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-0.5 disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                      <button onClick={() => move(idx, 1)} disabled={idx === models.length - 1} className="p-0.5 disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                      <button onClick={() => setModels((p) => p.filter((_, i) => i !== idx))} className="p-0.5 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                );
              })}
              {models.length === 0 && <p className="text-xs text-muted-foreground text-center py-3 bg-muted/20 rounded">No models yet</p>}
            </div>
            <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Provider</Label>
                  <Select value={newProvider} onValueChange={(v) => { setNewProvider(v); setFetchedModels([]); setNewModel(""); }}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select provider" /></SelectTrigger>
                    <SelectContent>{providers.filter((p) => p.enabled).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-[10px] text-muted-foreground">Model</Label>
                    {newProvider && (
                      <button onClick={() => fetchModels(newProvider)} disabled={fetchingModels} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                        {fetchingModels ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5" />} Fetch
                      </button>
                    )}
                  </div>
                  {fetchedModels.length > 0
                    ? <Select value={newModel} onValueChange={setNewModel}><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Choose model" /></SelectTrigger><SelectContent>{fetchedModels.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                    : <Input className="h-8 text-xs font-mono" value={newModel} onChange={(e) => setNewModel(e.target.value)} placeholder="gpt-4o-mini" onKeyDown={(e) => e.key === "Enter" && addModel()} />
                  }
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={addModel} disabled={!newProvider || !newModel.trim()}>
                <Plus className="h-3 w-3 mr-1" /> Add Model
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || models.length === 0}>{initial ? "Save Changes" : "Create Combo"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Provider card ────────────────────────────────────────────────────────────

function ProviderCard({ provider, onEdit, onDelete, onToggle }: {
  provider: RouterProvider; onEdit: () => void; onDelete: () => void; onToggle: (e: boolean) => void;
}) {
  const cat = PROVIDER_CATALOG.find((c) => c.name === provider.name);
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-lg border bg-card hover:bg-card/80 transition-colors">
      <span className="text-xl shrink-0">{cat?.icon ?? "🔌"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-sm">{provider.name}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{TYPE_LABELS[provider.type]}</Badge>
          {provider.enabled
            ? <span className="flex items-center gap-1 text-[10px] text-emerald-400"><Wifi className="h-2.5 w-2.5" />Connected</span>
            : <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><WifiOff className="h-2.5 w-2.5" />Disabled</span>}
          {provider.refreshToken && <span className="text-[10px] text-sky-400">OAuth</span>}
        </div>
        <p className="text-xs text-muted-foreground font-mono truncate">{provider.baseUrl}</p>
        {provider.apiKey && <p className="text-xs text-muted-foreground mt-0.5 font-mono">{maskKey(provider.apiKey)}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Switch checked={provider.enabled} onCheckedChange={onToggle} />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}><Edit2 className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

// ─── Combo card ───────────────────────────────────────────────────────────────

function ComboCard({ combo, providers, isActive, onSetActive, onEdit, onDelete }: {
  combo: RouterCombo; providers: RouterProvider[]; isActive: boolean;
  onSetActive: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className={`rounded-lg border p-4 transition-colors ${isActive ? "border-primary/40 bg-primary/5" : "bg-card hover:bg-card/80"}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {isActive ? <Star className="h-4 w-4 text-amber-400 fill-amber-400 shrink-0" /> : <Route className="h-4 w-4 text-muted-foreground shrink-0" />}
          <span className="font-medium text-sm">{combo.name}</span>
          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${combo.strategy === "round-robin" ? "text-sky-400 border-sky-500/30 bg-sky-500/10" : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"}`}>
            {STRATEGY_LABELS[combo.strategy]}{combo.strategy === "round-robin" && (combo.stickyLimit ?? 1) > 1 ? ` ×${combo.stickyLimit}` : ""}
          </Badge>
          {isActive && <Badge className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary border-primary/30 flex items-center gap-1"><Users className="h-2.5 w-2.5" />Active</Badge>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isActive && <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onSetActive}><Play className="h-3 w-3" />Activate</Button>}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}><Edit2 className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      <div className="space-y-1">
        {combo.models.map((m, idx) => {
          const slash = m.indexOf("/"); const pId = m.slice(0, slash); const mName = m.slice(slash + 1);
          const prov = providers.find((p) => p.id === pId);
          const cat = PROVIDER_CATALOG.find((c) => c.name === prov?.name);
          return (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-4 text-right shrink-0">{idx + 1}.</span>
              <span>{cat?.icon ?? "🔌"}</span>
              {prov?.enabled ? <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> : <Circle className="h-3 w-3 text-muted-foreground shrink-0" />}
              <span className="text-muted-foreground">{prov?.name ?? pId}</span>
              <span className="text-muted-foreground/40">/</span>
              <span className="font-mono text-foreground/80">{mName}</span>
              {!prov && <Badge variant="destructive" className="text-[9px] px-1 py-0">missing</Badge>}
              {prov && !prov.enabled && <Badge variant="secondary" className="text-[9px] px-1 py-0">disabled</Badge>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Quick-connect catalog card ───────────────────────────────────────────────

function CatalogCard({ cat, connected, googleOAuthEnabled, onApiKey, onOAuth }: {
  cat: CatalogEntry; connected: boolean; googleOAuthEnabled: boolean;
  onApiKey: () => void; onOAuth: () => void;
}) {
  const showOAuth =
    (cat.oauthKind === "openrouter") ||
    (cat.oauthKind === "google" && googleOAuthEnabled);

  return (
    <div className={`rounded-lg border p-3 transition-colors ${connected ? "border-emerald-500/30 bg-emerald-500/5" : "bg-card hover:bg-card/80"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">{cat.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium">{cat.name}</span>
              {connected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{cat.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {showOAuth && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10" onClick={onOAuth}>
              <Zap className="h-3 w-3" /> OAuth
            </Button>
          )}
          <Button size="sm" variant={connected ? "ghost" : "outline"} className="h-7 text-xs gap-1" onClick={onApiKey}>
            {connected ? <><Edit2 className="h-3 w-3" />Edit</> : <><Key className="h-3 w-3" />API Key</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [checking, setChecking] = useState(true);
  const [config, setConfig] = useState<RouterConfig>(EMPTY_CONFIG);
  const [saving, setSaving] = useState(false);

  // OAuth state
  const [orConnecting, setOrConnecting] = useState(false);
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [googleOAuthEnabled, setGoogleOAuthEnabled] = useState(false);

  // Quick Activate
  const [quickProvider, setQuickProvider] = useState("");
  const [quickModel, setQuickModel] = useState("");
  const [quickFetchedModels, setQuickFetchedModels] = useState<string[]>([]);
  const [quickFetching, setQuickFetching] = useState(false);

  // AI Test
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message?: string; response?: string; model?: string; provider?: string; ms?: number } | null>(null);

  // Advanced combos section
  const [showCombos, setShowCombos] = useState(false);

  // Dialogs
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<RouterProvider | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<CatalogEntry | null>(null);
  const [comboDialogOpen, setComboDialogOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<RouterCombo | null>(null);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    isUserAdmin(currentUser.uid).then(async (admin) => {
      if (!admin) { router.replace("/dashboard"); return; }

      // Check which OAuth providers are server-configured
      fetch("/api/oauth/config")
        .then((r) => r.json() as Promise<{ google: boolean }>)
        .then((d) => setGoogleOAuthEnabled(d.google))
        .catch(() => {});

      // Handle OAuth callbacks (both providers use ?code=xxx)
      const params = new URLSearchParams(window.location.search);
      const oauthCode = params.get("code");
      const orPending = sessionStorage.getItem("or_oauth_pending");
      const googlePending = sessionStorage.getItem("google_oauth_pending");

      if (oauthCode && orPending) {
        sessionStorage.removeItem("or_oauth_pending");
        const cv = sessionStorage.getItem("or_cv") ?? ""; sessionStorage.removeItem("or_cv");
        window.history.replaceState({}, "", "/admin");
        setOrConnecting(true);
        try {
          const tok = await currentUser.getIdToken();
          const res = await fetch("/api/oauth/openrouter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: oauthCode, codeVerifier: cv, idToken: tok }) });
          const d = await res.json() as { error?: string };
          if (!res.ok) throw new Error(d.error ?? "Exchange failed");
          const cfg = await getRouterConfig(); if (cfg) setConfig(cfg);
          toast({ title: "OpenRouter connected!", description: "AI is now live for all users." });
        } catch (err) {
          toast({ title: "OpenRouter connection failed", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
        } finally { setOrConnecting(false); }
      } else if (oauthCode && googlePending) {
        sessionStorage.removeItem("google_oauth_pending");
        const cv = sessionStorage.getItem("google_cv") ?? ""; sessionStorage.removeItem("google_cv");
        window.history.replaceState({}, "", "/admin");
        setGoogleConnecting(true);
        try {
          const tok = await currentUser.getIdToken();
          const res = await fetch("/api/oauth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: oauthCode, codeVerifier: cv, idToken: tok }) });
          const d = await res.json() as { error?: string };
          if (!res.ok) throw new Error(d.error ?? "Exchange failed");
          const cfg = await getRouterConfig(); if (cfg) setConfig(cfg);
          toast({ title: "Google Gemini connected!", description: "Gemini 2.0 Flash is now active for all users." });
        } catch (err) {
          toast({ title: "Google connection failed", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
        } finally { setGoogleConnecting(false); }
      }

      getRouterConfig().then((cfg) => { if (cfg) setConfig(cfg); setChecking(false); });
    });
  }, [currentUser, router, toast]);

  // ── OAuth helpers ─────────────────────────────────────────────────────────
  async function pkce() {
    const arr = new Uint8Array(32); crypto.getRandomValues(arr);
    const cv = Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
    const enc = new TextEncoder();
    const dig = await crypto.subtle.digest("SHA-256", enc.encode(cv));
    const cc = btoa(String.fromCharCode(...new Uint8Array(dig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    return { codeVerifier: cv, codeChallenge: cc };
  }

  async function handleConnectOpenRouter() {
    const { codeVerifier, codeChallenge } = await pkce();
    sessionStorage.setItem("or_oauth_pending", "1");
    sessionStorage.setItem("or_cv", codeVerifier);
    const cb = `${window.location.origin}/admin`;
    window.location.href = `https://openrouter.ai/auth?callback_url=${encodeURIComponent(cb)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`;
  }

  async function handleConnectGoogle() {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
    if (!googleClientId) {
      toast({ title: "Google OAuth not configured", description: "Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local file.", variant: "destructive" });
      return;
    }
    const { codeVerifier, codeChallenge } = await pkce();
    sessionStorage.setItem("google_oauth_pending", "1");
    sessionStorage.setItem("google_cv", codeVerifier);
    const cb = `${window.location.origin}/admin`;
    const scope = encodeURIComponent("https://www.googleapis.com/auth/generative-language openid email");
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(googleClientId)}&redirect_uri=${encodeURIComponent(cb)}&response_type=code&scope=${scope}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256&access_type=offline&prompt=consent`;
  }

  // ── Quick Activate ────────────────────────────────────────────────────────
  async function fetchQuickModels(pid: string) {
    if (!currentUser || !pid) return;
    setQuickFetching(true); setQuickFetchedModels([]);
    try {
      const tok = await currentUser.getIdToken();
      const res = await fetch(`/api/ai/models?providerId=${encodeURIComponent(pid)}`, { headers: { Authorization: `Bearer ${tok}` } });
      const d = await res.json() as { models: string[] };
      setQuickFetchedModels(d.models ?? []);
      // Auto-select default model for the provider if no model yet
      if (!quickModel && d.models.length === 0) {
        const cat = PROVIDER_CATALOG.find((c) => config.providers.find((p) => p.id === pid)?.name === c.name);
        if (cat) setQuickModel(cat.defaultModel);
      }
    } catch { /* silent */ } finally { setQuickFetching(false); }
  }

  async function handleQuickActivate() {
    if (!quickProvider || !quickModel || !currentUser) return;
    const newConfig: RouterConfig = { ...config, activeModel: `${quickProvider}/${quickModel}`, activeComboId: null };
    setConfig(newConfig);
    setSaving(true);
    try {
      await saveRouterConfig(newConfig, currentUser.uid);
      const prov = config.providers.find((p) => p.id === quickProvider);
      toast({ title: "AI activated!", description: `${prov?.name ?? quickProvider} / ${quickModel} is now live for all users.` });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally { setSaving(false); }
  }

  // ── Test AI ───────────────────────────────────────────────────────────────
  async function handleTestAI() {
    if (!currentUser) return;
    setTesting(true); setTestResult(null);
    try {
      const tok = await currentUser.getIdToken();
      const res = await fetch("/api/ai/test", { method: "POST", headers: { Authorization: `Bearer ${tok}` } });
      const d = await res.json() as { ok: boolean; response?: string; model?: string; provider?: string; ms?: number; message?: string };
      setTestResult(d);
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : String(err) });
    } finally { setTesting(false); }
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!currentUser) return;
    setSaving(true);
    try { await saveRouterConfig(config, currentUser.uid); toast({ title: "Config saved" }); }
    catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  // ── Provider mutations ────────────────────────────────────────────────────
  function upsertProvider(p: RouterProvider) {
    setConfig((prev) => { const idx = prev.providers.findIndex((x) => x.id === p.id); return { ...prev, providers: idx >= 0 ? prev.providers.map((x, i) => i === idx ? p : x) : [...prev.providers, p] }; });
    setProviderDialogOpen(false); setEditingProvider(null); setSelectedPreset(null);
  }
  function deleteProvider(id: string) {
    setConfig((prev) => ({ ...prev, providers: prev.providers.filter((p) => p.id !== id), combos: prev.combos.map((c) => ({ ...c, models: c.models.filter((m) => !m.startsWith(`${id}/`)) })) }));
  }

  // ── Combo mutations ───────────────────────────────────────────────────────
  function upsertCombo(c: RouterCombo) {
    setConfig((prev) => { const idx = prev.combos.findIndex((x) => x.id === c.id); return { ...prev, combos: idx >= 0 ? prev.combos.map((x, i) => i === idx ? c : x) : [...prev.combos, c] }; });
    setComboDialogOpen(false); setEditingCombo(null);
  }
  function deleteCombo(id: string) {
    setConfig((prev) => ({ ...prev, combos: prev.combos.filter((c) => c.id !== id), activeComboId: prev.activeComboId === id ? null : prev.activeComboId }));
  }

  if (checking) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  // ── Derive active state ───────────────────────────────────────────────────
  const activeCombo = config.combos.find((c) => c.id === config.activeComboId);
  const activeDirectModel = !activeCombo && config.activeModel ? config.activeModel : null;
  const isActive = !!(activeCombo || activeDirectModel);

  let activeTitle = ""; let activeSubtitle = "";
  if (activeCombo) {
    activeTitle = activeCombo.name;
    activeSubtitle = `${STRATEGY_LABELS[activeCombo.strategy]} · ${activeCombo.models.length} model${activeCombo.models.length !== 1 ? "s" : ""}`;
  } else if (activeDirectModel) {
    const slash = activeDirectModel.indexOf("/");
    const pId = activeDirectModel.slice(0, slash);
    const mName = activeDirectModel.slice(slash + 1);
    const prov = config.providers.find((p) => p.id === pId);
    const cat = PROVIDER_CATALOG.find((c) => c.name === prov?.name);
    activeTitle = `${cat?.icon ?? "🔌"} ${prov?.name ?? pId}`;
    activeSubtitle = mName;
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-amber-400" />
            <h1 className="font-headline text-2xl font-bold">AI Router</h1>
          </div>
          <p className="text-sm text-muted-foreground">Connect a provider → pick a model → activate. All users share the active model.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Save Config
        </Button>
      </div>

      {/* ── Status banner ── */}
      {isActive ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-5 py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-emerald-300 text-sm">LIVE</span>
                  <span className="font-medium">{activeTitle}</span>
                  <span className="text-sm text-muted-foreground font-mono">{activeSubtitle}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Users className="h-3 w-3" />All users&apos; AI requests route through this</p>
              </div>
            </div>
            {/* Test AI button */}
            <div className="flex items-center gap-3 shrink-0">
              {testResult && (
                <span className={`text-xs flex items-center gap-1 ${testResult.ok ? "text-emerald-400" : "text-red-400"}`}>
                  {testResult.ok
                    ? <><CheckCircle2 className="h-3.5 w-3.5" />{testResult.response} · {testResult.ms}ms</>
                    : <><XCircle className="h-3.5 w-3.5" />{testResult.message?.slice(0, 60)}</>}
                </span>
              )}
              <Button size="sm" variant="outline" onClick={handleTestAI} disabled={testing} className="gap-1.5 border-emerald-500/30 hover:bg-emerald-500/10">
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
                Test AI
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 flex items-center gap-3">
          <Circle className="h-4 w-4 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">No active model</p>
            <p className="text-xs text-muted-foreground mt-0.5">Connect a provider below, then activate a model to enable AI for all users.</p>
          </div>
        </div>
      )}

      {/* ── Quick Activate (shown once providers exist) ── */}
      {config.providers.filter((p) => p.enabled).length > 0 && (
        <div className="rounded-xl border p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2"><Play className="h-4 w-4 text-primary" />Quick Activate</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Pick a provider and model — AI goes live for all users instantly. No combo needed.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={quickProvider} onValueChange={(v) => { setQuickProvider(v); setQuickModel(""); setQuickFetchedModels([]); const cat = PROVIDER_CATALOG.find((c) => config.providers.find((p) => p.id === v)?.name === c.name); if (cat) setQuickModel(cat.defaultModel); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Choose provider" /></SelectTrigger>
              <SelectContent>
                {config.providers.filter((p) => p.enabled).map((p) => {
                  const cat = PROVIDER_CATALOG.find((c) => c.name === p.name);
                  return <SelectItem key={p.id} value={p.id}>{cat?.icon} {p.name}</SelectItem>;
                })}
              </SelectContent>
            </Select>

            {quickFetchedModels.length > 0
              ? (
                <Select value={quickModel} onValueChange={setQuickModel}>
                  <SelectTrigger className="flex-1 min-w-40"><SelectValue placeholder="Choose model" /></SelectTrigger>
                  <SelectContent>{quickFetchedModels.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Input className="flex-1 min-w-40 font-mono text-sm" value={quickModel} onChange={(e) => setQuickModel(e.target.value)} placeholder="e.g. gpt-4o-mini" />
              )}

            <Button variant="ghost" size="icon" onClick={() => fetchQuickModels(quickProvider)} disabled={!quickProvider || quickFetching} title="Fetch models from provider">
              {quickFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>

            <Button onClick={handleQuickActivate} disabled={!quickProvider || !quickModel.trim() || saving} className="gap-1.5">
              <Play className="h-4 w-4" />Activate for all users
            </Button>
          </div>
        </div>
      )}

      {/* ── Provider Catalog ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2"><Server className="h-4 w-4 text-muted-foreground" />Connect a Provider</h2>
            <p className="text-xs text-muted-foreground mt-0.5"><span className="text-foreground font-medium">OAuth</span> = one-click sign-in · <span className="text-foreground font-medium">API Key</span> = paste your key</p>
          </div>
          <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => { setEditingProvider(null); setSelectedPreset(null); setProviderDialogOpen(true); }}>
            <Plus className="h-3.5 w-3.5" />Custom
          </Button>
        </div>

        {(orConnecting || googleConnecting) && (
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg border bg-muted/20">
            <Loader2 className="h-4 w-4 animate-spin" />
            {orConnecting ? "Connecting OpenRouter via OAuth…" : "Connecting Google Gemini via OAuth…"}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PROVIDER_CATALOG.map((cat) => {
            const connected = config.providers.some((p) => p.name === cat.name);
            return (
              <CatalogCard
                key={cat.id}
                cat={cat}
                connected={connected}
                googleOAuthEnabled={googleOAuthEnabled}
                onApiKey={() => { setEditingProvider(null); setSelectedPreset(cat); setProviderDialogOpen(true); }}
                onOAuth={cat.oauthKind === "google" ? handleConnectGoogle : handleConnectOpenRouter}
              />
            );
          })}
        </div>
      </div>

      {/* ── Connected Providers ── */}
      {config.providers.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2"><Wifi className="h-4 w-4 text-muted-foreground" />My Providers ({config.providers.length})</h2>
          <div className="space-y-2">
            {config.providers.map((p) => (
              <ProviderCard key={p.id} provider={p}
                onEdit={() => { setEditingProvider(p); setSelectedPreset(null); setProviderDialogOpen(true); }}
                onDelete={() => deleteProvider(p.id)}
                onToggle={(enabled) => setConfig((prev) => ({ ...prev, providers: prev.providers.map((x) => x.id === p.id ? { ...x, enabled } : x) }))}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Key className="h-3 w-3" />API keys and OAuth tokens stored in Firestore server-side — never exposed to users.</p>
        </div>
      )}

      {/* ── Advanced: Routing Combos (collapsible) ── */}
      <div>
        <button
          onClick={() => setShowCombos((s) => !s)}
          className="w-full flex items-center justify-between p-4 rounded-xl border hover:bg-muted/20 transition-colors text-left"
        >
          <div>
            <span className="text-sm font-semibold flex items-center gap-2"><Route className="h-4 w-4 text-muted-foreground" />Advanced: Routing Combos ({config.combos.length})</span>
            <p className="text-xs text-muted-foreground mt-0.5">Fallback chains and round-robin across multiple providers. Optional.</p>
          </div>
          {showCombos ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showCombos && (
          <div className="mt-3 space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => { setEditingCombo(null); setComboDialogOpen(true); }} disabled={config.providers.length === 0} className="gap-1.5">
                <Plus className="h-4 w-4" />New Combo
              </Button>
            </div>
            {config.combos.length === 0 ? (
              <Card className="border-dashed"><CardContent className="py-8 text-center text-sm text-muted-foreground">No combos yet. Combos let you chain multiple models with fallback or round-robin routing.</CardContent></Card>
            ) : (
              config.combos.map((c) => (
                <ComboCard key={c.id} combo={c} providers={config.providers}
                  isActive={c.id === config.activeComboId}
                  onSetActive={() => setConfig((prev) => ({ ...prev, activeComboId: c.id, activeModel: undefined }))}
                  onEdit={() => { setEditingCombo(c); setComboDialogOpen(true); }}
                  onDelete={() => deleteCombo(c.id)}
                />
              ))
            )}
            <Card className="border-dashed">
              <CardContent className="py-3 space-y-1">
                <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Fallback:</span> tries models top-to-bottom, returns first success.</p>
                <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Round-Robin:</span> rotates through models each request.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ── Dialogs ── */}
      <ProviderDialog open={providerDialogOpen} initial={editingProvider} preset={selectedPreset}
        onSave={upsertProvider} onClose={() => { setProviderDialogOpen(false); setEditingProvider(null); setSelectedPreset(null); }} />
      <ComboDialog open={comboDialogOpen} initial={editingCombo} providers={config.providers}
        onSave={upsertCombo} onClose={() => { setComboDialogOpen(false); setEditingCombo(null); }} />
    </div>
  );
}
