import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.108.0/+esm";

const config = window.BLISKOCHAT_CONFIG || {};
const hasBackend = Boolean(config.supabaseUrl && config.supabaseAnonKey);
const supabase = hasBackend ? createClient(config.supabaseUrl, config.supabaseAnonKey) : null;

const STORAGE_BUCKET = "chat-files";
const SIGNED_URL_SECONDS = 600;
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_VOICE_SECONDS = 300;

const state = {
  user: null,
  profile: null,
  conversations: [],
  memberships: [],
  conversationMembers: [],
  profiles: {},
  messages: [],
  reactions: [],
  reads: [],
  friendships: [],
  activeConversationId: null,
  activeFilter: "all",
  activeView: "chats",
  subscriptions: [],
  signedUrls: new Map(),
  mediaRecorder: null,
  mediaStream: null,
  voiceChunks: [],
  voiceBlob: null,
  voiceSeconds: 0,
  voiceTimer: null
};

const themes = [
  { id: "classic", name: "Klasyczny", accent: "#0084ff", bg: "#ffffff" },
  { id: "heart", name: "Serce", accent: "#db2777", bg: "linear-gradient(135deg,#fff1f7,#ffe4e6)" },
  { id: "ocean", name: "Spokojny ocean", accent: "#0369a1", bg: "linear-gradient(135deg,#e0f2fe,#ccfbf1)" },
  { id: "night", name: "Nocne niebo", accent: "#4f46e5", bg: "linear-gradient(135deg,#111827,#312e81)" },
  { id: "forest", name: "Las", accent: "#166534", bg: "linear-gradient(135deg,#ecfdf5,#d9f99d)" },
  { id: "sunrise", name: "Poranek", accent: "#c2410c", bg: "linear-gradient(135deg,#fff7ed,#fde68a)" },
  { id: "lavender", name: "Lawenda", accent: "#7e22ce", bg: "linear-gradient(135deg,#f3e8ff,#e0e7ff)" },
  { id: "berry", name: "Jagoda", accent: "#4338ca", bg: "linear-gradient(135deg,#e0e7ff,#f5d0fe)" },
  { id: "slate", name: "Grafit", accent: "#334155", bg: "linear-gradient(135deg,#f8fafc,#e2e8f0)" },
  { id: "mint", name: "Mieta", accent: "#059669", bg: "linear-gradient(135deg,#ecfdf5,#ccfbf1)" }
];

const app = document.getElementById("app");
const authScreen = document.getElementById("authScreen");
const authForm = document.getElementById("authForm");
const setupWarning = document.getElementById("setupWarning");
const authStatus = document.getElementById("authStatus");
const conversationList = document.getElementById("conversationList");
const chatHeader = document.getElementById("chatHeader");
const messagesEl = document.getElementById("messages");
const detailsPanel = document.getElementById("detailsPanel");
const pinnedBanner = document.getElementById("pinnedBanner");
const messageInput = document.getElementById("messageInput");
const composer = document.getElementById("composer");
const searchInput = document.getElementById("searchInput");
const sectionTitle = document.getElementById("sectionTitle");
const themeModal = document.getElementById("themeModal");
const themeGrid = document.getElementById("themeGrid");
const themePreview = document.getElementById("themePreview");
const pickerModal = document.getElementById("pickerModal");
const pickerGrid = document.getElementById("pickerGrid");
const pickerTitle = document.getElementById("pickerTitle");
const voiceModal = document.getElementById("voiceModal");
const settingsModal = document.getElementById("settingsModal");
const settingsLayout = document.getElementById("settingsLayout");

let pendingThemeId = "classic";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showAuth() {
  authScreen.classList.remove("hidden");
  app.classList.add("locked");
  setupWarning.classList.toggle("hidden", hasBackend);
  authForm.classList.toggle("hidden", !hasBackend);
}

function showApp() {
  authScreen.classList.add("hidden");
  app.classList.remove("locked");
}

function setAuthStatus(message = "", type = "") {
  if (!authStatus) return;
  authStatus.textContent = message;
  authStatus.className = `auth-status ${type || ""}`.trim();
  authStatus.classList.toggle("hidden", !message);
}

function setAuthBusy(isBusy, message = "") {
  authForm.querySelectorAll("button, input").forEach((item) => {
    item.disabled = isBusy;
  });
  if (message) setAuthStatus(message);
}

function humanizeAuthError(error) {
  const message = String(error?.message || error || "Nieznany blad logowania.");
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "Nieprawidlowy email albo haslo.";
  if (lower.includes("email not confirmed")) return "Konto nie jest jeszcze potwierdzone. Sprawdz poczte i kliknij link potwierdzajacy.";
  if (lower.includes("email_address_invalid") || lower.includes("email address")) return "Ten adres email zostal odrzucony. Uzyj prawdziwego adresu email, np. Gmail albo Outlook.";
  if (lower.includes("password")) return "Haslo musi miec minimum 6 znakow.";
  if (lower.includes("rate limit")) return "Za duzo prob. Odczekaj chwile i sprobuj ponownie.";
  return message;
}

function isAdmin() {
  return ["admin", "moderator"].includes(state.profile?.role);
}

function setAdminVisibility() {
  document.querySelectorAll('[data-view="admin"]').forEach((item) => {
    item.classList.toggle("hidden", !isAdmin());
  });
}

function getActiveConversation() {
  return state.conversations.find((conversation) => conversation.id === state.activeConversationId) || null;
}

function getActiveMembership() {
  return state.memberships.find((member) => member.conversation_id === state.activeConversationId) || null;
}

function getTheme(id) {
  return themes.find((theme) => theme.id === id) || themes[0];
}

function applyThemeVariables(conversation) {
  const theme = getTheme(conversation?.theme_id || "classic");
  document.documentElement.style.setProperty("--accent", conversation?.theme_accent || theme.accent);
  document.documentElement.style.setProperty("--chat-bg", theme.bg);
}

function initials(text = "?") {
  return String(text)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(new Date(value));
}

function conversationMembers(conversationId) {
  return state.conversationMembers.filter((member) => member.conversation_id === conversationId);
}

function otherConversationProfile(conversation) {
  const other = conversationMembers(conversation.id).find((member) => member.user_id !== state.user?.id);
  return other ? state.profiles[other.user_id] : null;
}

function conversationTitle(conversation) {
  if (!conversation) return "";
  if (conversation.is_group) return conversation.title || "Grupa";
  const other = otherConversationProfile(conversation);
  return other?.display_name || conversation.title || "Rozmowa";
}

function conversationSubtitle(conversation) {
  if (conversation.is_group) return `${conversationMembers(conversation.id).length} osob`;
  const other = otherConversationProfile(conversation);
  return other?.status_text || "Rozmowa prywatna";
}

function safeFileName(name) {
  return String(name || "plik").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 90);
}

