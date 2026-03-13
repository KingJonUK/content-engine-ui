"use client";

import { useEffect, useState } from "react";
import {
  getClients,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  getCampaigns,
  type Client,
  type ContentBrief,
  type Campaign,
  CONTENT_STATUSES,
  PLATFORMS,
  FUNNEL_STAGES,
  CONTENT_TYPES,
} from "@/lib/api";
import { Button, Modal, FormField, PageHeader, EmptyState, Badge, ConfirmModal, Select, useToast } from "@/components/ui";
import { FileText, Plus, Pencil, Trash2, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const EMPTY_FORM = {
  title: "",
  platform: "",
  contentType: "",
  funnelStage: "",
  status: "idea",
  hook: "",
  body: "",
  cta: "",
  angle: "",
  notes: "",
  campaignId: "",
};

export default function ContentPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [content, setContent] = useState<ContentBrief[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ContentBrief | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ContentBrief | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { show, ToastEl } = useToast();

  useEffect(() => { getClients().then((cs) => { setClients(cs); if (cs.length) setSelectedClient(cs[0].id); }); }, []);

  useEffect(() => {
    if (!selectedClient) return;
    setLoading(true);
    Promise.all([
      getContent(selectedClient, statusFilter ? { status: statusFilter } : undefined),
      getCampaigns(selectedClient),
    ]).then(([c, camps]) => { setContent(c); setCampaigns(camps); }).finally(() => setLoading(false));
  }, [selectedClient, statusFilter]);

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (item: ContentBrief) => {
    setEditItem(item);
    setForm({
      title: item.title, platform: item.platform, contentType: item.contentType,
      funnelStage: item.funnelStage, status: item.status, hook: item.hook ?? "",
      body: item.body ?? "", cta: item.cta ?? "", angle: item.angle ?? "",
      notes: item.notes ?? "", campaignId: item.campaignId ? String(item.campaignId) : "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !selectedClient) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        campaignId: form.campaignId ? Number(form.campaignId) : null,
      };
      if (editItem) {
        await updateContent(editItem.id, payload);
        show("Content updated");
      } else {
        await createContent(selectedClient, payload);
        show("Content created");
      }
      setModalOpen(false);
      const updated = await getContent(selectedClient, statusFilter ? { status: statusFilter } : undefined);
      setContent(updated);
    } catch (e: any) {
      show(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !selectedClient) return;
    setDeleting(true);
    try {
      await deleteContent(deleteTarget.id);
      show("Content deleted");
      setDeleteTarget(null);
      const updated = await getContent(selectedClient);
      setContent(updated);
    } catch (e: any) {
      show(e.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const grouped = CONTENT_STATUSES.reduce<Record<string, ContentBrief[]>>((acc, s) => {
    acc[s] = content.filter((c) => c.status === s);
    return acc;
  }, {} as Record<string, ContentBrief[]>);

  return (
    <div className="p-8 max-w-full animate-fade-up">
      <PageHeader
        title="Content"
        subtitle="Track and manage all content briefs"
        action={
          <div className="flex items-center gap-3">
            {clients.length > 1 && (
              <Select
                value={String(selectedClient ?? "")}
                onChange={(e) => setSelectedClient(Number(e.target.value))}
                options={clients.map((c) => ({ value: String(c.id), label: c.name }))}
                style={{ width: 180 }}
              />
            )}
            <Button icon={<Plus size={15} />} onClick={openCreate} disabled={!selectedClient}>
              New Content
            </Button>
          </div>
        }
      />

      {/* Status filter */}
      <div className="flex items-center gap-2 mb-6">
        <Filter size={13} style={{ color: "var(--text-muted)" }} />
        {["", ...CONTENT_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: statusFilter === s ? "var(--accent)" : "var(--surface-raised)",
              color: statusFilter === s ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            {s === "" ? "All" : s}
          </button>
        ))}
      </div>

      {/* Kanban columns (hidden when filter is active) */}
      {!statusFilter ? (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
          {CONTENT_STATUSES.map((status) => (
            <div
              key={status}
              className="flex-shrink-0 w-64 rounded-xl p-3"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <Badge status={status} />
                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  {grouped[status]?.length ?? 0}
                </span>
              </div>
              <div className="space-y-2">
                {loading
                  ? Array.from({ length: 2 }).map((_, i) => <div key={i} className="shimmer h-20 rounded-lg" />)
                  : grouped[status]?.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg group cursor-pointer transition-all hover:-translate-y-0.5"
                        style={{ background: "var(--surface-overlay)", border: "1px solid var(--border)" }}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-sm font-medium leading-tight flex-1" style={{ color: "var(--text-primary)" }}>
                            {item.title}
                          </p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={() => openEdit(item)} style={{ color: "var(--text-muted)" }}>
                              <Pencil size={11} />
                            </button>
                            <button onClick={() => setDeleteTarget(item)} style={{ color: "var(--text-muted)" }}>
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                          {item.platform} · {item.contentType}
                        </p>
                        {item.qualityScore && (
                          <p className="text-xs mt-1 font-mono" style={{ color: "var(--jade)" }}>
                            Score: {item.qualityScore}/100
                          </p>
                        )}
                      </div>
                    ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Filtered list view */
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-16 rounded-xl" />)
            : content.length === 0
            ? (
              <EmptyState icon={FileText} title="No content matches this filter" />
            )
            : content.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-xl group transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {item.platform} · {item.contentType} · {item.funnelStage}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge status={item.status} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-surface-overlay" style={{ color: "var(--text-muted)" }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded hover:bg-surface-overlay" style={{ color: "var(--text-muted)" }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? "Edit Content Brief" : "New Content Brief"}
        width={640}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.title.trim()}>
              {editItem ? "Save Changes" : "Create"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Title" required>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Content title…" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Platform" required>
              <Select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                options={PLATFORMS.map((p) => ({ value: p, label: p }))}
                placeholder="Select platform"
              />
            </FormField>
            <FormField label="Content Type" required>
              <Select
                value={form.contentType}
                onChange={(e) => setForm({ ...form, contentType: e.target.value })}
                options={CONTENT_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ") }))}
                placeholder="Select type"
              />
            </FormField>
            <FormField label="Funnel Stage" required>
              <Select
                value={form.funnelStage}
                onChange={(e) => setForm({ ...form, funnelStage: e.target.value })}
                options={FUNNEL_STAGES.map((f) => ({ value: f, label: f }))}
                placeholder="Select stage"
              />
            </FormField>
            <FormField label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                options={CONTENT_STATUSES.map((s) => ({ value: s, label: s }))}
              />
            </FormField>
          </div>
          {campaigns.length > 0 && (
            <FormField label="Campaign">
              <Select
                value={form.campaignId}
                onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
                options={campaigns.map((c) => ({ value: String(c.id), label: c.name }))}
                placeholder="No campaign"
              />
            </FormField>
          )}
          <FormField label="Hook / Opening">
            <textarea rows={2} value={form.hook} onChange={(e) => setForm({ ...form, hook: e.target.value })} placeholder="The opening hook…" />
          </FormField>
          <FormField label="Body">
            <textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Main body content…" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="CTA">
              <input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} placeholder="Call to action…" />
            </FormField>
            <FormField label="Angle">
              <input value={form.angle} onChange={(e) => setForm({ ...form, angle: e.target.value })} placeholder="Content angle…" />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes…" />
          </FormField>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Content Brief"
        description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
      />

      {ToastEl}
    </div>
  );
}
