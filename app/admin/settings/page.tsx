"use client";

import { useEffect, useState } from "react";
import {
  getProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  testProvider,
  getAgentDefaults,
  upsertAgentDefault,
  type AIProvider,
  type AgentDefault,
  AGENT_TYPES,
} from "@/lib/api";
import { Button, Modal, FormField, Select, ConfirmModal, Badge, useToast } from "@/components/ui";
import { Settings, Plus, Pencil, Trash2, Zap, Bot, CheckCircle2, XCircle, Loader2 } from "lucide-react";


const AGENT_LABELS: Record<string, { label: string; emoji: string; description: string }> = {
  strategy:           { emoji: "🧠", label: "Strategy",           description: "Content strategy & positioning" },
  research:           { emoji: "🔍", label: "Research",           description: "Topic research & insights" },
  angle:              { emoji: "🎯", label: "Angle",              description: "Content angle & hook direction" },
  hook:               { emoji: "⚡", label: "Hook Writer",        description: "Opening hooks & attention grabbers" },
  copywriter:         { emoji: "✍️",  label: "Copywriter",        description: "Core content writing" },
  cta:                { emoji: "📣", label: "CTA Writer",         description: "Calls to action" },
  qa:                 { emoji: "✅", label: "QA / Editor",        description: "Quality assurance & editing" },
  creative_direction: { emoji: "🎨", label: "Creative Direction", description: "Visual & carousel structure" },
  repurpose:          { emoji: "♻️",  label: "Repurposer",        description: "Repurpose content across formats" },
};

const EMPTY_PROVIDER = { name: "", providerType: "openai", apiKey: "", baseUrl: "", defaultModel: "" };