function makeId() {
  return crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function refreshIcons() {
  window.lucide?.createIcons({
    attrs: {
      "aria-hidden": "true"
    }
  });
}

async function init() {
  bindUi();
  if (!hasBackend) {
    showAuth();
    renderEmptyApp();
    return;
  }

  const { data } = await supabase.auth.getSession();
  state.user = data.session?.user || null;
  supabase.auth.onAuthStateChange(async (_event, session) => {
    state.user = session?.user || null;
    if (state.user) {
      await bootstrapUser();
    } else {
      showAuth();
      clearData();
      renderEmptyApp();
    }
  });

  if (!state.user) {
    showAuth();
    renderEmptyApp();
    return;
  }

  await bootstrapUser();
}

async function bootstrapUser() {
  await loadCurrentUser();
  if (state.profile?.is_banned) {
    showAuth();
    renderEmptyApp();
    toast("Konto jest zablokowane przez administracje.");
    await supabase.auth.signOut();
    return;
  }
  await loadConversations();
  await loadFriendships();
  setAdminVisibility();
  showApp();
  render();
}

function clearData() {
  state.profile = null;
  state.conversations = [];
  state.memberships = [];
  state.conversationMembers = [];
  state.profiles = {};
  state.messages = [];
  state.reactions = [];
  state.reads = [];
  state.friendships = [];
  state.activeConversationId = null;
  state.signedUrls.clear();
  state.subscriptions.forEach((channel) => supabase.removeChannel(channel));
  state.subscriptions = [];
}

async function loadCurrentUser() {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", state.user.id)
    .maybeSingle();
  if (error) throw error;

  if (profile) {
    state.profile = profile;
    state.profiles[profile.id] = profile;
    return;
  }

  const emailName = state.user.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 18) || "uzytkownik";
  const newProfile = {
    id: state.user.id,
    display_name: emailName,
    username: `${emailName}-${state.user.id.slice(0, 6)}`
  };
  const { data, error: insertError } = await supabase.from("profiles").insert(newProfile).select("*").single();
  if (insertError) throw insertError;
  state.profile = data;
  state.profiles[data.id] = data;
}

async function loadConversations() {
  const { data: memberships, error: memberError } = await supabase
    .from("conversation_members")
    .select("*")
    .eq("user_id", state.user.id)
    .order("pinned", { ascending: false })
    .order("joined_at", { ascending: false });
  if (memberError) throw memberError;

  state.memberships = memberships || [];
  const ids = state.memberships.map((member) => member.conversation_id);
  if (!ids.length) {
    state.conversations = [];
    state.conversationMembers = [];
    state.messages = [];
    state.activeConversationId = null;
    return;
  }

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("*")
    .in("id", ids)
    .order("updated_at", { ascending: false });
  if (error) throw error;

  state.conversations = conversations || [];
  await loadConversationMembers(ids);
  state.activeConversationId = state.activeConversationId || state.conversations[0]?.id || null;
  await loadMessages();
  subscribeToRealtime();
}

async function loadConversationMembers(ids) {
  if (!ids.length) return;
  const { data: members, error } = await supabase
    .from("conversation_members")
    .select("*")
    .in("conversation_id", ids);
  if (error) throw error;
  state.conversationMembers = members || [];

  const profileIds = [...new Set(state.conversationMembers.map((member) => member.user_id))];
  await loadProfiles(profileIds);
}

async function loadProfiles(profileIds) {
  const ids = [...new Set((profileIds || []).filter(Boolean))];
  if (!ids.length) return;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url, status_text, role, is_online, read_receipts_enabled, auto_transcribe_voice, is_banned")
    .in("id", ids);
  if (error) throw error;
  (data || []).forEach((profile) => {
    state.profiles[profile.id] = profile;
  });
}

async function loadMessages() {
  if (!state.activeConversationId) {
    state.messages = [];
    state.reactions = [];
    state.reads = [];
    return;
  }
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", state.activeConversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  state.messages = data || [];
  await loadMessageMeta();
  await markActiveConversationRead();
}

async function loadMessageMeta() {
  const ids = state.messages.map((message) => message.id);
  if (!ids.length) {
    state.reactions = [];
    state.reads = [];
    return;
  }

  const [{ data: reactions, error: reactionsError }, { data: reads, error: readsError }] = await Promise.all([
    supabase.from("message_reactions").select("*").in("message_id", ids),
    supabase.from("message_reads").select("*").in("message_id", ids)
  ]);
  if (reactionsError) throw reactionsError;
  if (readsError) throw readsError;
  state.reactions = reactions || [];
  state.reads = reads || [];
}

async function markActiveConversationRead() {
  const conversation = getActiveConversation();
  if (!conversation || !state.profile?.read_receipts_enabled) return;
  const now = new Date().toISOString();
  const readRows = state.messages
    .filter((message) => message.sender_id !== state.user.id)
    .map((message) => ({ message_id: message.id, user_id: state.user.id, read_at: now }));
  if (readRows.length) {
    await supabase.from("message_reads").upsert(readRows, { onConflict: "message_id,user_id" });
  }
  await supabase
    .from("conversation_members")
    .update({ last_read_at: now })
    .eq("conversation_id", conversation.id)
    .eq("user_id", state.user.id);
}

async function loadFriendships() {
  if (!state.user) return;
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .or(`requester_id.eq.${state.user.id},addressee_id.eq.${state.user.id}`)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  state.friendships = data || [];
  const ids = state.friendships.flatMap((row) => [row.requester_id, row.addressee_id]);
  await loadProfiles(ids);
}

function subscribeToRealtime() {
  state.subscriptions.forEach((channel) => supabase.removeChannel(channel));
  state.subscriptions = [];
  if (!state.activeConversationId) return;

  const messagesChannel = supabase
    .channel(`chat:${state.activeConversationId}`)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "messages",
      filter: `conversation_id=eq.${state.activeConversationId}`
    }, refreshActiveMessages)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "message_reactions"
    }, refreshActiveMessages)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "message_reads"
    }, refreshActiveMessages)
    .subscribe();

  state.subscriptions.push(messagesChannel);
}

async function refreshActiveMessages() {
  await loadMessages();
  renderMessages();
}

