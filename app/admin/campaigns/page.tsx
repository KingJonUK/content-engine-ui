"use client";

import { useEffect, useState } from "react";
import {
  getClients,
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  type Client,
  type Campaign,
  CAMPAIGN_STATUSES,
} from "@/lib/api";
import { Button, Modal, FormField, PageHeader, EmptyState, Badge, ConfirmModal, Select, useToast } from "@/components/ui";
import { Megaphone, Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

const EMPTY_FORM = { name: "", description: "", status: "draft", startDate: "", endDate: "", goals: "", platforms: "" };

export default function CampaignsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Campaign | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { show, ToastEl } = useToast();

  useEffect(() => {
    getClients().then((cs) => { setClients(cs); if (cs.length) setSelectedClient(cs[0].id); });
  }, []);

  useEffect(() => {
    if (!selectedClient) return;
    setLoading(true);
    getCampaigns(selectedClient).then(setCampaigns).finally(() => setLoading(false));
  }, [selectedClient]);

  const openCreate = () => { setEditItem(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (c: Campaign) => {
    setEditItem(c);
    setForm({
      name: c.name, description: c.description ?? "", status: c.status,
      startDate: c.startDate ? c.startDate.slice(0, 10) : "",
      endDate: c.endDate ? c.endDate.slice(0, 10) : "",
      goals: c.goals ?? "", platforms: c.platforms ?? "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !selectedClient) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateCampaign(editItem.id, form);
        show("Campaign updated");
      } else {
        await createCampaign(selectedClient, form);
        show("Campaign created");
      }
      setModalOpen(false);
      getCampaigns(selectedClient).then(setCampaigns);
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
      await deleteCampaign(deleteTarget.id);
      show("Campaign deleted");
      setDeleteTarget(null);
      getCampaigns(selectedClient).then(setCampaigns);
    } catch (e: any) {
      show(e.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-up">
      <PageHeader
        title="Campaigns"
        subtitle="Organise your content into focused campaigns"
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
            <Button icon={<Plus size={15} />} onClick={openCreate} disabled={!selectedClient}>New Campaign</Button>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-44 rounded-xl" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="Create a campaign to group related content"
          action={<Button icon={<Plus size={15} />} onClick={openCreate}>New Campaign</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="rounded-xl p-5 group transition-all hover:-translate-y-0.5"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <Badge status={c.status} />
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-surface-overlay" style={{ color: "var(--text-muted)" }}><Pencil size={13} /></button>
                  <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded hover:bg-surface-overlay" style={{ color: "var(--text-muted)" }}><Trash2 size={13} /></button>
                </div>
              </div>
              <h3 className="font-semibold text-base mb-1" style={{ color: "var(--text-primary)" }}>{c.name}</h3>
              {c.description && <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--text-secondary)" }}>{c.description}</p>}
              <div className="space-y-1">
                {(c.startDate || c.endDate) && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Calendar size={11} />
                    {c.startDate ? format(new Date(c.startDate), "d MMM yy") : "—"}
                    {" → "}
                    {c.endDate ? format(new Date(c.endDate), "d MMM yy") : "ongoing"}
                  </div>
                )}
                {c.platforms && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Platforms: {c.platforms}</p>
                )}
              </div>
              <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? "Edit Campaign" : "New Campaign"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.name.trim()}>{editItem ? "Save" : "Create"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Name" required>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Q2 Launch Campaign" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                options={CAMPAIGN_STATUSES.map((s) => ({ value: s, label: s }))} />
            </FormField>
            <FormField label="Platforms">
              <input value={form.platforms} onChange={(e) => setForm({ ...form, platforms: e.target.value })} placeholder="LinkedIn, Twitter" />
            </FormField>
            <FormField label="Start Date">
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </FormField>
            <FormField label="End Date">
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Description">
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this campaign about?" />
          </FormField>
          <FormField label="Goals">
            <textarea rows={2} value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} placeholder="Campaign goals and KPIs…" />
          </FormField>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Campaign"
        description={`Delete "${deleteTarget?.name}"? Content briefs linked to this campaign won't be deleted but will lose their campaign association.`}
      />

      {ToastEl}
    </div>
  );
}