export default function SettingsPage() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [defaults, setDefaults] = useState<AgentDefault[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<AIProvider | null>(null);
  const [form, setForm] = useState(EMPTY_PROVIDER);
  const [saving, setSaving] = useState(false);
  const [testResults, setTestResults] = useState<Record<number, { success: boolean; text: string } | "loading">>({});
  const [deleteTarget, setDeleteTarget] = useState<AIProvider | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [agentForms, setAgentForms] = useState<Record<string, { providerId: string; model: string }>>({});
  const [savingAgent, setSavingAgent] = useState<string | null>(null);
  const { show, ToastEl } = useToast();

  const load = async () => {
    const [p, d] = await Promise.all([getProviders(), getAgentDefaults()]);
    setProviders(p);
    setDefaults(d);
    const forms: Record<string, { providerId: string; model: string }> = {};
    AGENT_TYPES.forEach((a) => {
      const existing = d.find((x) => x.agentType === a);
      forms[a] = { providerId: existing ? String(existing.providerId) : "", model: existing?.model ?? "" };
    });
    setAgentForms(forms);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditProvider(null); setForm(EMPTY_PROVIDER); setModalOpen(true); };
  const openEdit = (p: AIProvider) => {
    setEditProvider(p);
    setForm({ name: p.name, providerType: p.providerType, apiKey: "", baseUrl: p.baseUrl ?? "", defaultModel: p.defaultModel });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editProvider) {
        const payload: Record<string, string> = { name: form.name, providerType: form.providerType, defaultModel: form.defaultModel, baseUrl: form.baseUrl };
        if (form.apiKey) payload.apiKey = form.apiKey;
        await updateProvider(editProvider.id, payload as any);
        show("Provider updated");
      } else {
        await createProvider(form as any);
        show("Provider created");
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      show(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (id: number) => {
    setTestResults((prev) => ({ ...prev, [id]: "loading" }));
    const result = await testProvider(id);
    setTestResults((prev) => ({ ...prev, [id]: { success: result.success, text: result.response ?? result.error ?? "" } }));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProvider(deleteTarget.id);
      show("Provider deleted");
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      show(e.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const saveAgentDefault = async (agentType: string) => {
    const f = agentForms[agentType];
    if (!f.providerId || !f.model) return;
    setSavingAgent(agentType);
    try {
      await upsertAgentDefault({ agentType, providerId: Number(f.providerId), model: f.model });
      show(`Default saved for ${agentType.replace(/_/g, " ")}`);
      load();
    } catch (e: any) {
      show(e.message, "error");
    } finally {
      setSavingAgent(null);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-up space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold" style={{ color: "var(--text-primary)" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Configure AI providers and agent model defaults</p>
      </div>

      {/* Providers */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>AI Providers</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Connect OpenAI-compatible providers</p>
          </div>
          <Button icon={<Plus size={14} />} size="sm" onClick={openCreate}>Add Provider</Button>
        </div>

        <div className="space-y-3">
          {loading
            ? Array.from({ length: 2 }).map((_, i) => <div key={i} className="shimmer h-24 rounded-xl" />)
            : providers.length === 0
            ? (
              <div
                className="rounded-xl p-6 text-center"
                style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
              >
                <Zap size={22} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No providers yet. Add one to enable agents.</p>
              </div>
            )
            : providers.map((p) => {
                const testResult = testResults[p.id];
                return (
                  <div
                    key={p.id}
                    className="rounded-xl p-4"
                    style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ background: "rgba(110,86,207,0.15)", border: "1px solid var(--border-bright)" }}
                        >
                          <Zap size={15} style={{ color: "var(--accent-light)" }} />
                        </div>
                        <div>
                          <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {p.providerType} · {p.defaultModel} · <span className="font-mono">{p.apiKey}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {testResult && testResult !== "loading" && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: testResult.success ? "var(--jade)" : "#ef4444" }}>
                            {testResult.success ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                            {testResult.success ? "OK" : "Failed"}
                          </span>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleTest(p.id)}
                          loading={testResult === "loading"}
                          icon={<Zap size={12} />}
                        >
                          Test
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)} icon={<Pencil size={12} />} />
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(p)} icon={<Trash2 size={12} />} />
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </section>

      {/* Agent Defaults */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Agent Model Defaults</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Set default provider + model per agent type</p>
        </div>

        <div className="space-y-2">
          {AGENT_TYPES.map((a) => {
            const f = agentForms[a] ?? { providerId: "", model: "" };
            const existing = defaults.find((d) => d.agentType === a);
            return (
              <div
                key={a}
                className="flex items-center gap-4 p-3 rounded-xl"
                style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
              >
                <div className="w-56 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{AGENT_LABELS[a]?.emoji ?? "🤖"}</span>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {AGENT_LABELS[a]?.label ?? a.replace(/_/g, " ")}
                    </p>
                  </div>
                  <p className="text-xs mt-0.5 ml-7" style={{ color: "var(--text-muted)" }}>
                    {AGENT_LABELS[a]?.description ?? ""}
                  </p>
                  {existing && (
                    <p className="text-xs mt-0.5 ml-7" style={{ color: "var(--accent-light)" }}>
                      {existing.providerName} · {existing.model}
                    </p>
                  )}
                </div>
                <Select
                  value={f.providerId}
                  onChange={(e) => setAgentForms((prev) => ({ ...prev, [a]: { ...f, providerId: e.target.value } }))}
                  options={providers.map((p) => ({ value: String(p.id), label: p.name }))}
                  placeholder="Provider"
                  style={{ flex: 1 }}
                />
                <input
                  value={f.model}
                  onChange={(e) => setAgentForms((prev) => ({ ...prev, [a]: { ...f, model: e.target.value } }))}
                  placeholder="e.g. gpt-4o"
                  style={{ flex: 1 }}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => saveAgentDefault(a)}
                  loading={savingAgent === a}
                  disabled={!f.providerId || !f.model}
                >
                  Save
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Provider modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProvider ? "Edit Provider" : "Add AI Provider"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.name || (!editProvider && !form.apiKey) || !form.defaultModel}>
              {editProvider ? "Save Changes" : "Add Provider"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Name" required>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="OpenAI Production" />
            </FormField>
            <FormField label="Type">
              <Select
                value={form.providerType}
                onChange={(e) => setForm({ ...form, providerType: e.target.value })}
                options={[{ value: "openai", label: "OpenAI" }, { value: "anthropic", label: "Anthropic" }, { value: "custom", label: "Custom" }]}
              />
            </FormField>
          </div>
          <FormField label={editProvider ? "API Key (leave blank to keep current)" : "API Key"} required={!editProvider}>
            <input type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder="sk-…" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Default Model" required>
              <input value={form.defaultModel} onChange={(e) => setForm({ ...form, defaultModel: e.target.value })} placeholder="gpt-4o" />
            </FormField>
            <FormField label="Base URL" hint="For custom/proxy endpoints">
              <input value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" />
            </FormField>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Provider"
        description={`Delete "${deleteTarget?.name}"? Any agents using this provider will lose their configuration.`}
      />

      {ToastEl}
    </div>
  );
}