async function login(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

async function register(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (data.session) return "Konto utworzone i zalogowano. Laduje rozmowy...";
  return "Konto utworzone. Supabase wymaga potwierdzenia emaila, wiec sprawdz poczte i kliknij link potwierdzajacy.";
}

async function insertMessage(record) {
  const { data, error } = await supabase.from("messages").insert(record).select("*").single();
  if (error) throw error;
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", record.conversation_id);
  return data;
}

async function sendMessage(type = "text", body = messageInput.value.trim(), extra = {}) {
  if (!state.activeConversationId || !body) return;
  await insertMessage({
    conversation_id: state.activeConversationId,
    sender_id: state.user.id,
    type,
    body,
    ...extra
  });
  messageInput.value = "";
  await loadMessages();
  await loadConversations();
  render();
}

async function createConversation() {
  const raw = window.prompt("Podaj username osoby albo kilka username po przecinku dla grupy");
  if (!raw) return;
  const usernames = [...new Set(raw.split(",").map((item) => item.trim()).filter(Boolean))]
    .filter((username) => username !== state.profile?.username);
  if (!usernames.length) return;

  const { data: users, error: findError } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .in("username", usernames);
  if (findError) throw findError;

  const found = users || [];
  const foundNames = new Set(found.map((user) => user.username));
  const missing = usernames.filter((username) => !foundNames.has(username));
  if (missing.length) {
    toast(`Nie znaleziono: ${missing.join(", ")}`);
    return;
  }

  const isGroup = found.length > 1;
  const groupTitle = isGroup ? window.prompt("Nazwa grupy", found.map((user) => user.display_name).join(", ")) : null;
  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({ owner_id: state.user.id, title: isGroup ? groupTitle || "Nowa grupa" : null, is_group: isGroup, quick_reaction: "Kciuk" })
    .select("*")
    .single();
  if (error) throw error;

  const { error: selfError } = await supabase.from("conversation_members").insert({
    conversation_id: conversation.id,
    user_id: state.user.id,
    role: "owner"
  });
  if (selfError) throw selfError;

  const otherMembers = found.map((user) => ({
    conversation_id: conversation.id,
    user_id: user.id,
    role: "member"
  }));
  if (otherMembers.length) {
    const { error: memberError } = await supabase.from("conversation_members").insert(otherMembers);
    if (memberError) throw memberError;
  }

  state.activeConversationId = conversation.id;
  await loadConversations();
  render();
}

async function startChatWithUsername(username) {
  if (!username) return;
  const { data: other, error: findError } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .eq("username", username)
    .maybeSingle();
  if (findError) throw findError;
  if (!other) {
    toast("Nie znaleziono uzytkownika.");
    return;
  }

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({ owner_id: state.user.id, title: null, is_group: false, quick_reaction: "Kciuk" })
    .select("*")
    .single();
  if (error) throw error;

  const { error: selfError } = await supabase.from("conversation_members").insert({
    conversation_id: conversation.id,
    user_id: state.user.id,
    role: "owner"
  });
  if (selfError) throw selfError;

  const { error: memberError } = await supabase.from("conversation_members").insert({
    conversation_id: conversation.id,
    user_id: other.id,
    role: "member"
  });
  if (memberError) throw memberError;

  state.activeConversationId = conversation.id;
  state.activeView = "chats";
  await loadConversations();
  render();
}

function renderEmptyApp() {
  sectionTitle.textContent = "Czaty";
  conversationList.innerHTML = `<div class="details-card"><h3>Witaj w BliskoChat</h3><p>Zaloguj sie, aby zobaczyc rozmowy.</p></div>`;
  chatHeader.innerHTML = "";
  pinnedBanner.className = "pinned-banner";
  messagesEl.innerHTML = `<div class="details-card"><h3>Wybierz rozmowe</h3><p>Czaty pojawia sie tutaj po zalogowaniu.</p></div>`;
  detailsPanel.innerHTML = "";
  refreshIcons();
}

function render() {
  const conversation = getActiveConversation();
  applyThemeVariables(conversation);
  setAdminVisibility();
  renderConversationList();
  renderHeader();
  renderPinned();
  renderMessages();
  renderDetails();
  refreshIcons();
}

function renderConversationList() {
  sectionTitle.textContent = "Czaty";
  const query = searchInput.value.trim().toLowerCase();
  conversationList.innerHTML = "";
  const rows = state.conversations.filter((conversation) => {
    const member = state.memberships.find((item) => item.conversation_id === conversation.id);
    if (state.activeFilter === "groups" && !conversation.is_group) return false;
    if (state.activeFilter === "archived" && !member?.archived) return false;
    if (state.activeFilter === "unread" && member?.last_read_at && new Date(conversation.updated_at) <= new Date(member.last_read_at)) return false;
    if (!["archived", "requests"].includes(state.activeFilter) && member?.archived) return false;
    if (!query) return true;
    return conversationTitle(conversation).toLowerCase().includes(query);
  });

  if (!rows.length) {
    conversationList.innerHTML = `<div class="details-card"><h3>Brak rozmow</h3><p>Utworz rozmowe przyciskiem plus.</p></div>`;
    return;
  }

  rows.forEach((conversation) => {
    const member = state.memberships.find((item) => item.conversation_id === conversation.id);
    const title = conversationTitle(conversation);
    const subtitle = conversationSubtitle(conversation);
    const other = otherConversationProfile(conversation);
    const onlineDot = other?.is_online ? "<span class='status-dot'></span>" : "";
    const unread = member?.last_read_at && new Date(conversation.updated_at) > new Date(member.last_read_at);
    const button = document.createElement("button");
    button.className = `conversation-card ${conversation.id === state.activeConversationId ? "active" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <span class="avatar">${escapeHtml(initials(title))}${onlineDot}</span>
      <span>
        <span class="conversation-title"><strong>${escapeHtml(title)}</strong>${member?.pinned ? "<span class='conversation-meta'>Przypiete</span>" : ""}</span>
        <span class="preview">${escapeHtml(subtitle)}</span>
      </span>
      <span class="conversation-meta">${unread ? "<span class='badge'>1</span>" : formatTime(conversation.updated_at)}</span>
    `;
    button.addEventListener("click", async () => {
      state.activeConversationId = conversation.id;
      app.classList.add("chat-open");
      await loadMessages();
      subscribeToRealtime();
      render();
    });
    conversationList.appendChild(button);
  });
}

function renderHeader() {
  const conversation = getActiveConversation();
  if (!conversation) {
    chatHeader.innerHTML = "";
    return;
  }
  const title = conversationTitle(conversation);
  const subtitle = conversationSubtitle(conversation);
  const other = otherConversationProfile(conversation);
  const onlineDot = other?.is_online ? "<span class='status-dot'></span>" : "";
  chatHeader.innerHTML = `
    <div class="chat-person">
      <button class="icon-button mobile-back" id="mobileBack" aria-label="Wroc"><i data-lucide="arrow-left"></i></button>
      <span class="avatar">${escapeHtml(initials(title))}${onlineDot}</span>
      <span>
        <strong>${escapeHtml(title)}</strong>
        <span class="presence-line">${escapeHtml(subtitle)}</span>
      </span>
    </div>
    <div class="chat-actions">
      <button class="icon-button" id="audioCallButton" aria-label="Polaczenie audio" title="Polaczenie audio"><i data-lucide="phone"></i></button>
      <button class="icon-button" id="videoCallButton" aria-label="Polaczenie wideo" title="Polaczenie wideo"><i data-lucide="video"></i></button>
      <button class="icon-button" id="openChatSettings" aria-label="Informacje" title="Informacje"><i data-lucide="info"></i></button>
    </div>
  `;
  document.getElementById("mobileBack").addEventListener("click", () => app.classList.remove("chat-open"));
  document.getElementById("audioCallButton").addEventListener("click", () => toast("Polaczenia audio wymagaja kolejnego etapu WebRTC."));
  document.getElementById("videoCallButton").addEventListener("click", () => toast("Polaczenia wideo wymagaja kolejnego etapu WebRTC."));
  document.getElementById("openChatSettings").addEventListener("click", () => detailsPanel.scrollTo({ top: 0, behavior: "smooth" }));
}

function renderPinned() {
  const conversation = getActiveConversation();
  if (!conversation?.pinned_message_id) {
    pinnedBanner.className = "pinned-banner";
    pinnedBanner.textContent = "";
    return;
  }
  const pinned = state.messages.find((message) => message.id === conversation.pinned_message_id);
  pinnedBanner.className = "pinned-banner visible";
  pinnedBanner.textContent = pinned?.body ? `Przypiete: ${pinned.body}` : "Ta rozmowa ma przypieta wiadomosc.";
}

function renderMessages() {
  messagesEl.innerHTML = "";
  if (!state.activeConversationId) {
    messagesEl.innerHTML = `<div class="details-card"><h3>Wybierz rozmowe</h3><p>Albo utworz nowa rozmowe.</p></div>`;
    return;
  }
  if (!state.messages.length) {
    messagesEl.innerHTML = `<div class="details-card"><h3>Brak wiadomosci</h3><p>Napisz pierwsza wiadomosc.</p></div>`;
    return;
  }
  state.messages.forEach((message) => {
    const mine = message.sender_id === state.user?.id;
    const sender = state.profiles[message.sender_id];
    const senderName = sender?.display_name || sender?.username || "Uzytkownik";
    const row = document.createElement("div");
    row.className = `message-row ${mine ? "mine" : ""}`;
    row.innerHTML = `
      ${mine ? "" : `<span class="avatar message-avatar">${escapeHtml(initials(senderName))}</span>`}
      <div class="message">
        ${!mine && getActiveConversation()?.is_group ? `<div class="message-sender">${escapeHtml(senderName)}</div>` : ""}
        <div class="bubble ${message.type === "voice" ? "voice-bubble" : ""}">${messageBody(message)}</div>
        ${renderReactionPills(message.id)}
        <div class="message-meta">${formatTime(message.created_at)}${message.edited_at ? " - edytowano" : ""}${messageReadSummary(message)}</div>
        <div class="message-toolbar">
          <button class="mini-action" data-copy="${message.id}" aria-label="Kopiuj" title="Kopiuj"><i data-lucide="copy"></i></button>
          <button class="mini-action" data-react="${message.id}" aria-label="Reakcja" title="Reakcja"><i data-lucide="smile-plus"></i></button>
          <button class="mini-action" data-pin-message="${message.id}" aria-label="Przypnij" title="Przypnij"><i data-lucide="pin"></i></button>
          <button class="mini-action" data-report-message="${message.id}" aria-label="Zglos" title="Zglos"><i data-lucide="flag"></i></button>
        </div>
      </div>
    `;
    messagesEl.appendChild(row);
  });

  messagesEl.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", () => {
      const message = state.messages.find((item) => item.id === button.dataset.copy);
      navigator.clipboard?.writeText(message?.transcript_text || message?.body || "");
      toast("Skopiowano.");
    });
  });
  messagesEl.querySelectorAll("[data-react]").forEach((button) => {
    button.addEventListener("click", () => addReaction(button.dataset.react));
  });
  messagesEl.querySelectorAll("[data-transcribe]").forEach((button) => {
    button.addEventListener("click", () => requestTranscription(button.dataset.transcribe).catch((error) => toast(error.message)));
  });
  messagesEl.querySelectorAll("[data-play-voice]").forEach((button) => {
    button.addEventListener("click", () => playVoice(button.dataset.playVoice).catch((error) => toast(error.message)));
  });
  messagesEl.querySelectorAll("[data-download-file]").forEach((button) => {
    button.addEventListener("click", () => downloadAttachment(button.dataset.downloadFile).catch((error) => toast(error.message)));
  });
  messagesEl.querySelectorAll("[data-pin-message]").forEach((button) => {
    button.addEventListener("click", () => pinMessage(button.dataset.pinMessage).catch((error) => toast(error.message)));
  });
  messagesEl.querySelectorAll("[data-report-message]").forEach((button) => {
    button.addEventListener("click", () => reportMessage(button.dataset.reportMessage).catch((error) => toast(error.message)));
  });
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function messageBody(message) {
  if (message.type === "voice") {
    return `
      <div class="voice-line">
        <button class="mini-action" type="button" data-play-voice="${message.id}" aria-label="Odtworz" title="Odtworz"><i data-lucide="play"></i></button>
        <span class="progress"><span></span></span>
        <span>${message.voice_duration_seconds || 0}s</span>
      </div>
      ${message.transcript_text ? `<div class="transcript">${escapeHtml(message.transcript_text)}</div>` : renderTranscriptAction(message)}
    `;
  }

  if (message.attachment_path || message.attachment_url) {
    const label = message.type === "image" ? "Obraz" : message.type === "video" ? "Wideo" : "Zalacznik";
    return `
      <strong>${label}: ${escapeHtml(message.attachment_name || "plik")}</strong>
      <div class="attachment-meta">${formatBytes(message.attachment_size)}</div>
      <button class="mini-action" type="button" data-download-file="${message.id}"><i data-lucide="download"></i> Otworz</button>
      ${message.body ? `<div>${escapeHtml(message.body)}</div>` : ""}
    `;
  }

  if (message.type === "sticker" || message.type === "gif") {
    return `<strong>${escapeHtml(message.body || message.type)}</strong>`;
  }

  return escapeHtml(message.body || "");
}

