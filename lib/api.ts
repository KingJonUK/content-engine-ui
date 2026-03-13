const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const getClients = () => request<Client[]>("/clients");
export const getClient = (id: number) => request<Client>(`/clients/${id}`);
export const createClient = (data: Partial<Client>) =>
  request<Client>("/clients", { method: "POST", body: JSON.stringify(data) });
export const updateClient = (id: number, data: Partial<Client>) =>
  request<Client>(`/clients/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteClient = (id: number) =>
  fetch(`${BASE}/api/clients/${id}`, { method: "DELETE" });

export const getBrandProfile = (clientId: number) =>
  request<BrandProfile>(`/clients/${clientId}/brand`);
export const upsertBrandProfile = (clientId: number, data: Partial<BrandProfile>) =>
  request<BrandProfile>(`/clients/${clientId}/brand`, { method: "PUT", body: JSON.stringify(data) });

export const getCampaigns = (clientId: number) =>
  request<Campaign[]>(`/clients/${clientId}/campaigns`);
export const createCampaign = (clientId: number, data: Partial<Campaign>) =>
  request<Campaign>(`/clients/${clientId}/campaigns`, { method: "POST", body: JSON.stringify(data) });
export const getCampaign = (id: number) => request<Campaign>(`/campaigns/${id}`);
export const updateCampaign = (id: number, data: Partial<Campaign>) =>
  request<Campaign>(`/campaigns/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteCampaign = (id: number) =>
  fetch(`${BASE}/api/campaigns/${id}`, { method: "DELETE" });

export const getContent = (clientId: number, filters?: { status?: string; campaignId?: number }) => {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.campaignId) params.set("campaignId", String(filters.campaignId));
  return request<ContentBrief[]>(`/clients/${clientId}/content?${params}`);
};
export const createContent = (clientId: number, data: Partial<ContentBrief>) =>
  request<ContentBrief>(`/clients/${clientId}/content`, { method: "POST", body: JSON.stringify(data) });
export const getContentBrief = (id: number) => request<ContentBrief>(`/content/${id}`);
export const updateContent = (id: number, data: Partial<ContentBrief>) =>
  request<ContentBrief>(`/content/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteContent = (id: number) =>
  fetch(`${BASE}/api/content/${id}`, { method: "DELETE" });

export const getProviders = () => request<AIProvider[]>("/providers");
export const createProvider = (data: Partial<AIProvider>) =>
  request<AIProvider>("/providers", { method: "POST", body: JSON.stringify(data) });
export const updateProvider = (id: number, data: Partial<AIProvider>) =>
  request<AIProvider>(`/providers/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteProvider = (id: number) =>
  fetch(`${BASE}/api/providers/${id}`, { method: "DELETE" });
export const testProvider = (id: number) =>
  request<{ success: boolean; response?: string; error?: string }>(`/providers/${id}/test`, { method: "POST" });

export const getAgentDefaults = () => request<AgentDefault[]>("/agent-defaults");
export const upsertAgentDefault = (data: { agentType: string; providerId: number; model: string }) =>
  request<AgentDefault>("/agent-defaults", { method: "PUT", body: JSON.stringify(data) });

export const getAgentRuns = (filters?: { clientId?: number; contentBriefId?: number }) => {
  const params = new URLSearchParams();
  if (filters?.clientId) params.set("clientId", String(filters.clientId));
  if (filters?.contentBriefId) params.set("contentBriefId", String(filters.contentBriefId));
  return request<AgentRun[]>(`/agents/runs?${params}`);
};

export const getDashboardStats = () => request<DashboardStats>("/dashboard/stats");

export const getConversations = () => request<Conversation[]>("/openai/conversations");
export const createConversation = (title: string) =>
  request<Conversation>("/openai/conversations", { method: "POST", body: JSON.stringify({ title }) });
export const getConversation = (id: number) =>
  request<Conversation & { messages: Message[] }>(`/openai/conversations/${id}`);
export const deleteConversation = (id: number) =>
  fetch(`${BASE}/api/openai/conversations/${id}`, { method: "DELETE" });

export function runAgentStream(
  payload: { clientId: number; agentType: string; input: string; contentBriefId?: number },
  onChunk: (text: string) => void,
  onDone: (runId: number) => void,
  onError: (msg: string) => void
) {
  const controller = new AbortController();
  fetch(`${BASE}/api/agents/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: controller.signal,
  }).then(async (res) => {
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      const lines = text.split("\n").filter((l) => l.startsWith("data: "));
      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.content) onChunk(data.content);
          if (data.done) onDone(data.runId);
          if (data.error) onError(data.error);
        } catch {}
      }
    }
  });
  return () => controller.abort();
}

export function sendChatMessage(
  conversationId: number,
  content: string,
  onChunk: (text: string) => void,
  onDone: () => void
) {
  const controller = new AbortController();
  fetch(`${BASE}/api/openai/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
    signal: controller.signal,
  }).then(async (res) => {
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      const lines = text.split("\n").filter((l) => l.startsWith("data: "));
      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.content) onChunk(data.content);
          if (data.done) onDone();
        } catch {}
      }
    }
  });
  return () => controller.abort();
}

