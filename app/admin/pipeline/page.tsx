"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  getClients,
  runPipelineStream,
  OUTPUT_TYPES,
  type Client,
  type PipelineStageEvent,
} from "@/lib/api";
import { Button, FormField, PageHeader, Select, useToast } from "@/components/ui";
import {
  Play, Square, Copy, Check, ChevronDown, ChevronUp,
  Workflow, Loader2, CheckCircle2, XCircle, Clock,
  Zap, FileText, RotateCcw, Info,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type StageStatus = "idle" | "waiting" | "running" | "completed" | "failed";

interface StageState {
  agentType: string;
  status: StageStatus;
  output: string;
  streamBuffer: string;
}

type PipelineStatus = "idle" | "running" | "complete" | "error";

const AGENT_LABELS: Record<string, string> = {
  strategy:           "Strategy",
  research:           "Research",
  angle:              "Angle",
  hook:               "Hook",
  copywriter:         "Copywriter",
  cta:                "CTA",
  qa:                 "QA / Editor",
  creative_direction: "Creative Direction",
  repurpose:          "Repurpose",
};

const AGENT_DESCRIPTIONS: Record<string, string> = {
  strategy:           "Defines messaging objective & campaign direction",
  research:           "Surfaces audience insights & pain points",
  angle:              "Selects the strongest content angle",
  hook:               "Writes scroll-stopping opening lines",
  copywriter:         "Writes complete platform-native copy",
  cta:                "Crafts brand-aligned calls-to-action",
  qa:                 "Reviews, scores & approves content",
  creative_direction: "Defines visual treatment & layout",
  repurpose:          "Transforms content for every platform",
};

// ── Stage Icon ────────────────────────────────────────────────────────────────

function StageIcon({ status }: { status: StageStatus }) {
  if (status === "running") return <Loader2 size={15} className="animate-spin" style={{ color: "var(--gold)" }} />;
  if (status === "completed") return <CheckCircle2 size={15} style={{ color: "var(--jade)" }} />;
  if (status === "failed") return <XCircle size={15} style={{ color: "#ef4444" }} />;
  if (status === "waiting") return <Clock size={15} style={{ color: "var(--text-muted)", opacity: 0.5 }} />;
  return <div className="w-3.5 h-3.5 rounded-full" style={{ border: "1.5px solid var(--border)", opacity: 0.4 }} />;
}

// ── Stage Node ────────────────────────────────────────────────────────────────

function StageNode({
  stage, index, total, expanded, onToggle,
}: {
  stage: StageState;
  index: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isLast = index === total - 1;
  const hasContent = stage.output || stage.streamBuffer;

  const borderColor =
    stage.status === "running"    ? "var(--gold)" :
    stage.status === "completed"  ? "var(--jade)" :
    stage.status === "failed"     ? "#ef4444"     :
    stage.status === "waiting"    ? "var(--border)" :
    "var(--border)";

  const bgOpacity =
    stage.status === "running"   ? "rgba(240,180,41,0.05)" :
    stage.status === "completed" ? "rgba(45,212,191,0.04)" :
    stage.status === "failed"    ? "rgba(239,68,68,0.05)"  :
    "transparent";

  return (
    <div className="flex gap-3">
      {/* Connector column */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 28 }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: bgOpacity,
            border: `1.5px solid ${borderColor}`,
            transition: "all 0.3s",
          }}>
          <StageIcon status={stage.status} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 mt-1"
            style={{ background: stage.status === "completed" ? "var(--jade)" : "var(--border)", opacity: stage.status === "completed" ? 0.5 : 0.3, minHeight: 16 }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-3">
        <div
          className="rounded-xl overflow-hidden transition-all"
          style={{ border: `1px solid ${stage.status === "idle" ? "var(--border)" : borderColor}`, background: bgOpacity, opacity: stage.status === "idle" ? 0.4 : 1 }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ cursor: hasContent ? "pointer" : "default" }}
            onClick={() => hasContent && onToggle()}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {AGENT_LABELS[stage.agentType] || stage.agentType.replace(/_/g," ")}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {AGENT_DESCRIPTIONS[stage.agentType] || ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {stage.status === "running" && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(240,180,41,0.15)", color: "var(--gold)" }}>
                  Generating…
                </span>
              )}
              {stage.status === "completed" && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(45,212,191,0.1)", color: "var(--jade)" }}>
                  Done
                </span>
              )}
              {hasContent && (
                expanded ? <ChevronUp size={13} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={13} style={{ color: "var(--text-muted)" }} />
              )}
            </div>
          </div>

          {/* Live stream + output */}
          {expanded && (stage.streamBuffer || stage.output) && (
            <div className="px-4 pb-4 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
              <div
                className="font-mono text-xs rounded-lg p-3 overflow-y-auto whitespace-pre-wrap"
                style={{
                  background: "var(--ink)",
                  color: "var(--text-secondary)",
                  maxHeight: 300,
                  wordBreak: "break-word",
                  lineHeight: "1.6",
                }}
              >
                {stage.output || stage.streamBuffer}
                {stage.status === "running" && (
                  <span className="inline-block w-1.5 h-3.5 ml-0.5 rounded-sm align-middle"
                    style={{ background: "var(--accent)", animation: "pulse 1s infinite" }} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Copy Button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={{ background: "var(--surface-overlay)", border: "1px solid var(--border-bright)", color: "var(--text-secondary)" }}>
      {copied ? <Check size={12} style={{ color: "var(--jade)" }} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [selectedOutputType, setSelectedOutputType] = useState<string>("linkedin_post");
  const [brief, setBrief] = useState("");
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>("idle");
  const [stages, setStages] = useState<StageState[]>([]);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [finalOutput, setFinalOutput] = useState("");
  const [contentBriefId, setContentBriefId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const { show, ToastEl } = useToast();

  const selectedType = OUTPUT_TYPES.find((t) => t.key === selectedOutputType);

  useEffect(() => {
    getClients().then((cs) => {
      setClients(cs);
      if (cs.length) setSelectedClient(cs[0].id);
    });
  }, []);

  const toggleStage = (agentType: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      next.has(agentType) ? next.delete(agentType) : next.add(agentType);
      return next;
    });
  };

  const handleRun = useCallback(() => {
    if (!selectedClient || !selectedOutputType) return;

    const outputDef = OUTPUT_TYPES.find((t) => t.key === selectedOutputType);
    if (!outputDef) return;

    // Init stages as idle
    const initStages: StageState[] = outputDef.agents.map((a) => ({
      agentType: a, status: "idle", output: "", streamBuffer: "",
    }));
    setStages(initStages);
    setExpandedStages(new Set());
    setFinalOutput("");
    setContentBriefId(null);
    setError(null);
    setPipelineStatus("running");

    const abort = runPipelineStream(
      { clientId: selectedClient, outputType: selectedOutputType, brief },
      (event: PipelineStageEvent) => {
        if (event.type === "pipeline_start") {
          // Mark all as waiting
          setStages((prev) => prev.map((s) => ({ ...s, status: "waiting" })));
        }

        if (event.type === "stage_update" && event.stage) {
          setStages((prev) =>
            prev.map((s) =>
              s.agentType === event.stage
                ? { ...s, status: event.status as StageStatus, output: event.status === "completed" ? (event.content || s.streamBuffer) : s.output, streamBuffer: event.status === "completed" ? "" : s.streamBuffer }
                : s
            )
          );
          // Auto-expand running stage
          if (event.status === "running") {
            setExpandedStages((prev) => new Set([...prev, event.stage!]));
          }
        }

        if (event.type === "stage_chunk" && event.stage) {
          setStages((prev) =>
            prev.map((s) =>
              s.agentType === event.stage
                ? { ...s, streamBuffer: s.streamBuffer + (event.content || "") }
                : s
            )
          );
        }
      },
      (briefId, output) => {
        setPipelineStatus("complete");
        setFinalOutput(output);
        setContentBriefId(briefId);
        show("Pipeline complete! Content saved to drafts.");
        abortRef.current = null;
      },
      (msg) => {
        setPipelineStatus("error");
        setError(msg);
        show(msg, "error");
        abortRef.current = null;
      }
    );

    abortRef.current = abort;
  }, [selectedClient, selectedOutputType, brief, show]);

  const handleStop = () => {
    abortRef.current?.();
    abortRef.current = null;
    setPipelineStatus("error");
    setError("Pipeline stopped by user.");
  };

  const handleReset = () => {
    setPipelineStatus("idle");
    setStages([]);
    setFinalOutput("");
    setContentBriefId(null);
    setError(null);
    setBrief("");
  };

  const isRunning = pipelineStatus === "running";
  const completedStages = stages.filter((s) => s.status === "completed").length;
  const progress = stages.length > 0 ? (completedStages / stages.length) * 100 : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-up">
      <PageHeader
        title="AI Pipeline"
        subtitle="Select a client and output type, then press Run to generate fully branded content automatically."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">

        {/* ── LEFT PANEL: Controls ─────────────────────────────────── */}
        <div className="space-y-5">

          {/* Client + Brief */}
          <div className="rounded-xl p-5 space-y-4"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
              Configuration
            </h2>

            <FormField label="Client" required>
              <Select
                value={String(selectedClient ?? "")}
                onChange={(e) => setSelectedClient(Number(e.target.value))}
                options={clients.map((c) => ({ value: String(c.id), label: c.name }))}
                placeholder="Select client…"
                disabled={isRunning}
              />
            </FormField>

            {clients.length === 0 && (
              <p className="text-xs rounded-lg px-3 py-2"
                style={{ background: "rgba(240,180,41,0.08)", border: "1px solid rgba(240,180,41,0.2)", color: "var(--gold)" }}>
                No clients found. Add a client and brand profile first.
              </p>
            )}

            <FormField label="Brief (optional)" hint="Additional context or specific instructions for the agents">
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={3}
                disabled={isRunning}
                placeholder="e.g. Focus on our new product launch, target decision-makers in finance…"
                style={{ resize: "none" }}
              />
            </FormField>
          </div>

          {/* Output Type Cards */}
          <div className="rounded-xl p-5 space-y-3"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
              Output Type
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {OUTPUT_TYPES.map((type) => {
                const isSelected = selectedOutputType === type.key;
                return (
                  <button
                    key={type.key}
                    onClick={() => !isRunning && setSelectedOutputType(type.key)}
                    disabled={isRunning}
                    className="rounded-xl p-3 text-left transition-all"
                    style={{
                      background: isSelected ? `${type.color}18` : "var(--surface-overlay)",
                      border: `1.5px solid ${isSelected ? type.color : "var(--border)"}`,
                      opacity: isRunning && !isSelected ? 0.4 : 1,
                    }}
                  >
                    <div className="text-lg mb-1">{type.emoji}</div>
                    <div className="text-xs font-semibold leading-tight" style={{ color: isSelected ? type.color : "var(--text-primary)" }}>
                      {type.label}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {type.agents.length} agents
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected pipeline preview */}
            {selectedType && (
              <div className="rounded-lg px-3 py-2 mt-1"
                style={{ background: "var(--surface-overlay)", border: "1px solid var(--border)" }}>
                <div className="flex flex-wrap gap-1">
                  {selectedType.agents.map((a, i) => (
                    <span key={a}>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ background: `${selectedType.color}18`, color: selectedType.color }}>
                        {AGENT_LABELS[a] || a}
                      </span>
                      {i < selectedType.agents.length - 1 && (
                        <span className="text-xs mx-0.5" style={{ color: "var(--text-muted)" }}>→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Run / Stop / Reset buttons */}
          <div className="space-y-2">
            {!isRunning && pipelineStatus !== "complete" && pipelineStatus !== "error" && (
              <Button
                onClick={handleRun}
                disabled={!selectedClient || clients.length === 0}
                icon={<Play size={14} />}
                className="w-full justify-center"
                size="lg"
              >
                Run Pipeline
              </Button>
            )}

            {isRunning && (
              <>
                {/* Progress bar */}
                <div className="rounded-full overflow-hidden h-1.5" style={{ background: "var(--surface-overlay)" }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, background: "var(--accent)" }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Stage {completedStages + 1} of {stages.length}
                  </span>
                  <span className="text-xs font-mono" style={{ color: "var(--accent-light)" }}>
                    {Math.round(progress)}%
                  </span>
                </div>
                <Button
                  onClick={handleStop}
                  variant="danger"
                  icon={<Square size={14} />}
                  className="w-full justify-center"
                >
                  Stop Pipeline
                </Button>
              </>
            )}

            {(pipelineStatus === "complete" || pipelineStatus === "error") && (
              <Button
                onClick={handleReset}
                variant="secondary"
                icon={<RotateCcw size={14} />}
                className="w-full justify-center"
              >
                Run Again
              </Button>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="rounded-xl px-4 py-3 flex items-start gap-2"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
              <XCircle size={14} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs">{error}</p>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Pipeline Visualiser + Output ─────────────── */}
        <div className="space-y-5">

          {/* Idle state */}
          {pipelineStatus === "idle" && (
            <div className="rounded-xl flex flex-col items-center justify-center py-24"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(110,86,207,0.1)", border: "1px solid var(--border-bright)" }}>
                <Workflow size={28} style={{ color: "var(--accent-light)" }} />
              </div>
              <p className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                Ready to run
              </p>
              <p className="text-sm text-center max-w-xs" style={{ color: "var(--text-muted)" }}>
                Select a client and output type on the left, then press Run Pipeline.
              </p>
            </div>
          )}

          {/* Live pipeline visualiser */}
          {stages.length > 0 && (
            <div className="rounded-xl p-5"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                  Pipeline
                </h2>
                {pipelineStatus === "complete" && (
                  <div className="flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: "var(--jade)" }}>
                    <CheckCircle2 size={13} />
                    Complete
                  </div>
                )}
                {isRunning && (
                  <div className="flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: "var(--gold)" }}>
                    <Zap size={13} />
                    Running
                  </div>
                )}
              </div>

              <div className="space-y-0">
                {stages.map((stage, i) => (
                  <StageNode
                    key={stage.agentType}
                    stage={stage}
                    index={i}
                    total={stages.length}
                    expanded={expandedStages.has(stage.agentType)}
                    onToggle={() => toggleStage(stage.agentType)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Final output panel */}
          {finalOutput && pipelineStatus === "complete" && (
            <div className="rounded-xl overflow-hidden"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--jade)", boxShadow: "0 0 24px rgba(45,212,191,0.08)" }}>
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <FileText size={15} style={{ color: "var(--jade)" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Final Output
                  </span>
                  {contentBriefId && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(45,212,191,0.1)", color: "var(--jade)" }}>
                      Saved to Content #{contentBriefId}
                    </span>
                  )}
                </div>
                <CopyButton text={finalOutput} />
              </div>
              <div className="p-5">
                <div
                  className="font-mono text-xs rounded-xl p-4 overflow-y-auto whitespace-pre-wrap"
                  style={{
                    background: "var(--ink)",
                    color: "var(--text-secondary)",
                    maxHeight: 500,
                    wordBreak: "break-word",
                    lineHeight: "1.7",
                    border: "1px solid var(--border)",
                  }}
                >
                  {finalOutput}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {ToastEl}
    </div>
  );
}