function renderTranscriptAction(message) {
  if (message.transcript_status === "processing" || message.transcript_status === "pending") {
    return `<div class="transcript">Transkrypcja w toku...</div>`;
  }
  if (message.transcript_status === "failed") {
    return `<button class="mini-action" type="button" data-transcribe="${message.id}">Sprobuj ponownie transkrypcje</button>`;
  }
  return `<button class="mini-action" type="button" data-transcribe="${message.id}">Transkrybuj</button>`;
}

function renderReactionPills(messageId) {
  const rows = state.reactions.filter((reaction) => reaction.message_id === messageId);
  if (!rows.length) return "";
  const counts = rows.reduce((acc, row) => {
    acc[row.reaction] = (acc[row.reaction] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([reaction, count]) => `<span class="reaction-pill">${escapeHtml(reaction)} ${count}</span>`)
    .join("");
}

function messageReadSummary(message) {
  if (message.sender_id !== state.user.id || !state.profile?.read_receipts_enabled) return "";
  const count = state.reads.filter((read) => read.message_id === message.id && read.user_id !== state.user.id).length;
  return count ? ` - odczytano ${count}` : "";
}

function formatBytes(value) {
  if (!value) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

async function addReaction(messageId) {
  const conversation = getActiveConversation();
  const { error } = await supabase.from("message_reactions").upsert({
    message_id: messageId,
    user_id: state.user.id,
    reaction: conversation?.quick_reaction || "Kciuk"
  }, { onConflict: "message_id,user_id,reaction" });
  if (error) toast(error.message);
  else {
    await loadMessageMeta();
    renderMessages();
    refreshIcons();
  }
}

async function pinMessage(messageId) {
  const conversation = getActiveConversation();
  if (!conversation) return;
  const { error } = await supabase.from("conversations").update({ pinned_message_id: messageId }).eq("id", conversation.id);
  if (error) throw error;
  await loadConversations();
  render();
}

async function reportMessage(messageId) {
  const reason = window.prompt("Powod zgloszenia wiadomosci");
  if (!reason) return;
  const message = state.messages.find((item) => item.id === messageId);
  const { error } = await supabase.from("reports").insert({
    reporter_id: state.user.id,
    reported_user_id: message?.sender_id || null,
    conversation_id: state.activeConversationId,
    message_id: messageId,
    reason
  });
  if (error) throw error;
  toast("Zgloszenie wyslane.");
}

function renderDetails() {
  const conversation = getActiveConversation();
  if (!conversation) {
    detailsPanel.innerHTML = "";
    return;
  }
  const media = state.messages.filter((message) => message.attachment_path || message.attachment_url);
  const member = getActiveMembership();
  const title = conversationTitle(conversation);
  const subtitle = conversationSubtitle(conversation);
  detailsPanel.innerHTML = `
    <div class="details-card profile-card">
      <span class="avatar">${escapeHtml(initials(title))}</span>
      <h3>${escapeHtml(title)}</h3>
      <p class="preview">${escapeHtml(subtitle)}</p>
    </div>
    <div class="details-card">
      <h3>Dostosuj czat</h3>
      <div class="action-list">
        <button class="list-button" id="openTheme"><i data-lucide="palette"></i>Zmien tapete i motyw</button>
        <button class="list-button" id="openEmojiPicker"><i data-lucide="thumbs-up"></i>Zmien szybka reakcje</button>
        <button class="list-button" id="togglePinConversation"><i data-lucide="pin"></i>${member?.pinned ? "Odepnij rozmowe" : "Przypnij rozmowe"}</button>
        <button class="list-button" id="archiveConversation"><i data-lucide="archive"></i>Archiwizuj</button>
      </div>
    </div>
    <div class="details-card">
      <h3>Media i pliki</h3>
      <div class="action-list">
        ${media.length ? media.slice(-6).reverse().map((message) => `<button class="list-button" data-download-file="${message.id}"><i data-lucide="file"></i>${escapeHtml(message.attachment_name || message.body || "Plik")}</button>`).join("") : "<p class='preview'>Brak plikow w tej rozmowie.</p>"}
      </div>
    </div>
    <div class="details-card">
      <h3>Prywatnosc i bezpieczenstwo</h3>
      <div class="action-list">
        <button class="list-button" id="setDisappearing"><i data-lucide="timer"></i>Znikajace wiadomosci</button>
        <button class="list-button" id="muteConversation"><i data-lucide="bell-off"></i>Wycisz na 8 godzin</button>
        <button class="list-button danger" id="blockConversation"><i data-lucide="ban"></i>Zablokuj osobe</button>
        <button class="list-button danger" id="reportConversation"><i data-lucide="flag"></i>Zglos rozmowe</button>
      </div>
    </div>
  `;
  document.getElementById("openTheme").addEventListener("click", openThemeModal);
  document.getElementById("openEmojiPicker").addEventListener("click", () => openPicker("emoji"));
  document.getElementById("togglePinConversation").addEventListener("click", () => togglePinConversation().catch((error) => toast(error.message)));
  document.getElementById("archiveConversation").addEventListener("click", () => archiveConversation().catch((error) => toast(error.message)));
  document.getElementById("setDisappearing").addEventListener("click", () => setDisappearingMessages().catch((error) => toast(error.message)));
  document.getElementById("muteConversation").addEventListener("click", () => muteConversation().catch((error) => toast(error.message)));
  document.getElementById("blockConversation").addEventListener("click", () => blockConversation().catch((error) => toast(error.message)));
  document.getElementById("reportConversation").addEventListener("click", () => reportConversation().catch((error) => toast(error.message)));
  detailsPanel.querySelectorAll("[data-download-file]").forEach((button) => {
    button.addEventListener("click", () => downloadAttachment(button.dataset.downloadFile).catch((error) => toast(error.message)));
  });
}

function openThemeModal() {
  const conversation = getActiveConversation();
  pendingThemeId = conversation?.theme_id || "classic";
  renderThemeGrid();
  renderThemePreview();
  themeModal.showModal();
}

function renderThemeGrid() {
  themeGrid.innerHTML = "";
  themes.forEach((theme) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `theme-option ${theme.id === pendingThemeId ? "active" : ""}`;
    button.innerHTML = `<div class="theme-swatch" style="background:${theme.bg}"></div><strong>${escapeHtml(theme.name)}</strong>`;
    button.addEventListener("click", () => {
      pendingThemeId = theme.id;
      renderThemeGrid();
      renderThemePreview();
    });
    themeGrid.appendChild(button);
  });
}

function renderThemePreview() {
  const theme = getTheme(pendingThemeId);
  themePreview.style.background = theme.bg;
  themePreview.innerHTML = `
    <div class="message-row"><div class="message"><div class="bubble">Podglad tapety.</div></div></div>
    <div class="message-row mine"><div class="message"><div class="bubble" style="background:${theme.accent}">Akcent: ${escapeHtml(theme.name)}</div></div></div>
  `;
}

async function applySelectedTheme() {
  const conversation = getActiveConversation();
  if (!conversation) return;
  const theme = getTheme(pendingThemeId);
  const { error } = await supabase
    .from("conversations")
    .update({ theme_id: theme.id, theme_accent: theme.accent, theme_wallpaper: theme.id })
    .eq("id", conversation.id);
  if (error) throw error;
  themeModal.close();
  await loadConversations();
  render();
}

async function togglePinConversation() {
  const member = getActiveMembership();
  if (!member) return;
  const { error } = await supabase
    .from("conversation_members")
    .update({ pinned: !member.pinned })
    .eq("conversation_id", member.conversation_id)
    .eq("user_id", state.user.id);
  if (error) throw error;
  await loadConversations();
  render();
}

async function archiveConversation() {
  const member = getActiveMembership();
  if (!member) return;
  const { error } = await supabase
    .from("conversation_members")
    .update({ archived: true })
    .eq("conversation_id", member.conversation_id)
    .eq("user_id", state.user.id);
  if (error) throw error;
  await loadConversations();
  render();
}

async function setDisappearingMessages() {
  const raw = window.prompt("Po ilu sekundach wiadomosci maja znikac? Zostaw puste, aby wylaczyc.");
  const value = raw ? Number(raw) : null;
  if (raw && (!Number.isInteger(value) || value < 60)) {
    toast("Podaj liczbe sekund, minimum 60.");
    return;
  }
  const { error } = await supabase.from("conversations").update({ disappearing_seconds: value }).eq("id", state.activeConversationId);
  if (error) throw error;
  await loadConversations();
  render();
}

async function muteConversation() {
  const until = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("conversation_members")
    .update({ muted_until: until })
    .eq("conversation_id", state.activeConversationId)
    .eq("user_id", state.user.id);
  if (error) throw error;
  toast("Rozmowa wyciszona.");
}

async function blockConversation() {
  const conversation = getActiveConversation();
  if (!conversation || conversation.is_group) {
    toast("Blokowanie dotyczy rozmowy 1 na 1.");
    return;
  }
  const other = otherConversationProfile(conversation);
  if (!other) return;
  const { error } = await supabase.from("blocks").upsert({
    blocker_id: state.user.id,
    blocked_id: other.id
  }, { onConflict: "blocker_id,blocked_id" });
  if (error) throw error;
  await archiveConversation();
  toast("Uzytkownik zablokowany.");
}

async function reportConversation() {
  const reason = window.prompt("Powod zgloszenia rozmowy");
  if (!reason) return;
  const other = otherConversationProfile(getActiveConversation());
  const { error } = await supabase.from("reports").insert({
    reporter_id: state.user.id,
    reported_user_id: other?.id || null,
    conversation_id: state.activeConversationId,
    reason
  });
  if (error) throw error;
  toast("Zgloszenie wyslane do moderacji.");
}

function openPicker(mode) {
  const items = {
    emoji: ["Kciuk", "Serce", "Usmiech", "OK", "Rakieta", "Kawa", "Brawo", "Tak"],
    sticker: ["Naklejka: super", "Naklejka: dziekuje", "Naklejka: tesknie", "Naklejka: dobranoc"],
    gif: ["GIF: radosc", "GIF: brawo", "GIF: zaskoczenie", "GIF: serce"]
  }[mode] || [];
  pickerTitle.textContent = mode === "emoji" ? "Szybka reakcja" : mode === "sticker" ? "Naklejki" : "GIF";
  pickerGrid.innerHTML = "";
  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "picker-option";
    button.innerHTML = `<strong>${escapeHtml(item)}</strong>`;
    button.addEventListener("click", async () => {
      if (mode === "emoji") {
        const conversation = getActiveConversation();
        if (conversation) {
          await supabase.from("conversations").update({ quick_reaction: item }).eq("id", conversation.id);
          await loadConversations();
          render();
        }
      } else {
        await sendMessage(mode, item);
      }
      pickerModal.close();
    });
    pickerGrid.appendChild(button);
  });
  pickerModal.showModal();
  refreshIcons();
}

