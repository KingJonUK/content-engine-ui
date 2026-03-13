"use client";

import { useEffect, useState } from "react";
import { getClients, createClient, updateClient, deleteClient, type Client } from "@/lib/api";
import { Button, Modal, FormField, PageHeader, EmptyState, ConfirmModal, Badge, useToast } from "@/components/ui";
import { Users, Plus, Pencil, Trash2, Globe, Mail, Building2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const EMPTY_CLIENT = { name: "", email: "", website: "", industry: "", notes: "" };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [form, setForm] = useState(EMPTY_CLIENT);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { show, ToastEl } = useToast();

  const load = () => getClients().then(setClients).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditClient(null);
    setForm(EMPTY_CLIENT);
    setModalOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditClient(c);
    setForm({ name: c.name, email: c.email ?? "", website: c.website ?? "", industry: c.industry ?? "", notes: c.notes ?? "" });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editClient) {
        await updateClient(editClient.id, form);
        show("Client updated");
      } else {
        await createClient(form);
        show("Client created");
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      show(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteClient(deleteTarget.id);
      show("Client deleted");
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      show(e.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-up">
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} client${clients.length !== 1 ? "s" : ""}`}
        action={
          <Button icon={<Plus size={15} />} onClick={openCreate}>
            Add Client
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer h-40 rounded-xl" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start managing their content"
          action={<Button icon={<Plus size={15} />} onClick={openCreate}>Add Client</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <div
              key={c.id}
              className="rounded-xl p-5 group transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                  style={{ background: "rgba(110,86,207,0.2)", color: "var(--accent-light)" }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-surface-overlay"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(c)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-surface-overlay"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <Link href={`/admin/clients/${c.id}`}>
                <h3 className="font-semibold text-base mb-1 hover:underline" style={{ color: "var(--text-primary)" }}>
                  {c.name}
                </h3>
              </Link>

              <div className="space-y-1">
                {c.email && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Mail size={11} /> {c.email}
                  </div>
                )}
                {c.website && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Globe size={11} /> {c.website}
                  </div>
                )}
                {c.industry && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Building2 size={11} /> {c.industry}
                  </div>
                )}
              </div>

              <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                Added {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editClient ? "Edit Client" : "New Client"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.name.trim()}>
              {editClient ? "Save Changes" : "Create Client"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Name" required>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Acme Corp"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="hello@acme.com"
              />
            </FormField>
            <FormField label="Industry">
              <input
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="SaaS, Finance…"
              />
            </FormField>
          </div>
          <FormField label="Website">
            <input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://acme.com"
            />
          </FormField>
          <FormField label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Any internal notes about this client…"
            />
          </FormField>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Client"
        description={`This will permanently delete "${deleteTarget?.name}" and all their campaigns, content, and agent runs. This cannot be undone.`}
      />

      {ToastEl}
    </div>
  );
}
