"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getClient, updateClient, getBrandProfile, upsertBrandProfile,
  type Client, type BrandProfile,
} from "@/lib/api";
import { Button, FormField, PageHeader, useToast } from "@/components/ui";
import {
  ArrowLeft, Save, Palette, Type, Link2, Building2,
  Globe, Mail, CheckCircle2,
} from "lucide-react";

type Tab = "overview" | "brand-voice" | "brand-identity";

const EMPTY_BRAND: Partial<BrandProfile> = {
  tone: "", voiceRules: "", bannedPhrases: "", vocabulary: "",
  ctaStyle: "", icpDescription: "", painPoints: "", transformation: "",
  proofPoints: "", contentPillars: "", platforms: "",
  primaryColor: "#000000", secondaryColor: "#ffffff", accentColor: "#0066cc",
  fontPrimary: "", fontSecondary: "", brandLogoUrl: "",
};

function ColorSwatch({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </label>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ position: "relative", width: 44, height: 44, borderRadius: 10, overflow: "hidden", border: "2px solid var(--border)", cursor: "pointer", flexShrink: 0 }}>
          <input
            type="color"
            value={value || "#000000"}
            onChange={e => onChange(e.target.value)}
            style={{ position: "absolute", inset: -8, width: "calc(100% + 16px)", height: "calc(100% + 16px)", cursor: "pointer", border: "none", padding: 0, opacity: 1 }}
          />
          <div style={{ position: "absolute", inset: 0, backgroundColor: value || "#000000", pointerEvents: "none" }} />
        </div>
        <input
          type="text"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder="#000000"
          maxLength={7}
          style={{
            flex: 1, background: "var(--surface-raised)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)",
            fontFamily: "monospace", fontSize: 13, outline: "none",
          }}
        />
      </div>
    </div>
  );
}