function openVoiceModal() {
  document.getElementById("voiceStatus").textContent = "Gotowe do nagrania po przyznaniu uprawnienia mikrofonu.";
  document.getElementById("transcriptBox").textContent = state.voiceBlob ? "Nagranie gotowe do wyslania." : "Transkrypcja pojawi sie po wyslaniu audio.";
  voiceModal.showModal();
  refreshIcons();
}

async function startVoiceRecording() {
  if (!state.activeConversationId) {
    toast("Najpierw wybierz rozmowe.");
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    toast("Ta przegladarka nie obsluguje nagrywania audio.");
    return;
  }
  state.voiceChunks = [];
  state.voiceBlob = null;
  state.voiceSeconds = 0;
  state.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
  state.mediaRecorder = new MediaRecorder(state.mediaStream, { mimeType });
  state.mediaRecorder.addEventListener("dataavailable", (event) => {
    if (event.data?.size) state.voiceChunks.push(event.data);
  });
  state.mediaRecorder.addEventListener("stop", () => {
    state.voiceBlob = new Blob(state.voiceChunks, { type: "audio/webm" });
    state.mediaStream?.getTracks().forEach((track) => track.stop());
    state.mediaStream = null;
    clearInterval(state.voiceTimer);
    document.getElementById("voiceStatus").textContent = `Nagranie gotowe: ${state.voiceSeconds}s`;
    document.getElementById("transcriptBox").textContent = "Mozesz wyslac audio albo wyslac i od razu transkrybowac.";
  });
  state.mediaRecorder.start();
  state.voiceTimer = setInterval(() => {
    state.voiceSeconds += 1;
    document.getElementById("voiceStatus").textContent = `Nagrywanie: ${state.voiceSeconds}s`;
    if (state.voiceSeconds >= MAX_VOICE_SECONDS) stopVoiceRecording();
  }, 1000);
}

