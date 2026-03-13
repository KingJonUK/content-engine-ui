"use client";

import { useEffect, useRef, useState } from "react";
import {
  getClients,
  getAgentRuns,
  runAgentStream,
  type Client,
  type AgentRun,
  AGENT_TYPES,
} from "@/lib/api";
import { Button, FormField, PageHeader, Select, Badge, useToast } from "@/components/ui";
import { Bot, Play, ClipboardList, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AgentsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [agentType, setAgentType] = useState(AGENT_TYPES[0]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamOutput, setStreamOutput] = useState("");
  const [expandedRun, setExpandedRun] = useState<number | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const { show, ToastEl } = useToast();

  useEffect(() => {
    getClients().then((cs) => {
      setClients(cs);
      if (cs.length) setSelectedClient(cs[0].id);
    });
    getAgentRuns().then(setRuns).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamOutput]);

  const handleRun = () => {
    if (!selectedClient || !input.trim()) return;
    setStreaming(true);
    setStreamOutput("");

    runAgentStream(
      { clientId: selectedClient, agentType, input },
      (chunk) => setStreamOutput((prev) => prev + chunk),
      (runId) => {
        setStreaming(false);
        show("Agent run complete");
        getAgentRuns().then(setRuns);
      },
      (err) => {
        setStreaming(false);
        show(err, "error");
      }
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-up">
      <PageHeader
        title="AI Agents"
        subtitle="Run content generation agents and view run history"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Run panel */}
        <div
          className="rounded-xl p-6 space-y-4"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            Run Agent
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Client" required>
              <Select
                value={String(selectedClient ?? "")}
                onChange={(e) => setSelectedClient(Number(e.target.value))}
                options={clients.map((c) => ({ value: String(c.id), label: c.name }))}
                placeholder="Select client"
              />
            </FormField>
            <FormField label="Agent Type" required>
              <Select
                value={agentType}
                onChange={(e) => setAgentType(e.target.value as typeof agentType)}
                options={AGENT_TYPES.map((a) => ({
                  value: a,
                  label: a.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                }))}
              />
            </FormField>
          </div>

          <FormField label="Input / Brief" required>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={5}
              placeholder="Describe what you want the agent to produce…"
            />
          </FormField>

          <Button
            onClick={handleRun}
            loading={streaming}
            disabled={!selectedClient || !input.trim()}
            icon={<Play size={14} />}
            className="w-full justify-center"
          >
            {streaming ? "Running…" : "Run Agent"}
          </Button>

          {/* Stream output */}
          {(streamOutput || streaming) && (
            <div
              ref={outputRef}
              className="rounded-xl p-4 font-mono text-xs overflow-y-auto max-h-72"
              style={{
                background: "var(--ink)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {streamOutput}
              {streaming && (
                <span
                  className="inline-block w-1.5 h-4 ml-0.5 align-middle rounded-sm"
                  style={{ background: "var(--accent)", animation: "pulse 1s infinite" }}
                />
              )}
            </div>
          )}
        </div>

        {/* Runs history */}
        <div
          className="rounded-xl p-6"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-secondary)" }}>
            Recent Runs
          </h2>
          <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-16 rounded-lg" />)
              : runs.length === 0
              ? (
                <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                  <Bot size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No agent runs yet</p>
                </div>
              )
              : runs.map((run) => (
                  <div
                    key={run.id}
                    className="rounded-lg overflow-hidden"
                    style={{ background: "var(--surface-overlay)", border: "1px solid var(--border)" }}
                  >
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-surface-raised transition-colors"
                      onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <Badge status={run.status} />
                        <span className="text-xs font-mono truncate" style={{ color: "var(--text-secondary)" }}>
                          {run.agentType.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                        </span>
                        {expandedRun === run.id ? (
                          <ChevronUp size={13} style={{ color: "var(--text-muted)" }} />
                        ) : (
                          <ChevronDown size={13} style={{ color: "var(--text-muted)" }} />
                        )}
                      </div>
                    </div>
                    {expandedRun === run.id && run.output && (
                      <div
                        className="px-3 pb-3 text-xs font-mono whitespace-pre-wrap"
                        style={{
                          color: "var(--text-secondary)",
                          borderTop: "1px solid var(--border)",
                          paddingTop: 10,
                          maxHeight: 300,
                          overflowY: "auto",
                        }}
                      >
                        {run.output}
                      </div>
                    )}
                  </div>
                ))}
          </div>
        </div>
      </div>

      {ToastEl}
    </div>
  );
}