function FontPreview({ primary, secondary }: { primary: string; secondary: string }) {
  if (!primary && !secondary) return null;
  return (
    <div style={{ marginTop: 16, padding: "16px 20px", background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 12 }}>
      <p style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Preview</p>
      {primary && (
        <p style={{ fontFamily: primary, fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
          The quick brown fox — {primary}
        </p>
      )}
      {secondary && (
        <p style={{ fontFamily: secondary, fontSize: 15, color: "var(--text-secondary)" }}>
          Jumps over the lazy dog — {secondary}
        </p>
      )}
    </div>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = Number(params.id);
  const { show, ToastEl } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [brand, setBrand] = useState<Partial<BrandProfile>>(EMPTY_BRAND);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("brand-voice");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, b] = await Promise.all([
        getClient(clientId),
        getBrandProfile(clientId).catch(() => null),
      ]);
      setClient(c);
      if (b) setBrand({ ...EMPTY_BRAND, ...b });
    } catch (e: any) {
      show(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const handleSaveBrand = async () => {
    setSaving(true);
    try {
      await upsertBrandProfile(clientId, brand);
      setSaved(true);
      show("Brand profile saved");
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      show(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof BrandProfile) => (val: string) => setBrand(b => ({ ...b, [key]: val }));
  const field = (key: keyof BrandProfile) => ({
    value: (brand[key] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key)(e.target.value),
  });

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Building2 size={14} /> },
    { id: "brand-voice", label: "Brand Voice", icon: <Type size={14} /> },
    { id: "brand-identity", label: "Brand Identity", icon: <Palette size={14} /> },
  ];

  if (loading) return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="shimmer h-10 w-48 rounded-xl mb-8" />
      <div className="shimmer h-96 rounded-2xl" />
    </div>
  );

  if (!client) return (
    <div className="p-8 max-w-5xl mx-auto">
      <p style={{ color: "var(--text-muted)" }}>Client not found.</p>
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-up">
      {ToastEl}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => router.push("/admin/clients")}
          style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 16 }}
        >
          <ArrowLeft size={14} /> Back to Clients
        </button>
        <PageHeader
          title={client.name}
          subtitle={client.industry}
          action={
            tab !== "overview" ? (
              <Button
                icon={saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
                onClick={handleSaveBrand}
                disabled={saving}
              >
                {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
              </Button>
            ) : undefined
          }
        />
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "var(--surface-raised)", padding: 4, borderRadius: 12, width: "fit-content", border: "1px solid var(--border)" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 16px",
              borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
              background: tab === t.id ? "var(--surface-overlay)" : "transparent",
              color: tab === t.id ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
              transition: "all 0.15s",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            <h3 style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Client Details</h3>
            <div style={{ display: "grid", gap: 14 }}>
              {[
                { icon: <Building2 size={15} />, label: "Industry", value: client.industry },
                { icon: <Globe size={15} />, label: "Website", value: client.website },
                { icon: <Mail size={15} />, label: "Contact Email", value: client.contactEmail },
                { icon: <Building2 size={15} />, label: "Status", value: client.status },
              ].map(row => row.value ? (
                <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: "var(--text-muted)" }}>{row.icon}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: 13, width: 100, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ color: "var(--text-primary)", fontSize: 14 }}>{row.value}</span>
                </div>
              ) : null)}
            </div>
          </div>
          {/* Brand Identity preview strip */}
          {(brand.primaryColor || brand.secondaryColor || brand.accentColor) && (
            <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <h3 style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Brand Colours</h3>
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { label: "Primary", val: brand.primaryColor },
                  { label: "Secondary", val: brand.secondaryColor },
                  { label: "Accent", val: brand.accentColor },
                ].map(c => c.val ? (
                  <div key={c.label} style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: c.val, border: "2px solid var(--border)" }} />
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.label}</span>
                  </div>
                ) : null)}
              </div>
              {brand.fontPrimary && (
                <p style={{ marginTop: 16, color: "var(--text-secondary)", fontSize: 13 }}>
                  Fonts: <strong style={{ color: "var(--text-primary)" }}>{brand.fontPrimary}</strong>
                  {brand.fontSecondary && <> / {brand.fontSecondary}</>}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Brand Voice Tab */}
      {tab === "brand-voice" && (
        <div style={{ display: "grid", gap: 20 }}>
          <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, display: "grid", gap: 18 }}>
            <h3 style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 600 }}>Voice & Tone</h3>
            <FormField label="Brand Voice / Tone" hint="e.g. Bold, empathetic, no-fluff">
              <input type="text" {...field("tone")} placeholder="e.g. Confident but approachable, direct without being aggressive" style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 14, outline: "none" }} />
            </FormField>
            <FormField label="Voice Rules" hint="Rules for how the brand speaks">
              <textarea {...field("voiceRules")} rows={3} placeholder="e.g. Always use second person. Never use passive voice. Lead with the outcome." style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 14, outline: "none", resize: "vertical" }} />
            </FormField>
            <FormField label="Banned Phrases" hint="Words or phrases to never use">
              <textarea {...field("bannedPhrases")} rows={2} placeholder="e.g. synergy, game-changer, unlock your potential" style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 14, outline: "none", resize: "vertical" }} />
            </FormField>
            <FormField label="Preferred Vocabulary" hint="Words and phrases the brand uses">
              <textarea {...field("vocabulary")} rows={2} placeholder="e.g. proven, results, clarity, operators, practitioners" style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 14, outline: "none", resize: "vertical" }} />
            </FormField>
            <FormField label="CTA Style" hint="How calls to action should be written">
              <input type="text" {...field("ctaStyle")} placeholder="e.g. Direct action verbs. Benefit-led. No 'click here'." style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 14, outline: "none" }} />
            </FormField>
          </div>

          <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, display: "grid", gap: 18 }}>
            <h3 style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 600 }}>Audience & Positioning</h3>
            <FormField label="Ideal Customer Profile" hint="Who this brand is talking to">
              <textarea {...field("icpDescription")} rows={3} placeholder="e.g. L&D managers at mid-market companies (200–2000 employees) who need to upskill teams quickly but have limited budget." style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 14, outline: "none", resize: "vertical" }} />
            </FormField>
            <FormField label="Pain Points" hint="What keeps the ICP up at night">
              <textarea {...field("painPoints")} rows={3} placeholder="e.g. Training that doesn't stick. Hard to prove ROI. Learners don't complete courses." style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 14, outline: "none", resize: "vertical" }} />
            </FormField>
            <FormField label="Transformation" hint="The before/after this brand delivers">
              <textarea {...field("transformation")} rows={2} placeholder="e.g. From: scattered, unengaged teams. To: certified, confident professionals who actually apply what they learn." style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 14, outline: "none", resize: "vertical" }} />
            </FormField>
            <FormField label="Proof Points" hint="Stats, credentials, or social proof">
              <textarea {...field("proofPoints")} rows={2} placeholder="e.g. 94% completion rate. 500+ companies trained. ISO-accredited content." style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 14, outline: "none", resize: "vertical" }} />
            </FormField>
            <FormField label="Content Pillars" hint="The core themes all content maps to">
              <textarea {...field("contentPillars")} rows={2} placeholder="e.g. 1. Learning science  2. Team performance  3. L&D ROI  4. Industry insights" style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 14, outline: "none", resize: "vertical" }} />
            </FormField>
            <FormField label="Preferred Platforms" hint="Where this brand publishes">
              <input type="text" {...field("platforms")} placeholder="e.g. LinkedIn, Email newsletter, YouTube" style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 14, outline: "none" }} />
            </FormField>
          </div>
        </div>
      )}

      {/* Brand Identity Tab */}
      {tab === "brand-identity" && (
        <div style={{ display: "grid", gap: 20 }}>
          {/* Colours */}
          <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Palette size={16} style={{ color: "var(--accent)" }} />
              <h3 style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 600 }}>Brand Colours</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              <ColorSwatch label="Primary" value={brand.primaryColor || "#000000"} onChange={set("primaryColor")} />
              <ColorSwatch label="Secondary" value={brand.secondaryColor || "#ffffff"} onChange={set("secondaryColor")} />
              <ColorSwatch label="Accent" value={brand.accentColor || "#0066cc"} onChange={set("accentColor")} />
            </div>
            {/* Palette preview */}
            <div style={{ marginTop: 20, display: "flex", height: 40, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
              <div style={{ flex: 1, background: brand.primaryColor || "#000000" }} title="Primary" />
              <div style={{ flex: 1, background: brand.secondaryColor || "#ffffff" }} title="Secondary" />
              <div style={{ flex: 1, background: brand.accentColor || "#0066cc" }} title="Accent" />
            </div>
          </div>

          {/* Typography */}
          <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Type size={16} style={{ color: "var(--accent)" }} />
              <h3 style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 600 }}>Typography</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormField label="Primary Font" hint="Headings & display text">
                <input
                  type="text"
                  value={brand.fontPrimary || ""}
                  onChange={e => set("fontPrimary")(e.target.value)}
                  placeholder="e.g. Inter, Geist, Playfair Display"
                  style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 14, outline: "none", fontFamily: brand.fontPrimary || "inherit" }}
                />
              </FormField>
              <FormField label="Secondary Font" hint="Body & supporting text">
                <input
                  type="text"
                  value={brand.fontSecondary || ""}
                  onChange={e => set("fontSecondary")(e.target.value)}
                  placeholder="e.g. DM Sans, Lato, Georgia"
                  style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 14, outline: "none", fontFamily: brand.fontSecondary || "inherit" }}
                />
              </FormField>
            </div>
            <FontPreview primary={brand.fontPrimary || ""} secondary={brand.fontSecondary || ""} />
          </div>

          {/* Logo */}
          <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Link2 size={16} style={{ color: "var(--accent)" }} />
              <h3 style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 600 }}>Logo</h3>
            </div>
            <FormField label="Logo URL" hint="Direct link to logo image (PNG, SVG, WebP)">
              <input
                type="url"
                value={brand.brandLogoUrl || ""}
                onChange={e => set("brandLogoUrl")(e.target.value)}
                placeholder="https://your-cdn.com/logo.png"
                style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 14, outline: "none" }}
              />
            </FormField>
            {brand.brandLogoUrl && (
              <div style={{ marginTop: 16, padding: 20, background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Preview</p>
                <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
                  {/* On light */}
                  <div style={{ padding: 20, background: "#ffffff", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                    <img src={brand.brandLogoUrl} alt="Logo preview" style={{ maxHeight: 60, maxWidth: 180, objectFit: "contain" }} />
                    <p style={{ marginTop: 8, fontSize: 10, color: "#9ca3af", textAlign: "center" }}>Light</p>
                  </div>
                  {/* On primary */}
                  <div style={{ padding: 20, background: brand.primaryColor || "#000000", borderRadius: 10, border: "1px solid var(--border)" }}>
                    <img src={brand.brandLogoUrl} alt="Logo preview" style={{ maxHeight: 60, maxWidth: 180, objectFit: "contain" }} />
                    <p style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>Primary</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