function stopVoiceRecording() {
  if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") {
    state.mediaRecorder.stop();
  }
}

async function sendVoiceRecording(transcribeAfter = false) {
  if (!state.voiceBlob) {
    toast("Najpierw nagraj audio.");
    return;
  }
  const path = `${state.activeConversationId}/${state.user.id}/voice-${makeId()}.webm`;
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, state.voiceBlob, {
    contentType: "audio/webm",
    upsert: false
  });
  if (error) throw error;

  const message = await insertMessage({
    conversation_id: state.activeConversationId,
    sender_id: state.user.id,
    type: "voice",
    body: "Wiadomosc glosowa",
    attachment_path: data.path,
    attachment_name: "voice.webm",
    attachment_mime: "audio/webm",
    attachment_size: state.voiceBlob.size,
    voice_duration_seconds: state.voiceSeconds,
    transcript_status: transcribeAfter || state.profile?.auto_transcribe_voice ? "pending" : "none"
  });

  state.voiceBlob = null;
  voiceModal.close();
  await loadMessages();
  render();
  if (transcribeAfter || state.profile?.auto_transcribe_voice) {
    await requestTranscription(message.id);
  }
}

async function requestTranscription(messageId, forcedLanguage) {
  const language = forcedLanguage || document.getElementById("transcriptLanguage")?.value || "auto";
  const { data, error } = await supabase.functions.invoke("transcribeVoiceMessage", {
    body: { messageId, language: language === "auto" ? null : language }
  });
  if (error) throw error;
  document.getElementById("transcriptBox").textContent = data?.text || "Transkrypcja gotowa.";
  await loadMessages();
  renderMessages();
  refreshIcons();
}

async function getSignedUrl(path) {
  if (!path) return null;
  const cached = state.signedUrls.get(path);
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.url;
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error) throw error;
  state.signedUrls.set(path, { url: data.signedUrl, expiresAt: Date.now() + SIGNED_URL_SECONDS * 1000 });
  return data.signedUrl;
}

async function downloadAttachment(messageId) {
  const message = state.messages.find((item) => item.id === messageId);
  if (!message) return;
  const url = message.attachment_url || await getSignedUrl(message.attachment_path);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

async function playVoice(messageId) {
  const message = state.messages.find((item) => item.id === messageId);
  if (!message) return;
  const url = message.attachment_url || await getSignedUrl(message.attachment_path);
  if (!url) return;
  await new Audio(url).play();
}

async function uploadAndSendFiles(files) {
  if (!files.length || !state.activeConversationId) return;
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      toast(`${file.name} przekracza 100 MB.`);
      continue;
    }
    const path = `${state.activeConversationId}/${state.user.id}/${makeId()}-${safeFileName(file.name)}`;
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });
    if (error) {
      toast(error.message);
      continue;
    }
    const type = file.type?.startsWith("image/") ? "image" : file.type?.startsWith("video/") ? "video" : "file";
    await sendMessage(type, file.name, {
      attachment_path: data.path,
      attachment_name: file.name,
      attachment_mime: file.type || "application/octet-stream",
      attachment_size: file.size
    });
  }
}