export interface Client {
  id: number;
  name: string;
  email: string | null;
  website: string | null;
  industry: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrandProfile {
  id: number;
  clientId: number;
  tone: string | null;
  voiceRules: string | null;
  bannedPhrases: string | null;
  vocabulary: string | null;
  ctaStyle: string | null;
  icpDescription: string | null;
  painPoints: string | null;
  transformation: string | null;
  proofPoints: string | null;
  contentPillars: string | null;
  platforms: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  fontPrimary: string | null;
  fontSecondary: string | null;
  brandLogoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: number;
  clientId: number;
  name: string;
  description: string | null;
  status: "draft" | "active" | "paused" | "completed";
  startDate: string | null;
  endDate: string | null;
  goals: string | null;
  platforms: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentBrief {
  id: number;
  clientId: number;
  campaignId: number | null;
  title: string;
  platform: string;
  contentType: string;
  funnelStage: string;
  status: "idea" | "brief" | "draft" | "review" | "approved" | "published";
  hook: string | null;
  body: string | null;
  cta: string | null;
  angle: string | null;
  notes: string | null;
  scheduledFor: string | null;
  publishedAt: string | null;
  qualityScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIProvider {
  id: number;
  name: string;
  providerType: string;
  apiKey: string;
  baseUrl: string | null;
  defaultModel: string;
  isActive: boolean;
  createdAt: string;
}

export interface AgentDefault {
  id: number;
  agentType: string;
  providerId: number;
  model: string;
  providerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentRun {
  id: number;
  clientId: number;
  contentBriefId: number | null;
  agentType: string;
  status: "running" | "completed" | "failed";
  input: string;
  output: string | null;
  model: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalClients: number;
  activeCampaigns: number;
  contentInPipeline: number;
  contentPublished: number;
  agentRunsToday: number;
  recentContent: ContentBrief[];
  recentRuns: AgentRun[];
}

export interface Conversation {
  id: number;
  title: string;
  createdAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export const AGENT_TYPES = [
  "strategy",
  "research",
  "angle",
  "hook",
  "copywriter",
  "cta",
  "qa",
  "creative_direction",
  "repurpose",
  "image_generation",
  "video_generation",
] as const;

export const CONTENT_STATUSES = ["idea", "brief", "draft", "review", "approved", "published"] as const;
export const CAMPAIGN_STATUSES = ["draft", "active", "paused", "completed"] as const;
export const PLATFORMS = ["LinkedIn", "Twitter/X", "Instagram", "Facebook", "Blog", "Email", "YouTube", "TikTok", "Website"] as const;
export const FUNNEL_STAGES = ["awareness", "consideration", "decision", "retention"] as const;
export const CONTENT_TYPES = ["post", "article", "email", "video_script", "ad_copy", "landing_page", "thread", "newsletter"] as const;


// ── Pipeline ──────────────────────────────────────────────────────────────────

export const OUTPUT_TYPES = [
  { key: "linkedin_post",        label: "LinkedIn Post",          agents: ["strategy","research","angle","hook","copywriter","cta","qa"],                           color: "#0A66C2", emoji: "💼" },
  { key: "linkedin_post_visual", label: "LinkedIn Post + Image",  agents: ["strategy","research","angle","hook","copywriter","cta","qa","image_generation"],       color: "#0A66C2", emoji: "🖼️" },
  { key: "twitter_thread",       label: "Twitter/X Thread",       agents: ["research","hook","copywriter","qa"],                                                   color: "#1DA1F2", emoji: "🐦" },
  { key: "instagram_carousel",   label: "Instagram Carousel",     agents: ["angle","creative_direction","copywriter","cta","qa","image_generation"],               color: "#E1306C", emoji: "📸" },
  { key: "instagram_reel",       label: "Instagram Reel",         agents: ["angle","hook","copywriter","cta","video_generation"],                                  color: "#E1306C", emoji: "🎬" },
  { key: "email_newsletter",     label: "Email Newsletter",       agents: ["strategy","copywriter","cta","qa"],                                                    color: "#F59E0B", emoji: "📧" },
  { key: "full_repurpose",       label: "Full Repurpose",         agents: ["copywriter","repurpose","qa"],                                                         color: "#8B5CF6", emoji: "♻️" },
  { key: "content_campaign",     label: "Content Campaign",       agents: ["strategy","research","angle","hook","copywriter","cta","qa"],                          color: "#10B981", emoji: "🚀" },
  { key: "social_video",         label: "Social Video",           agents: ["angle","hook","copywriter","video_generation"],                                        color: "#EF4444", emoji: "🎥" },
];

export const VIDEO_PROVIDERS: { value: VideoProviderType; label: string; defaultModel: string }[] = [
  { value: "runway",     label: "Runway",                     defaultModel: "gen4_turbo" },
  { value: "kling",      label: "Kling AI",                   defaultModel: "kling-v2-master" },
  { value: "luma",       label: "Luma Dream Machine",         defaultModel: "ray-2" },
  { value: "openai",     label: "Sora (OpenAI)",              defaultModel: "sora" },
  { value: "openrouter", label: "Minimax via OpenRouter",     defaultModel: "minimax/video-01" },
];

export const getMediaProviders = () => request<MediaProvider[]>("/media-providers");
export const createMediaProvider = (data: Omit<MediaProvider, "id" | "createdAt" | "updatedAt">) =>
  request<MediaProvider>("/media-providers", { method: "POST", body: JSON.stringify(data) });
export const updateMediaProvider = (id: number, data: Partial<MediaProvider>) =>
  request<MediaProvider>(`/media-providers/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteMediaProvider = (id: number) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/media-providers/${id}`, { method: "DELETE" });
export const testMediaProvider = (id: number) =>
  request<{ success: boolean; message: string }>(`/media-providers/${id}/test`, { method: "POST" });

export function runPipelineStream(
  payload: { clientId: number; outputType: string; brief?: string },
  onEvent: (event: PipelineStageEvent) => void,
  onDone: (contentBriefId: number, finalOutput: string) => void,
  onError: (msg: string) => void
): () => void {
  const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const controller = new AbortController();

  fetch(`${BASE}/api/pipeline/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: controller.signal,
  }).then(async (res) => {
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      const lines = text.split("\n").filter((l) => l.startsWith("data: "));
      for (const line of lines) {
        try {
          const event: PipelineStageEvent = JSON.parse(line.slice(6));
          onEvent(event);
          if (event.type === "pipeline_complete") onDone(event.contentBriefId!, event.output || "");
          if (event.type === "pipeline_error") onError(event.error || "Pipeline failed");
        } catch {}
      }
    }
  }).catch((err) => {
    if (err.name !== "AbortError") onError(err.message);
  });

  return () => controller.abort();
}