function openSettings() {
  document.getElementById("settingsTitle").textContent = "Ustawienia";
  settingsLayout.innerHTML = `
    <div class="settings-menu">
      <button class="list-button" id="editDisplayName"><i data-lucide="user-round"></i>Nazwa profilu</button>
      <button class="list-button" id="editUsername"><i data-lucide="at-sign"></i>Username</button>
      <button class="list-button" id="editStatus"><i data-lucide="message-square-text"></i>Status</button>
      <button class="list-button" id="toggleReadReceipts"><i data-lucide="check-check"></i>Potwierdzenia odczytu: ${state.profile?.read_receipts_enabled ? "wlaczone" : "wylaczone"}</button>
      <button class="list-button" id="toggleAutoTranscript"><i data-lucide="captions"></i>Auto-transkrypcja: ${state.profile?.auto_transcribe_voice ? "wlaczona" : "wylaczona"}</button>
      <button class="list-button" id="showPwaInstall"><i data-lucide="smartphone"></i>Instalacja Android/iPhone</button>
      <button class="list-button" id="logoutButton"><i data-lucide="log-out"></i>Wyloguj</button>
    </div>
    <div class="settings-content">
      <h3>${escapeHtml(state.profile?.display_name || "Profil")}</h3>
      <div class="settings-row"><span>Username</span><strong>${escapeHtml(state.profile?.username || "")}</strong></div>
      <div class="settings-row"><span>Rola</span><strong>${escapeHtml(state.profile?.role || "member")}</strong></div>
      <div class="settings-row"><span>Status</span><span>${escapeHtml(state.profile?.status_text || "")}</span></div>
      <p class="preview">Polaczenia audio/wideo live sa ukryte do czasu wdrozenia WebRTC.</p>
    </div>
  `;
  settingsLayout.querySelector("#editDisplayName").addEventListener("click", () => updateProfileText("display_name", "Nowa nazwa profilu").catch((error) => toast(error.message)));
  settingsLayout.querySelector("#editUsername").addEventListener("click", () => updateProfileText("username", "Nowy username").catch((error) => toast(error.message)));
  settingsLayout.querySelector("#editStatus").addEventListener("click", () => updateProfileText("status_text", "Nowy status").catch((error) => toast(error.message)));
  settingsLayout.querySelector("#toggleReadReceipts").addEventListener("click", () => toggleProfileBoolean("read_receipts_enabled").catch((error) => toast(error.message)));
  settingsLayout.querySelector("#toggleAutoTranscript").addEventListener("click", () => toggleProfileBoolean("auto_transcribe_voice").catch((error) => toast(error.message)));
  settingsLayout.querySelector("#showPwaInstall").addEventListener("click", showPwaInstall);
  settingsLayout.querySelector("#logoutButton").addEventListener("click", async () => {
    await supabase.auth.signOut();
  });
  settingsModal.showModal();
  refreshIcons();
}

async function updateProfileText(field, label) {
  const value = window.prompt(label, state.profile?.[field] || "");
  if (!value) return;
  const { error } = await supabase.from("profiles").update({ [field]: value.trim() }).eq("id", state.user.id);
  if (error) throw error;
  await loadCurrentUser();
  openSettings();
}

async function toggleProfileBoolean(field) {
  const { error } = await supabase.from("profiles").update({ [field]: !state.profile[field] }).eq("id", state.user.id);
  if (error) throw error;
  await loadCurrentUser();
  openSettings();
}

function showPwaInstall() {
  settingsLayout.querySelector(".settings-content").innerHTML = `
    <h3>Instalacja</h3>
    <p>Android: pobierz testowe APK albo otworz strone w Chrome i wybierz instalacje aplikacji.</p>
    <p><a class="download-link" href="downloads/bliskochat-debug.apk" download>Pobierz APK na Androida</a></p>
    <p>iPhone: otworz w Safari, wybierz udostepnianie i dodaj do ekranu poczatkowego.</p>
  `;
  refreshIcons();
}

async function sendFriendRequest() {
  const username = window.prompt("Username osoby do dodania");
  if (!username) return;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username.trim())
    .maybeSingle();
  if (error) throw error;
  if (!profile) {
    toast("Nie znaleziono uzytkownika.");
    return;
  }
  const { error: insertError } = await supabase.from("friendships").upsert({
    requester_id: state.user.id,
    addressee_id: profile.id,
    status: "pending"
  }, { onConflict: "requester_id,addressee_id" });
  if (insertError) throw insertError;
  await loadFriendships();
  await renderContactsView();
}

async function respondFriendship(id, status) {
  const patch = { status };
  if (status === "accepted") patch.accepted_at = new Date().toISOString();
  const { error } = await supabase.from("friendships").update(patch).eq("id", id);
  if (error) throw error;
  await loadFriendships();
  await renderContactsView();
}

function friendshipName(row) {
  const otherId = row.requester_id === state.user.id ? row.addressee_id : row.requester_id;
  const profile = state.profiles[otherId];
  return profile?.display_name || profile?.username || "Uzytkownik";
}

async function renderContactsView() {
  await loadFriendships();
  sectionTitle.textContent = "Kontakty";
  const accepted = state.friendships.filter((row) => row.status === "accepted");
  const incoming = state.friendships.filter((row) => row.status === "pending" && row.addressee_id === state.user.id);
  const outgoing = state.friendships.filter((row) => row.status === "pending" && row.requester_id === state.user.id);
  conversationList.innerHTML = `
    <div class="details-card">
      <h3>Znajomi</h3>
      <button class="primary-button full-width" id="addFriendButton" type="button">Dodaj po username</button>
    </div>
    ${incoming.length ? `<div class="details-card"><h3>Prosby</h3>${incoming.map((row) => `
      <div class="settings-row">
        <span>${escapeHtml(friendshipName(row))}</span>
        <span>
          <button class="mini-action" data-accept-friend="${row.id}">Akceptuj</button>
          <button class="mini-action" data-decline-friend="${row.id}">Odrzuc</button>
        </span>
      </div>
    `).join("")}</div>` : ""}
    <div class="details-card">
      <h3>Lista kontaktow</h3>
      ${accepted.length ? accepted.map((row) => `<button class="list-button" data-chat-username="${escapeHtml(state.profiles[row.requester_id === state.user.id ? row.addressee_id : row.requester_id]?.username || "")}">${escapeHtml(friendshipName(row))}</button>`).join("") : "<p class='preview'>Brak zaakceptowanych kontaktow.</p>"}
    </div>
    ${outgoing.length ? `<div class="details-card"><h3>Wyslane prosby</h3>${outgoing.map((row) => `<p class="preview">${escapeHtml(friendshipName(row))}</p>`).join("")}</div>` : ""}
  `;
  conversationList.querySelector("#addFriendButton").addEventListener("click", () => sendFriendRequest().catch((error) => toast(error.message)));
  conversationList.querySelectorAll("[data-accept-friend]").forEach((button) => {
    button.addEventListener("click", () => respondFriendship(button.dataset.acceptFriend, "accepted").catch((error) => toast(error.message)));
  });
  conversationList.querySelectorAll("[data-decline-friend]").forEach((button) => {
    button.addEventListener("click", () => respondFriendship(button.dataset.declineFriend, "declined").catch((error) => toast(error.message)));
  });
  conversationList.querySelectorAll("[data-chat-username]").forEach((button) => {
    button.addEventListener("click", () => startChatWithUsername(button.dataset.chatUsername).catch((error) => toast(error.message)));
  });
}

async function renderNotificationsView() {
  await loadFriendships();
  sectionTitle.textContent = "Powiadomienia";
  const incoming = state.friendships.filter((row) => row.status === "pending" && row.addressee_id === state.user.id);
  conversationList.innerHTML = `
    <div class="details-card">
      <h3>Prosby o kontakt</h3>
      ${incoming.length ? incoming.map((row) => `<div class="settings-row"><span>${escapeHtml(friendshipName(row))}</span><button class="mini-action" data-accept-friend="${row.id}">Akceptuj</button></div>`).join("") : "<p class='preview'>Brak nowych prosb.</p>"}
    </div>
  `;
  conversationList.querySelectorAll("[data-accept-friend]").forEach((button) => {
    button.addEventListener("click", () => respondFriendship(button.dataset.acceptFriend, "accepted").catch((error) => toast(error.message)));
  });
}

async function renderAdminView() {
  sectionTitle.textContent = "Admin";
  if (!isAdmin()) {
    conversationList.innerHTML = `<div class="details-card"><h3>Brak uprawnien</h3><p>Panel widza tylko moderatorzy i administratorzy.</p></div>`;
    return;
  }
  const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  conversationList.innerHTML = `
    <div class="details-card"><h3>Zgloszenia</h3><p class="preview">Ostatnie 50 zgloszen.</p></div>
    ${(data || []).map((report) => `
      <div class="details-card">
        <h3>${escapeHtml(report.reason)}</h3>
        <p class="preview">${formatTime(report.created_at)} - ${escapeHtml(report.status)}</p>
        <div class="action-list">
          <button class="list-button" data-report-status="${report.id}:reviewing">Oznacz jako sprawdzane</button>
          <button class="list-button" data-report-status="${report.id}:resolved">Rozwiazane</button>
          <button class="list-button" data-report-status="${report.id}:dismissed">Oddalone</button>
        </div>
      </div>
    `).join("")}
  `;
  conversationList.querySelectorAll("[data-report-status]").forEach((button) => {
    button.addEventListener("click", async () => {
      const [id, status] = button.dataset.reportStatus.split(":");
      const { error: updateError } = await supabase.from("reports").update({ status }).eq("id", id);
      if (updateError) toast(updateError.message);
      else await renderAdminView();
    });
  });
}

async function renderUtilityView(view) {
  if (view === "contacts") return renderContactsView();
  if (view === "notifications") return renderNotificationsView();
  if (view === "admin") return renderAdminView();
  if (view === "groups") {
    state.activeFilter = "groups";
    renderConversationList();
  }
}

function bindUi() {
  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!authForm.reportValidity()) return;
    setAuthBusy(true, "Logowanie...");
    try {
      await login(document.getElementById("authEmail").value, document.getElementById("authPassword").value);
      setAuthStatus("Zalogowano. Laduje rozmowy...", "success");
    } catch (error) {
      setAuthStatus(humanizeAuthError(error), "error");
    } finally {
      setAuthBusy(false);
    }
  });

  document.getElementById("registerButton").addEventListener("click", async () => {
    if (!authForm.reportValidity()) return;
    setAuthBusy(true, "Tworzenie konta...");
    try {
      const message = await register(document.getElementById("authEmail").value, document.getElementById("authPassword").value);
      setAuthStatus(message, "success");
    } catch (error) {
      setAuthStatus(humanizeAuthError(error), "error");
    } finally {
      setAuthBusy(false);
    }
  });

  composer.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await sendMessage();
    } catch (error) {
      toast(error.message);
    }
  });

  searchInput.addEventListener("input", () => {
    if (state.activeView === "chats") renderConversationList();
  });
  document.getElementById("newChatButton").addEventListener("click", () => createConversation().catch((error) => toast(error.message)));
  document.getElementById("emojiButton").addEventListener("click", () => openPicker("emoji"));
  document.getElementById("stickerButton").addEventListener("click", () => openPicker("sticker"));
  document.getElementById("gifButton").addEventListener("click", () => openPicker("gif"));
  document.getElementById("voiceButton").addEventListener("click", openVoiceModal);
  document.getElementById("startVoiceButton").addEventListener("click", () => startVoiceRecording().catch((error) => toast(error.message)));
  document.getElementById("stopVoiceButton").addEventListener("click", stopVoiceRecording);
  document.getElementById("sendVoiceButton").addEventListener("click", () => sendVoiceRecording(false).catch((error) => toast(error.message)));
  document.getElementById("transcribeButton").addEventListener("click", () => sendVoiceRecording(true).catch((error) => toast(error.message)));
  document.getElementById("attachButton").addEventListener("click", () => document.getElementById("fileInput").click());
  document.getElementById("fileInput").addEventListener("change", (event) => {
    uploadAndSendFiles(Array.from(event.target.files || [])).catch((error) => toast(error.message));
    event.target.value = "";
  });
  document.getElementById("applyThemeButton").addEventListener("click", () => applySelectedTheme().catch((error) => toast(error.message)));
  document.getElementById("resetThemeButton").addEventListener("click", () => {
    pendingThemeId = "classic";
    renderThemeGrid();
    renderThemePreview();
  });
  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog")?.close());
  });
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeFilter = button.dataset.filter;
      state.activeView = state.activeFilter === "requests" ? "notifications" : "chats";
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      if (state.activeFilter === "requests") renderNotificationsView().catch((error) => toast(error.message));
      else renderConversationList();
    });
  });
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeView = button.dataset.view;
      document.querySelectorAll("[data-view]").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(`[data-view="${button.dataset.view}"]`).forEach((item) => item.classList.add("active"));
      if (button.dataset.view === "settings") openSettings();
      else if (button.dataset.view === "chats") {
        state.activeFilter = "all";
        renderConversationList();
      } else {
        renderUtilityView(button.dataset.view).catch((error) => toast(error.message));
      }
      app.classList.remove("chat-open");
      refreshIcons();
    });
  });
  refreshIcons();
}

function toast(text) {
  const item = document.createElement("div");
  item.textContent = text;
  Object.assign(item.style, {
    position: "fixed",
    left: "50%",
    bottom: "74px",
    transform: "translateX(-50%)",
    background: "var(--text)",
    color: "var(--panel)",
    padding: "10px 14px",
    borderRadius: "8px",
    zIndex: 50,
    maxWidth: "min(520px, calc(100vw - 32px))"
  });
  document.body.appendChild(item);
  setTimeout(() => item.remove(), 3600);
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}

init().catch((error) => {
  showAuth();
  renderEmptyApp();
  toast(error.message);
});
