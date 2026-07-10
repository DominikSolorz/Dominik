import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.108.0/+esm";

const config = window.LINKTALK_CONFIG || window.BLISKOCHAT_CONFIG || {};
const hasBackend = Boolean(config.supabaseUrl && config.supabaseAnonKey);
const supabase = hasBackend ? createClient(config.supabaseUrl, config.supabaseAnonKey) : null;
const publicAppUrl = normalizeAppUrl(config.publicAppUrl);
const apkUrl = String(config.apkUrl || "").trim();

const STORAGE_BUCKET = "chat-files";
const SIGNED_URL_SECONDS = 600;
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_VOICE_SECONDS = 300;
const OFFLINE_CACHE_VERSION = 1;
const MAX_CACHED_MESSAGES_PER_CONVERSATION = 80;
const MIN_APK_DOWNLOAD_BYTES = 8 * 1024;
const LEGAL_VERSION = "2026-07-09";
const BRAND_NAME = "LinkTalk";
const BUILD_VERSION = String(window.LINKTALK_BUILD || "2026.07.10-09");
const ADMIN_CONTACT = {
  controller: "Dominik Solorz",
  address: "ul. Piastowska 2/1, 40-005 Katowice",
  phone: "795-731-886",
  email: "goldservicepoland@linktalk.pl",
  eDelivery: "AE:PL-90075-94799-GARAS-26",
  epuap: "DominikSolorz436"
};

const state = {
  user: null,
  profile: null,
  privateProfile: null,
  privateProfileMode: null,
  conversations: [],
  memberships: [],
  conversationMembers: [],
  profiles: {},
  messages: [],
  lastMessagesByConversation: {},
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
  voiceTimer: null,
  queuedMessages: [],
  cachedMessagesByConversation: {},
  cachedReactionsByConversation: {},
  cachedReadsByConversation: {},
  isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false,
  isSyncingQueue: false,
  lastSyncAt: null,
  pendingPhoneVerification: ""
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
const authPanelShell = document.getElementById("authPanelShell");
const authPanelTitle = document.getElementById("authPanelTitle");
const authPanelEyebrow = document.getElementById("authPanelEyebrow");
const authPanelCopy = document.getElementById("authPanelCopy");
const authPrimaryButton = document.getElementById("authPrimaryButton");
const authSecondaryModeButton = document.getElementById("authSecondaryModeButton");
const authClosePanelButton = document.getElementById("authClosePanelButton");
const authTopLoginButton = document.getElementById("authTopLoginButton");
const authTopRegisterButton = document.getElementById("authTopRegisterButton");
const authTopInstallButton = document.getElementById("authTopInstallButton");
const heroLoginButton = document.getElementById("heroLoginButton");
const heroRegisterButton = document.getElementById("heroRegisterButton");
const heroInstallButton = document.getElementById("heroInstallButton");
const listenLandingButton = document.getElementById("listenLandingButton");
const listenTermsButton = document.getElementById("listenTermsButton");
const listenPrivacyButton = document.getElementById("listenPrivacyButton");
const setupWarning = document.getElementById("setupWarning");
const authStatus = document.getElementById("authStatus");
const connectionBanner = document.getElementById("connectionBanner");
const authOfflineBanner = document.getElementById("authOfflineBanner");
const authDownloadLink = document.getElementById("authDownloadLink");
const authDownloadHint = document.getElementById("authDownloadHint");
const authInstallButton = document.getElementById("authInstallButton");
const authLoginModeButton = document.getElementById("authLoginModeButton");
const authRegisterModeButton = document.getElementById("authRegisterModeButton");
const authRegisterFields = document.getElementById("authRegisterFields");
const authFullName = document.getElementById("authFullName");
const authPhone = document.getElementById("authPhone");
const authLegalConsent = document.getElementById("authLegalConsent");
const authEmailOtpPanel = document.getElementById("authEmailOtpPanel");
const authEmailOtp = document.getElementById("authEmailOtp");
const verifyEmailOtpButton = document.getElementById("verifyEmailOtpButton");
const resendConfirmationButton = document.getElementById("resendConfirmationButton");
const authRateLimitHelpButton = document.getElementById("authRateLimitHelpButton");
const buildBadge = document.getElementById("buildBadge");
const refreshAppButton = document.getElementById("refreshAppButton");
const authActionRow = document.getElementById("authActionRow");
const authPassword = document.getElementById("authPassword");
const toggleAuthPasswordButton = document.getElementById("toggleAuthPasswordButton");
const authAltLogin = document.getElementById("authAltLogin");
const sendEmailCodeButton = document.getElementById("sendEmailCodeButton");
const conversationList = document.getElementById("conversationList");
const chatHeader = document.getElementById("chatHeader");
const messagesEl = document.getElementById("messages");
const detailsPanel = document.getElementById("detailsPanel");
const pinnedBanner = document.getElementById("pinnedBanner");
const messageInput = document.getElementById("messageInput");
const composer = document.getElementById("composer");
const searchInput = document.getElementById("searchInput");
const sectionTitle = document.getElementById("sectionTitle");
const sectionSubtitle = document.getElementById("sectionSubtitle");
const storyStrip = document.getElementById("storyStrip");
const filtersBar = document.getElementById("filters");
const inboxSettingsButton = document.getElementById("inboxSettingsButton");
const openAiButton = document.getElementById("openAiButton");
const themeModal = document.getElementById("themeModal");
const themeGrid = document.getElementById("themeGrid");
const themePreview = document.getElementById("themePreview");
const pickerModal = document.getElementById("pickerModal");
const pickerGrid = document.getElementById("pickerGrid");
const pickerTitle = document.getElementById("pickerTitle");
const voiceModal = document.getElementById("voiceModal");
const settingsModal = document.getElementById("settingsModal");
const settingsLayout = document.getElementById("settingsLayout");
const verificationModal = document.getElementById("verificationModal");
const verificationContent = document.getElementById("verificationContent");
const infoModal = document.getElementById("infoModal");
const infoTitle = document.getElementById("infoTitle");
const infoContent = document.getElementById("infoContent");
const listenInfoButton = document.getElementById("listenInfoButton");
const runtimeSiteValue = document.getElementById("runtimeSiteValue");
const runtimeSiteNote = document.getElementById("runtimeSiteNote");
const runtimeDataValue = document.getElementById("runtimeDataValue");
const runtimeDataNote = document.getElementById("runtimeDataNote");
const runtimeApkValue = document.getElementById("runtimeApkValue");
const runtimeApkNote = document.getElementById("runtimeApkNote");
const runtimeOfflineValue = document.getElementById("runtimeOfflineValue");
const runtimeOfflineNote = document.getElementById("runtimeOfflineNote");

let pendingThemeId = "classic";
let lastAuthEmail = "";
let resendCooldownUntil = 0;
let resendCooldownTimer = null;
let apkDownloadChecked = false;
let apkDownloadAvailable = false;
let deferredInstallPrompt = null;
let authMode = "login";
let authPanelOpen = false;
let lastEmailFlow = "signup";
let currentInfoDocumentKind = "terms";
let infoNarrationActive = false;
let landingNarrationActive = false;
let runtimeHealth = null;

const infoDocuments = {
  terms: {
    title: "Regulamin",
    intro: `${BRAND_NAME} jest prywatnym komunikatorem do rozmow, plikow, wiadomosci glosowych oraz czatow grupowych. Regulamin opisuje podstawowe zasady korzystania z uslugi w wersji ${LEGAL_VERSION}.`,
    sections: [
      {
        heading: "Postanowienia ogolne",
        paragraphs: [
          `${BRAND_NAME} jest prowadzony przez ${ADMIN_CONTACT.controller}, ${ADMIN_CONTACT.address}.`,
          "Aplikacja sluzy do prywatnej komunikacji, przesylania tresci multimedialnych i synchronizacji rozmow miedzy urzadzeniami uzytkownika."
        ]
      },
      {
        heading: "Konto, logowanie i weryfikacja",
        paragraphs: [
          "Rejestracja odbywa sie przez Supabase Auth przy uzyciu adresu email i hasla. Uzytkownik powinien podawac prawdziwe dane potrzebne do obslugi konta i bezpieczenstwa komunikacji.",
          "Nowe konto moze wymagac potwierdzenia adresu email oraz potwierdzenia numeru telefonu kodem SMS. Bezpieczne dzialanie emaili i SMS zalezy od poprawnej konfiguracji SMTP oraz dostawcy wiadomosci w panelu administracyjnym Supabase."
        ]
      },
      {
        heading: "Zasady korzystania",
        paragraphs: [
          "Nie wolno wysylac spamu, tresci bezprawnych, naruszajacych dobra osobiste, praw autorskich ani prywatnosci innych osob.",
          "Administrator moze ograniczyc funkcje, zablokowac konto lub usunac tresci, jezeli sa wykorzystywane do naduzyc, podszywania sie, oszustw albo atakow na bezpieczenstwo uslugi."
        ]
      },
      {
        heading: "Wiadomosci, pliki i odpowiedzialnosc",
        paragraphs: [
          "Wiadomosci, pliki, glosowki, reakcje, blokady i zgloszenia sa zapisywane w uslugach infrastrukturalnych podlaczonych do tej instancji aplikacji, w tym w Supabase Storage, Database i Realtime.",
          "Administrator odpowiada za techniczna konfiguracje aplikacji, ale uzytkownik odpowiada za materialy, ktore wysyla, oraz za bezpieczenstwo swojego hasla, kodow potwierdzajacych i urzadzen."
        ]
      },
      {
        heading: "Kontakt i reklamacje",
        paragraphs: [
          `Kontakt z administratorem: ${ADMIN_CONTACT.email}, tel. ${ADMIN_CONTACT.phone}, e-Doreczenia: ${ADMIN_CONTACT.eDelivery}, ePUAP: ${ADMIN_CONTACT.epuap}.`,
          "W sprawach dotyczacych konta, prywatnosci, usuniecia danych albo naruszen bezpieczenstwa nalezy kontaktowac sie bezposrednio z administratorem."
        ]
      }
    ]
  },
  privacy: {
    title: "Polityka prywatnosci",
    intro: `${BRAND_NAME} przetwarza dane potrzebne do logowania, bezpieczenstwa konta, komunikacji miedzy uzytkownikami oraz obslugi danych prywatnych przechowywanych w szyfrowanym sejfie aplikacji.`,
    sections: [
      {
        heading: "Administrator danych",
        paragraphs: [
          `${ADMIN_CONTACT.controller}, ${ADMIN_CONTACT.address}.`,
          `Kontakt: ${ADMIN_CONTACT.email}, tel. ${ADMIN_CONTACT.phone}, e-Doreczenia: ${ADMIN_CONTACT.eDelivery}, ePUAP: ${ADMIN_CONTACT.epuap}.`
        ]
      },
      {
        heading: "Zakres danych",
        bullets: [
          "dane konta w Supabase Auth: email, haslo, znaczniki potwierdzenia emaila i telefonu",
          "publiczny profil czatu: nazwa, username, status, avatar, ustawienia rozmow i ustawienia prywatnosci",
          "profil prywatny: imie i nazwisko, numer telefonu, adres zamieszkania, PESEL, znaczniki zgody",
          "wiadomosci, reakcje, pliki, raporty, blokady, logi techniczne i metadane bezpieczenstwa",
          "nagrania audio przekazane do transkrypcji tylko wtedy, gdy uzytkownik uruchomi taka funkcje"
        ]
      },
      {
        heading: "Cele i podstawa przetwarzania",
        paragraphs: [
          "Dane sa przetwarzane w celu zalozenia i utrzymania konta, dostarczenia komunikatora, wysylki wiadomosci, obslugi kontaktow, ochrony przed naduzyciami oraz realizacji zadan administracyjnych i bezpieczenstwa.",
          "Dane dodatkowe, takie jak telefon, adres czy PESEL, sa zapisywane na prosbe uzytkownika lub gdy sa potrzebne do obslugi konta, weryfikacji i zgodnosci organizacyjnej."
        ]
      },
      {
        heading: "Odbiorcy danych i narzedzia",
        paragraphs: [
          "Dane moga byc przetwarzane przez zaufanych dostawcow infrastruktury: Supabase, hosting WWW/VPS, dostawce SMTP do maili, dostawce SMS do kodow oraz OpenAI do transkrypcji glosu, jesli uzytkownik wlaczy te funkcje.",
          "Dane prywatne nie sa publikowane w publicznym profilu rozmow. Telefon, adres i PESEL sa odczytywane przez aplikacje przez funkcje serwerowa, a nie bezposrednio z publicznej tabeli czatu."
        ]
      },
      {
        heading: "Okres przechowywania i prawa",
        paragraphs: [
          "Dane sa przechowywane tak dlugo, jak jest to potrzebne do utrzymania konta, historii rozmow i bezpieczenstwa uslugi, chyba ze uzytkownik poprosi o ich usuniecie lub konto zostanie zamkniete.",
          "Uzytkownik ma prawo dostepu do swoich danych, ich poprawienia, ograniczenia przetwarzania, usuniecia oraz wniesienia skargi do organu nadzorczego. Wniosek mozna zlozyc na dane kontaktowe administratora."
        ]
      }
    ]
  },
  rateLimit: {
    title: "Pomoc 429",
    intro: "Blad 429 przy rejestracji najczesciej oznacza limit wysylki maili potwierdzajacych po stronie Supabase Auth albo zbyt czeste ponawianie prob rejestracji lub resend.",
    sections: [
      {
        heading: "Co zrobic teraz",
        bullets: [
          "odczekaj chwile i nie klikaj rejestracji ani resend kilka razy pod rzad",
          "domyslna wysylka testowa Supabase potrafi zatrzymac sie nawet przy 2 mailach na godzine",
          "sprawdz w Supabase: Authentication -> Providers -> Email",
          "do prywatnych testow mozesz tymczasowo ustawic Confirm email na OFF",
          "po zmianie odswiez strone i sprobuj utworzyc konto jeszcze raz"
        ]
      },
      {
        heading: "Co ustawic docelowo",
        paragraphs: [
          "Dla publicznej wersji zostaw potwierdzanie emaila wlaczone, ustaw wlasny SMTP i uzyj profesjonalnego szablonu maila z logo aplikacji.",
          "Dla SMS trzeba wlaczyc Phone Auth oraz dostawce wiadomosci lub Send SMS Hook. W aplikacji dodany jest cooldown i ponowna wysylka, zeby ograniczyc zderzenia z limitami."
        ]
      }
    ]
  }
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeAppUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const resolved = new URL(raw, window.location.href);
    resolved.hash = "";
    resolved.search = "";
    return resolved.toString();
  } catch {
    return "";
  }
}

function currentUserMetadata() {
  return state.user?.user_metadata || {};
}

function normalizePhoneInput(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return `+${raw.slice(1).replace(/\D/g, "")}`;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 9) return `+48${digits}`;
  if (digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return raw;
}

function isValidPhoneNumber(value = "") {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

function maskPhoneNumber(value = "") {
  const normalized = normalizePhoneInput(value);
  if (!normalized) return "Nie podano";
  if (normalized.length <= 5) return normalized;
  return `${normalized.slice(0, 3)} *** *** ${normalized.slice(-3)}`;
}

function registrationFallbackName() {
  return state.user?.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 18) || "uzytkownik";
}

function verificationState() {
  const metadata = currentUserMetadata();
  const pendingPhone = normalizePhoneInput(metadata.pending_phone || state.pendingPhoneVerification || state.privateProfile?.phone || "");
  const confirmedPhone = normalizePhoneInput(state.user?.phone || "");
  const phone = confirmedPhone || pendingPhone;
  return {
    emailConfirmed: Boolean(state.user?.email_confirmed_at),
    phoneConfirmed: Boolean(state.user?.phone_confirmed_at),
    phone,
    pendingPhone,
    needsPhoneVerification: Boolean(phone) && !state.user?.phone_confirmed_at,
    legalAccepted: Boolean(metadata.terms_accepted_at && metadata.privacy_accepted_at)
  };
}

async function refreshAuthenticatedUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (data?.user) state.user = data.user;
  return state.user;
}

async function updateCurrentUserMetadata(patch = {}) {
  const merged = { ...currentUserMetadata(), ...patch };
  Object.keys(merged).forEach((key) => {
    if (merged[key] == null || merged[key] === "") delete merged[key];
  });
  const { data, error } = await supabase.auth.updateUser({ data: merged });
  if (error) throw error;
  if (data?.user) state.user = data.user;
  return state.user;
}

async function syncLegalAcceptances() {
  if (!state.user) return;
  const metadata = currentUserMetadata();
  const version = String(metadata.legal_version || LEGAL_VERSION);
  const rows = [];

  if (metadata.terms_accepted_at) {
    rows.push({
      user_id: state.user.id,
      document_type: "terms",
      version,
      accepted_at: metadata.terms_accepted_at,
      source: "auth_metadata"
    });
  }

  if (metadata.privacy_accepted_at) {
    rows.push({
      user_id: state.user.id,
      document_type: "privacy",
      version,
      accepted_at: metadata.privacy_accepted_at,
      source: "auth_metadata"
    });
  }

  if (!rows.length) return;

  const { error } = await supabase
    .from("legal_acceptances")
    .upsert(rows, { onConflict: "user_id,document_type,version" });

  if (error) {
    const message = String(error.message || "");
    if (message.includes("relation") && message.includes("legal_acceptances")) {
      console.warn("Tabela legal_acceptances nie jest jeszcze wdrozona w Supabase.");
      return;
    }
    throw error;
  }
}

function isStandaloneApp() {
  return Boolean(window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true);
}

function emptyPrivateProfile() {
  return {
    full_name: "",
    phone: "",
    home_address: "",
    pesel: "",
    data_consent_at: null,
    updated_at: null
  };
}

function normalizePrivateProfileRecord(profile = {}) {
  return {
    ...emptyPrivateProfile(),
    ...profile,
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    home_address: profile?.home_address || "",
    pesel: profile?.pesel || "",
    data_consent_at: profile?.data_consent_at || null,
    updated_at: profile?.updated_at || profile?.created_at || null
  };
}

function hasSavedPrivateProfile(profile = state.privateProfile) {
  if (!profile) return false;
  return Boolean(profile.full_name || profile.phone || profile.home_address || profile.pesel || profile.data_consent_at);
}

function privateProfileModeLabel(mode = state.privateProfileMode) {
  if (mode === "legacy-plaintext") return "Starszy zapis do migracji";
  if (mode === "compatibility") return "Tryb zgodnosci";
  return "Szyfrowany sejf serwerowy";
}

function isVaultFunctionIssue(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("edge function")
    || message.includes("failed to send a request")
    || message.includes("functionsfetcherror")
    || message.includes("non-2xx")
    || message.includes("not found")
    || message.includes("missing server configuration");
}

function offlineStorageKey(kind, userId = state.user?.id) {
  return userId ? `linktalk-offline-v${OFFLINE_CACHE_VERSION}:${kind}:${userId}` : null;
}

function readStoredJson(key, fallback) {
  if (!key) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredJson(key, value) {
  if (!key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function isOfflineLikeError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return !navigator.onLine
    || message.includes("failed to fetch")
    || message.includes("network")
    || message.includes("fetch")
    || message.includes("offline")
    || message.includes("load failed");
}

function normalizeCachedMessages(messages) {
  const unique = new Map();
  (messages || []).forEach((message) => {
    unique.set(message.local_id || message.id, message);
  });
  return [...unique.values()]
    .sort((left, right) => new Date(left.created_at || 0) - new Date(right.created_at || 0))
    .slice(-MAX_CACHED_MESSAGES_PER_CONVERSATION);
}

function sortConversationsInState() {
  state.conversations.sort((left, right) => {
    const leftPinned = state.memberships.find((item) => item.conversation_id === left.id)?.pinned ? 1 : 0;
    const rightPinned = state.memberships.find((item) => item.conversation_id === right.id)?.pinned ? 1 : 0;
    if (leftPinned !== rightPinned) return rightPinned - leftPinned;
    return new Date(right.updated_at || 0) - new Date(left.updated_at || 0);
  });
}

function cacheConversationState(conversationId, messages = state.messages, reactions = state.reactions, reads = state.reads) {
  if (!conversationId) return;
  state.cachedMessagesByConversation[conversationId] = normalizeCachedMessages(messages);
  state.cachedReactionsByConversation[conversationId] = [...(reactions || [])];
  state.cachedReadsByConversation[conversationId] = [...(reads || [])];
}

function restoreCachedConversation(conversationId) {
  if (!conversationId) {
    state.messages = [];
    state.reactions = [];
    state.reads = [];
    return false;
  }
  state.messages = [...(state.cachedMessagesByConversation[conversationId] || [])];
  state.reactions = [...(state.cachedReactionsByConversation[conversationId] || [])];
  state.reads = [...(state.cachedReadsByConversation[conversationId] || [])];
  return Boolean(state.messages.length || state.queuedMessages.some((message) => message.conversation_id === conversationId));
}

function mergeQueuedMessagesIntoCaches() {
  state.queuedMessages.forEach((queuedMessage) => {
    const conversationId = queuedMessage.conversation_id;
    const cached = state.cachedMessagesByConversation[conversationId] || [];
    state.cachedMessagesByConversation[conversationId] = normalizeCachedMessages([...cached, queuedMessage]);
  });
}

function persistOfflineState() {
  if (!state.user?.id) return;
  cacheConversationState(state.activeConversationId);
  const snapshot = {
    profile: state.profile,
    conversations: state.conversations,
    memberships: state.memberships,
    conversationMembers: state.conversationMembers,
    profiles: state.profiles,
    friendships: state.friendships,
    activeConversationId: state.activeConversationId,
    cachedMessagesByConversation: state.cachedMessagesByConversation,
    cachedReactionsByConversation: state.cachedReactionsByConversation,
    cachedReadsByConversation: state.cachedReadsByConversation,
    lastSyncAt: state.lastSyncAt
  };
  writeStoredJson(offlineStorageKey("snapshot"), snapshot);
  writeStoredJson(offlineStorageKey("queue"), state.queuedMessages);
}

function hydrateOfflineState(userId = state.user?.id) {
  const snapshot = readStoredJson(offlineStorageKey("snapshot", userId), null);
  if (!snapshot) return false;
  state.profile = snapshot.profile || state.profile;
  state.privateProfile = null;
  state.conversations = snapshot.conversations || [];
  state.memberships = snapshot.memberships || [];
  state.conversationMembers = snapshot.conversationMembers || [];
  state.profiles = snapshot.profiles || {};
  state.friendships = snapshot.friendships || [];
  state.activeConversationId = state.activeConversationId || snapshot.activeConversationId || state.conversations[0]?.id || null;
  state.cachedMessagesByConversation = snapshot.cachedMessagesByConversation || {};
  state.cachedReactionsByConversation = snapshot.cachedReactionsByConversation || {};
  state.cachedReadsByConversation = snapshot.cachedReadsByConversation || {};
  state.lastSyncAt = snapshot.lastSyncAt || state.lastSyncAt;
  state.queuedMessages = readStoredJson(offlineStorageKey("queue", userId), []);
  mergeQueuedMessagesIntoCaches();
  sortConversationsInState();
  restoreCachedConversation(state.activeConversationId);
  return true;
}

function touchConversationLocally(conversationId, updatedAt = new Date().toISOString()) {
  const conversation = state.conversations.find((item) => item.id === conversationId);
  if (conversation) conversation.updated_at = updatedAt;
  sortConversationsInState();
}

function queueMessageLocally(record) {
  const now = new Date().toISOString();
  const localId = `local-${makeId()}`;
  const queuedMessage = {
    ...record,
    id: localId,
    local_id: localId,
    local_status: "queued",
    local_only: true,
    created_at: now
  };
  state.queuedMessages = [...state.queuedMessages, queuedMessage];
  state.lastMessagesByConversation[record.conversation_id] = queuedMessage;
  if (record.conversation_id === state.activeConversationId) {
    state.messages = [...state.messages, queuedMessage];
    cacheConversationState(record.conversation_id, state.messages, state.reactions, state.reads);
  } else {
    const cached = state.cachedMessagesByConversation[record.conversation_id] || [];
    state.cachedMessagesByConversation[record.conversation_id] = normalizeCachedMessages([...cached, queuedMessage]);
  }
  touchConversationLocally(record.conversation_id, now);
  persistOfflineState();
  renderConnectionStatus();
  return queuedMessage;
}

function removeQueuedMessage(localId, conversationId) {
  state.queuedMessages = state.queuedMessages.filter((message) => message.local_id !== localId);
  if (conversationId === state.activeConversationId) {
    state.messages = state.messages.filter((message) => message.local_id !== localId);
  }
  if (state.cachedMessagesByConversation[conversationId]) {
    state.cachedMessagesByConversation[conversationId] = state.cachedMessagesByConversation[conversationId]
      .filter((message) => message.local_id !== localId);
  }
  state.lastMessagesByConversation[conversationId] = getLatestConversationMessage(conversationId);
}

async function flushQueuedMessages() {
  if (!hasBackend || !state.user?.id || state.isOffline || state.isSyncingQueue || !state.queuedMessages.length) return;
  state.isSyncingQueue = true;
  renderConnectionStatus();
  let sentAny = false;
  const pending = [...state.queuedMessages].sort((left, right) => new Date(left.created_at || 0) - new Date(right.created_at || 0));
  for (const queuedMessage of pending) {
    try {
      const { id, local_id, local_only, local_status, created_at, ...record } = queuedMessage;
      await insertMessage(record);
      removeQueuedMessage(local_id, queuedMessage.conversation_id);
      sentAny = true;
    } catch (error) {
      if (isOfflineLikeError(error)) {
        state.isOffline = true;
        break;
      }
      toast(`Nie udalo sie wyslac jednej z wiadomosci: ${error.message || error}`);
      break;
    }
  }
  state.isSyncingQueue = false;
  if (sentAny && !state.isOffline) {
    state.lastSyncAt = new Date().toISOString();
    await loadConversations();
    await loadFriendships().catch(() => {});
    render();
  }
  persistOfflineState();
  renderConnectionStatus();
}

function renderConnectionStatus() {
  const queuedCount = state.queuedMessages.length;
  let text = "";
  let tone = "online";
  if (state.isOffline) {
    tone = "offline";
    text = queuedCount
      ? `Brak internetu. ${queuedCount} wiadomosci zapisano lokalnie i wysla sie po powrocie sieci.`
      : "Brak internetu. Mozesz czytac ostatnio zapisane rozmowy i pisac tekst, ktory wysle sie po powrocie sieci.";
  } else if (state.isSyncingQueue) {
    text = `Wysylam ${queuedCount} zapisanych offline wiadomosci...`;
  } else if (queuedCount) {
    text = `${queuedCount} wiadomosci czeka jeszcze na wyslanie.`;
  }

  if (connectionBanner) {
    connectionBanner.textContent = text;
    connectionBanner.className = `connection-banner ${tone}${text ? "" : " hidden"}`;
  }
  if (authOfflineBanner) {
    authOfflineBanner.classList.toggle("hidden", !state.isOffline);
  }
  renderRuntimeStatus();
}

function renderRuntimeStatus() {
  if (!runtimeSiteValue) return;

  const buildText = runtimeHealth?.builtAt ? `Ostatni build: ${formatTime(runtimeHealth.builtAt)}.` : "Czekam na dane o ostatnim buildzie.";
  runtimeSiteValue.textContent = "GitHub Pages 24/7";
  runtimeSiteNote.textContent = `${buildText} Domena prowadzi do publicznej publikacji strony.`;

  runtimeDataValue.textContent = hasBackend ? "Supabase Auth + Database" : "Backend niepodpiety";
  runtimeDataNote.textContent = hasBackend
    ? "Tutaj wchodza logowanie, wiadomosci, pliki, Realtime i prywatne dane konta."
    : "Brakuje danych konfiguracyjnych Supabase, wiec logowanie i rozmowy nie rusza.";

  if (runtimeHealth?.apkReady) {
    runtimeApkValue.textContent = "APK gotowe";
    runtimeApkNote.textContent = `Publiczna paczka Android jest wystawiona pod adresem ${runtimeHealth.apkUrl || apkUrl || "linktalk.pl/downloads/linktalk-debug.apk"}.`;
  } else if (apkUrl) {
    runtimeApkValue.textContent = "APK pod tym samym adresem";
    runtimeApkNote.textContent = `Link do Androida jest powiazany z ta sama publikacja strony: ${apkUrl}.`;
  } else {
    runtimeApkValue.textContent = "APK jeszcze niedopiete";
    runtimeApkNote.textContent = "Strona juz dziala, ale paczka Android wymaga jeszcze kolejnego pełnego builda.";
  }

  runtimeOfflineValue.textContent = state.isOffline ? "To urzadzenie jest offline" : "Service worker i cache";
  runtimeOfflineNote.textContent = state.isOffline
    ? "Mozesz dalej czytac ostatnio zapisane rozmowy i zapisywac nowe teksty lokalnie do wyslania pozniej."
    : (state.lastSyncAt
      ? `Ostatnia synchronizacja rozmow: ${formatTime(state.lastSyncAt)}. Po pierwszym zaladowaniu ostatnie czaty zostaja lokalnie.`
      : "Po pierwszym zaladowaniu ostatnie czaty i kolejka wiadomosci zostaja lokalnie w przegladarce.");
}

async function loadRuntimeHealthStatus() {
  if (!runtimeSiteValue) return;
  try {
    const baseUrl = publicAppUrl || window.location.href;
    const url = new URL("health.json", baseUrl);
    url.searchParams.set("fresh", BUILD_VERSION.replace(/[^\d]/g, ""));
    url.searchParams.set("t", Date.now().toString());
    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) throw new Error(`Health HTTP ${response.status}`);
    runtimeHealth = await response.json();
  } catch {
    runtimeHealth = null;
  }
  renderRuntimeStatus();
}

function apkDownloadMarkup() {
  if (!apkUrl) {
    return '<p class="field-note">Link do APK pojawi sie tutaj po pierwszym pelnym buildzie Android i publikacji strony.</p>';
  }
  return `<p><a class="download-link" href="${escapeHtml(apkUrl)}" download>Pobierz aplikacje mobilna</a></p>`;
}

async function resolveApkDownloadAvailability(force = false) {
  if (!apkUrl) {
    apkDownloadChecked = true;
    apkDownloadAvailable = false;
    return false;
  }
  if (apkDownloadChecked && !force) return apkDownloadAvailable;

  apkDownloadChecked = true;
  try {
    const response = await fetch(apkUrl, { method: "HEAD", cache: "no-store" });
    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    const contentLength = Number.parseInt(response.headers.get("content-length") || "", 10);
    const hasExpectedSize = Number.isFinite(contentLength) ? contentLength >= MIN_APK_DOWNLOAD_BYTES : true;
    const looksLikeApk = contentType.includes("android.package-archive")
      || contentType.includes("application/octet-stream")
      || apkUrl.toLowerCase().endsWith(".apk");
    apkDownloadAvailable = response.ok && looksLikeApk && hasExpectedSize;
  } catch {
    apkDownloadAvailable = false;
  }
  return apkDownloadAvailable;
}

async function syncInlineApkDownload() {
  if (!authDownloadLink || !authDownloadHint || !authInstallButton) return;
  const isAvailable = await resolveApkDownloadAvailability();
  const installReady = Boolean(deferredInstallPrompt) && !isStandaloneApp();
  if (apkUrl && isAvailable) {
    authDownloadLink.href = apkUrl;
    authDownloadLink.classList.remove("hidden");
  } else {
    authDownloadLink.classList.add("hidden");
  }
  if (installReady) {
    authInstallButton.textContent = "Zainstaluj z przegladarki";
    authInstallButton.classList.remove("hidden");
  } else if (!isAvailable) {
    authInstallButton.textContent = "Pobierz aplikacje mobilna";
    authInstallButton.classList.remove("hidden");
  } else {
    authInstallButton.classList.add("hidden");
  }
  authDownloadHint.textContent = isAvailable
    ? (installReady
      ? "Mozesz pobrac APK albo zainstalowac te strone bezposrednio z Chrome."
      : "APK jest gotowe do pobrania. Na telefonie mozesz tez przypiac strone do ekranu poczatkowego.")
    : (installReady
      ? "Chrome moze zainstalowac te strone jako aplikacje. Publiczny link do APK pojawi sie tutaj po kolejnym pelnym buildzie Android."
      : "Link do APK pojawi sie tutaj po pierwszym pelnym buildzie Android i publikacji strony.");
  authDownloadHint.classList.remove("hidden");
  renderRuntimeStatus();
}

function syncBuildBadge() {
  if (buildBadge) {
    buildBadge.textContent = `Wydanie ${BUILD_VERSION}`;
  }
}

async function refreshInstalledAssets() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations().catch(() => []);
    await Promise.all((registrations || []).map((registration) => registration.update().catch(() => {})));
  }
  if ("caches" in window) {
    const keys = await caches.keys().catch(() => []);
    await Promise.all(
      (keys || [])
        .filter((key) => String(key).startsWith("linktalk-v"))
        .map((key) => caches.delete(key).catch(() => false))
    );
  }
  const refreshedUrl = new URL(window.location.href);
  refreshedUrl.searchParams.set("v", BUILD_VERSION.replace(/[^\d]/g, ""));
  refreshedUrl.searchParams.set("refresh", Date.now().toString());
  window.location.replace(refreshedUrl.toString());
}

async function syncBuildState() {
  syncBuildBadge();
  const buildStorageKey = "linktalk-build-version";
  const previousBuild = localStorage.getItem(buildStorageKey);
  localStorage.setItem(buildStorageKey, BUILD_VERSION);
  if (previousBuild && previousBuild !== BUILD_VERSION && "serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations().catch(() => []);
    await Promise.all((registrations || []).map((registration) => registration.update().catch(() => {})));
  }
}

function showAuth() {
  authScreen.classList.remove("hidden");
  app.classList.add("locked");
  document.body.classList.remove("app-active");
  setupWarning.classList.toggle("hidden", hasBackend);
  authForm.classList.toggle("hidden", !hasBackend);
  setAuthPanelOpen(!hasBackend);
  setAuthMode(authMode);
  renderConnectionStatus();
}

function showApp() {
  authScreen.classList.add("hidden");
  app.classList.remove("locked");
  document.body.classList.add("app-active");
  renderConnectionStatus();
}

function setAuthPanelOpen(isOpen = false) {
  authPanelOpen = Boolean(isOpen);
  authPanelShell?.classList.toggle("hidden", !authPanelOpen);
  authScreen?.classList.toggle("auth-panel-open", authPanelOpen);
  if (authPanelOpen) {
    window.setTimeout(() => document.getElementById("authEmail")?.focus(), 40);
  }
}

function syncPasswordToggleIcon() {
  if (!toggleAuthPasswordButton || !authPassword) return;
  const isVisible = authPassword.type === "text";
  toggleAuthPasswordButton.innerHTML = isVisible
    ? '<i data-lucide="eye-off"></i>'
    : '<i data-lucide="eye"></i>';
  toggleAuthPasswordButton.setAttribute("aria-label", isVisible ? "Ukryj haslo" : "Pokaz haslo");
  toggleAuthPasswordButton.title = isVisible ? "Ukryj haslo" : "Pokaz haslo";
  refreshIcons();
}

function setAuthStatus(message = "", type = "", options = {}) {
  if (typeof options === "boolean") options = { showResend: options };
  if (!authStatus) return;
  const { showResend = false, showRateLimitHelp = false, showEmailOtp = false } = options;
  authStatus.textContent = message;
  authStatus.className = `auth-status ${type || ""}`.trim();
  authStatus.classList.toggle("hidden", !message);
  resendConfirmationButton?.classList.toggle("hidden", !showResend);
  authRateLimitHelpButton?.classList.toggle("hidden", !showRateLimitHelp);
  authEmailOtpPanel?.classList.toggle("hidden", !showEmailOtp);
  if (!showEmailOtp && authEmailOtp) authEmailOtp.value = "";
  if (message) setAuthPanelOpen(true);
  syncResendButtonState();
}

function setAuthMode(mode = "login") {
  authMode = mode === "register" ? "register" : "login";
  authLoginModeButton?.classList.toggle("active", authMode === "login");
  authRegisterModeButton?.classList.toggle("active", authMode === "register");
  authRegisterFields?.classList.toggle("hidden", authMode !== "register");
  authActionRow?.classList.toggle("is-login-mode", authMode === "login");
  authActionRow?.classList.toggle("is-register-mode", authMode === "register");
  authAltLogin?.classList.toggle("hidden", authMode !== "login");
  if (authPrimaryButton) authPrimaryButton.textContent = authMode === "login" ? "Zaloguj" : "Utworz konto";
  if (authSecondaryModeButton) {
    authSecondaryModeButton.classList.toggle("hidden", false);
    authSecondaryModeButton.textContent = authMode === "login" ? "Nowe konto" : "Mam juz konto";
  }
  if (authPanelEyebrow) authPanelEyebrow.textContent = authMode === "login" ? "Zaloguj" : "Nowe konto";
  if (authPanelTitle) authPanelTitle.textContent = authMode === "login" ? "Wejdz do rozmow" : "Stworz konto i zacznij pisac";
  if (authPanelCopy) {
    authPanelCopy.textContent = authMode === "login"
      ? "Wejdz haslem albo kodem z maila. Potem wracasz do tych samych rozmow na stronie, laptopie i telefonie."
      : "Zakladasz konto, potwierdzasz email, a numer telefonu dopinasz kodem SMS, gdy dostawca SMS jest juz aktywny.";
  }
  if (authEmail) {
    authEmail.placeholder = authMode === "login"
      ? "Adres email do logowania"
      : "Na ten email wyslemy potwierdzenie";
  }
  if (authPassword) {
    authPassword.autocomplete = authMode === "login" ? "current-password" : "new-password";
    authPassword.placeholder = authMode === "login" ? "Wpisz haslo albo wybierz kod z maila" : "Minimum 6 znakow";
    authPassword.type = "password";
  }
  syncPasswordToggleIcon();
}

function setAuthBusy(isBusy, message = "") {
  authForm.querySelectorAll("button, input").forEach((item) => {
    item.disabled = isBusy;
  });
  if (resendConfirmationButton) {
    resendConfirmationButton.disabled = isBusy || getResendCooldownSeconds() > 0;
  }
  if (authRateLimitHelpButton) authRateLimitHelpButton.disabled = false;
  if (message) setAuthStatus(message);
}

function getResendCooldownSeconds() {
  return Math.max(0, Math.ceil((resendCooldownUntil - Date.now()) / 1000));
}

function syncResendButtonState() {
  if (!resendConfirmationButton || resendConfirmationButton.classList.contains("hidden")) return;
  const seconds = getResendCooldownSeconds();
  resendConfirmationButton.textContent = seconds > 0
    ? `Wyslij ponownie za ${seconds}s`
    : "Wyslij link potwierdzajacy ponownie";
  resendConfirmationButton.disabled = seconds > 0;
}

function startResendCooldown(seconds) {
  resendCooldownUntil = Date.now() + seconds * 1000;
  clearInterval(resendCooldownTimer);
  syncResendButtonState();
  resendCooldownTimer = window.setInterval(() => {
    syncResendButtonState();
    if (getResendCooldownSeconds() <= 0) {
      clearInterval(resendCooldownTimer);
      resendCooldownTimer = null;
    }
  }, 1000);
}

function humanizeAuthError(error) {
  const message = String(error?.message || error || "Nieznany blad logowania.");
  const status = error?.status || error?.statusCode;
  const code = String(error?.code || error?.error_code || "");
  const lower = message.toLowerCase();
  if (status === 429 || lower.includes("too many requests") || lower.includes("rate limit")) {
    return "Supabase zablokowal kolejne proby rejestracji lub wysylki emaila limitem 429. Domyslna wysylka testowa ma bardzo niski limit, nawet 2 maile na godzine, wiec do normalnych testow trzeba wlaczyc wlasny SMTP albo tymczasowo wylaczyc Confirm email.";
  }
  if (status >= 500 || lower.includes("database error querying schema") || code.includes("unexpected_failure")) {
    return "Supabase Auth zwrocil blad serwera przy logowaniu. To nie jest blad hasla w aplikacji, tylko problem konfiguracji Auth/Supabase.";
  }
  if (lower.includes("otp") || lower.includes("token has expired") || lower.includes("token is expired") || lower.includes("verification code")) {
    return "Kod weryfikacyjny jest nieprawidlowy albo wygasl. Zamow nowy kod i wpisz go ponownie.";
  }
  if ((lower.includes("sms") && lower.includes("provider")) || lower.includes("phone provider") || lower.includes("twilio")) {
    return "SMS nie sa jeszcze skonfigurowane. W Supabase trzeba wlaczyc Phone Auth i podpiac dostawce SMS albo Send SMS Hook.";
  }
  if (lower.includes("phone") && lower.includes("invalid")) {
    return "Numer telefonu powinien miec format miedzynarodowy, np. +48795731886.";
  }
  if (lower.includes("invalid login credentials")) return "Nieprawidlowy email albo haslo.";
  if (lower.includes("email not confirmed")) return "Konto nie jest jeszcze potwierdzone. Sprawdz poczte: jesli mail ma link, kliknij link, a jesli ma 6-cyfrowy kod, wpisz go w panelu logowania.";
  if (lower.includes("email_address_invalid") || lower.includes("email address")) return "Ten adres email zostal odrzucony. Uzyj prawdziwego adresu email, np. Gmail albo Outlook.";
  if (lower.includes("password")) return "Haslo musi miec minimum 6 znakow.";
  return message;
}

function authStatusOptionsFromError(error) {
  const message = String(error?.message || error || "");
  const status = error?.status || error?.statusCode;
  const lower = message.toLowerCase();
  if (status === 429 || lower.includes("too many requests") || lower.includes("rate limit")) {
    return { showRateLimitHelp: true, cooldownSeconds: 60 };
  }
  if (lower.includes("email not confirmed")) {
    return { showResend: true, showEmailOtp: true };
  }
  return {};
}

function showAuthError(error) {
  const options = authStatusOptionsFromError(error);
  setAuthStatus(humanizeAuthError(error), "error", options);
  if (options.cooldownSeconds) startResendCooldown(options.cooldownSeconds);
}

function renderInfoDocument(kind) {
  const doc = infoDocuments[kind] || infoDocuments.terms;
  currentInfoDocumentKind = kind;
  stopInfoNarration();
  infoTitle.textContent = doc.title;
  infoContent.innerHTML = `
    <div class="info-intro">${escapeHtml(doc.intro || "")}</div>
    ${doc.sections.map((section) => `
      <section class="info-section">
        <h3>${escapeHtml(section.heading)}</h3>
        ${(section.paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        ${section.bullets?.length ? `<ul class="info-list">${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
      </section>
    `).join("")}
  `;
  updateInfoNarrationButton();
}

function openInfoDocument(kind) {
  renderInfoDocument(kind);
  infoModal.showModal();
  refreshIcons();
}

function buildNarrationText(doc) {
  const chunks = [doc?.title, doc?.intro];
  (doc?.sections || []).forEach((section) => {
    chunks.push(section.heading);
    (section.paragraphs || []).forEach((paragraph) => chunks.push(paragraph));
    (section.bullets || []).forEach((bullet) => chunks.push(bullet));
  });
  return chunks.filter(Boolean).join(". ");
}

function buildLandingNarrationText() {
  const parts = [
    document.querySelector(".hero-kicker")?.textContent?.trim(),
    document.querySelector(".auth-hero-copy h1")?.textContent?.trim(),
    document.getElementById("authIntro")?.textContent?.trim(),
    runtimeSiteValue?.textContent?.trim(),
    runtimeSiteNote?.textContent?.trim(),
    runtimeDataValue?.textContent?.trim(),
    runtimeDataNote?.textContent?.trim(),
    runtimeApkValue?.textContent?.trim(),
    runtimeApkNote?.textContent?.trim(),
    runtimeOfflineValue?.textContent?.trim(),
    runtimeOfflineNote?.textContent?.trim()
  ];
  return parts.filter(Boolean).join(". ");
}

function stopInfoNarration() {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  infoNarrationActive = false;
  landingNarrationActive = false;
  updateInfoNarrationButton();
  updateLandingNarrationButton();
}

function updateInfoNarrationButton() {
  if (!listenInfoButton) return;
  const supported = "speechSynthesis" in window;
  listenInfoButton.classList.toggle("hidden", !supported);
  if (!supported) return;
  listenInfoButton.innerHTML = infoNarrationActive
    ? '<i data-lucide="square"></i>'
    : '<i data-lucide="volume-2"></i>';
  listenInfoButton.setAttribute("aria-label", infoNarrationActive ? "Zatrzymaj odsluch" : "Odsluchaj dokument");
  listenInfoButton.title = infoNarrationActive ? "Zatrzymaj odsluch" : "Odsluchaj dokument";
  refreshIcons();
}

function updateLandingNarrationButton() {
  if (!listenLandingButton) return;
  const supported = "speechSynthesis" in window;
  listenLandingButton.classList.toggle("hidden", !supported);
  if (!supported) return;
  listenLandingButton.textContent = landingNarrationActive ? "Zatrzymaj odsluch strony" : "Posluchaj tej strony";
}

function toggleInfoNarration() {
  if (!("speechSynthesis" in window)) {
    toast("Ta przegladarka nie obsluguje odsluchu tekstu.");
    return;
  }
  if (infoNarrationActive) {
    stopInfoNarration();
    return;
  }
  const doc = infoDocuments[currentInfoDocumentKind] || infoDocuments.terms;
  const utterance = new SpeechSynthesisUtterance(buildNarrationText(doc));
  utterance.lang = "pl-PL";
  utterance.rate = 0.98;
  utterance.onend = () => {
    infoNarrationActive = false;
    updateInfoNarrationButton();
  };
  utterance.onerror = () => {
    infoNarrationActive = false;
    updateInfoNarrationButton();
  };
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  infoNarrationActive = true;
  updateInfoNarrationButton();
}

function toggleLandingNarration() {
  if (!("speechSynthesis" in window)) {
    toast("Ta przegladarka nie obsluguje odsluchu tekstu.");
    return;
  }
  if (landingNarrationActive) {
    stopInfoNarration();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(buildLandingNarrationText());
  utterance.lang = "pl-PL";
  utterance.rate = 0.98;
  utterance.onend = () => {
    landingNarrationActive = false;
    updateLandingNarrationButton();
  };
  utterance.onerror = () => {
    landingNarrationActive = false;
    updateLandingNarrationButton();
  };
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  landingNarrationActive = true;
  updateLandingNarrationButton();
}

function openInfoDocumentWithAudio(kind) {
  openInfoDocument(kind);
  window.setTimeout(() => toggleInfoNarration(), 80);
}

function authRedirectUrl() {
  const currentUrl = normalizeAppUrl(`${window.location.origin}${window.location.pathname}`);
  const currentHost = String(window.location.hostname || "").toLowerCase();
  const currentIsPublic = Boolean(currentHost && !["localhost", "127.0.0.1", "::1"].includes(currentHost));
  return currentIsPublic ? currentUrl : normalizeAppUrl(publicAppUrl || currentUrl);
}

function maybeOpenVerificationCenter() {
  const stateSnapshot = verificationState();
  if (!state.user) return;
  if (stateSnapshot.needsPhoneVerification) {
    window.setTimeout(() => showVerificationCenter(), 120);
  }
}

function showVerificationCenter(statusMessage = "") {
  if (!state.user || !verificationContent) return;
  const verification = verificationState();
  const phoneValue = verification.phone || state.pendingPhoneVerification || "";
  verificationContent.innerHTML = `
    <div class="verification-grid">
      <div class="verification-card ${verification.emailConfirmed ? "success" : "pending"}">
        <strong>Email</strong>
        <span>${verification.emailConfirmed
          ? `Adres ${escapeHtml(state.user.email || "")} jest potwierdzony.`
          : "Adres email nadal czeka na potwierdzenie linkiem albo kodem z maila."}</span>
      </div>
      <div class="verification-card ${verification.phoneConfirmed ? "success" : "pending"}">
        <strong>Telefon</strong>
        <span>${verification.phoneConfirmed
          ? `Numer ${escapeHtml(maskPhoneNumber(verification.phone))} jest juz potwierdzony.`
          : "Dodaj albo potwierdz numer telefonu 6-cyfrowym kodem SMS."}</span>
      </div>
    </div>
    ${statusMessage ? `<div class="auth-status success">${escapeHtml(statusMessage)}</div>` : ""}
    <div class="verification-stack">
      <label class="field">
        Numer telefonu
        <input id="verificationPhoneInput" type="tel" maxlength="20" autocomplete="tel" value="${escapeHtml(phoneValue)}" placeholder="Np. +48795731886" />
      </label>
      <div class="verification-inline">
        <button class="primary-button" id="sendPhoneVerificationButton" type="button">Wyslij kod SMS</button>
        <button class="secondary-button" id="resendPhoneVerificationButton" type="button">Wyslij kod ponownie</button>
      </div>
      <label class="field">
        Kod SMS
        <input id="verificationCodeInput" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6 cyfr" />
      </label>
      <div class="verification-inline">
        <button class="primary-button" id="confirmPhoneVerificationButton" type="button">Potwierdz numer</button>
        <button class="secondary-button" id="closeVerificationButton" type="button">Wroce do aplikacji</button>
      </div>
      <div class="setup-warning">
        Telefon jest potwierdzany przez Supabase Auth. Aby SMS dzialal publicznie, w Supabase trzeba wlaczyc Phone Auth i skonfigurowac dostawce SMS albo Send SMS Hook.
      </div>
    </div>
  `;

  verificationContent.querySelector("#sendPhoneVerificationButton")?.addEventListener("click", async () => {
    const phone = verificationContent.querySelector("#verificationPhoneInput")?.value || "";
    try {
      const normalized = await sendPhoneVerificationCode(phone);
      if (authPhone) authPhone.value = normalized;
      showVerificationCenter("Kod SMS zostal wyslany. Wpisz go ponizej w ciagu 60 sekund.");
    } catch (error) {
      toast(humanizeAuthError(error));
    }
  });

  verificationContent.querySelector("#resendPhoneVerificationButton")?.addEventListener("click", async () => {
    const phone = verificationContent.querySelector("#verificationPhoneInput")?.value || "";
    try {
      await resendPhoneVerificationCode(phone);
      showVerificationCenter("Wyslano nowy kod SMS.");
    } catch (error) {
      toast(humanizeAuthError(error));
    }
  });

  verificationContent.querySelector("#confirmPhoneVerificationButton")?.addEventListener("click", async () => {
    const phone = verificationContent.querySelector("#verificationPhoneInput")?.value || "";
    const code = verificationContent.querySelector("#verificationCodeInput")?.value || "";
    try {
      await confirmPhoneVerificationCode(phone, code);
      await loadPrivateProfile();
      showVerificationCenter("Numer telefonu zostal potwierdzony i zapisany w profilu.");
    } catch (error) {
      toast(humanizeAuthError(error));
    }
  });

  verificationContent.querySelector("#closeVerificationButton")?.addEventListener("click", () => {
    verificationModal.close();
  });

  if (!verificationModal.open) verificationModal.showModal();
  refreshIcons();
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
  if (other?.is_online) return "Aktywny(a) teraz";
  return other?.status_text || "Rozmowa prywatna";
}

function isMobileLayout() {
  return window.innerWidth <= 760;
}

function formatConversationTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(date);
  }
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays < 7) {
    return new Intl.DateTimeFormat("pl-PL", { weekday: "short" }).format(date).replace(".", "");
  }
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "short" }).format(date);
}

function avatarMarkup({ label = "?", imageUrl = "", online = false, className = "", statusClass = "" } = {}) {
  const hasImage = Boolean(imageUrl);
  const classes = ["avatar", className, hasImage ? "avatar-photo" : ""].filter(Boolean).join(" ");
  return `
    <span class="${classes}">
      ${hasImage ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(label)}" />` : escapeHtml(initials(label))}
      ${online ? `<span class="status-dot ${statusClass}"></span>` : ""}
    </span>
  `;
}

function getLatestConversationMessage(conversationId) {
  const cached = [...(state.cachedMessagesByConversation[conversationId] || [])]
    .sort((left, right) => new Date(right.created_at || 0) - new Date(left.created_at || 0))[0];
  return state.lastMessagesByConversation[conversationId] || cached || null;
}

function messagePreviewLabel(message) {
  if (!message) return "Rozpocznij rozmowe";
  if (message.type === "voice") return message.transcript_text || "Wiadomosc glosowa";
  if (message.type === "image") return message.body || "Wyslano zdjecie";
  if (message.type === "video") return message.body || "Wyslano wideo";
  if (message.type === "file") return message.attachment_name || "Wyslano plik";
  if (message.type === "sticker") return "Naklejka";
  if (message.type === "gif") return "GIF";
  return message.body || "Nowa wiadomosc";
}

function conversationPreviewText(conversation) {
  const message = getLatestConversationMessage(conversation.id);
  if (!message) return conversationSubtitle(conversation);
  const mine = message.sender_id === state.user?.id;
  let prefix = mine ? "Ty: " : "";
  if (conversation.is_group && !mine) {
    const sender = state.profiles[message.sender_id];
    const senderLabel = sender?.display_name || sender?.username || "Kontakt";
    prefix = `${senderLabel}: `;
  }
  return `${prefix}${messagePreviewLabel(message)}`;
}

function conversationUnread(conversation, member) {
  const message = getLatestConversationMessage(conversation.id);
  if (!member?.last_read_at) return Boolean(message && message.sender_id !== state.user?.id);
  if (!message?.created_at) return false;
  return new Date(message.created_at) > new Date(member.last_read_at);
}

function setInboxContext(title, subtitle = "", options = {}) {
  const { showStories = false, showFilters = false } = options;
  if (isMobileLayout() && title === "Czaty") {
    sectionTitle.textContent = BRAND_NAME.toLowerCase();
    sectionSubtitle.textContent = "";
    searchInput.placeholder = "Zapytaj LinkTalk AI lub wyszukaj";
  } else if (title === "Relacje") {
    sectionTitle.textContent = title;
    sectionSubtitle.textContent = subtitle || BRAND_NAME;
    searchInput.placeholder = "Szukaj znajomych lub username";
  } else {
    sectionTitle.textContent = title;
    sectionSubtitle.textContent = subtitle || BRAND_NAME;
    searchInput.placeholder = "Szukaj lub napisz wiadomosc";
  }
  storyStrip?.classList.toggle("hidden", !showStories);
  filtersBar?.classList.toggle("hidden", !showFilters);
}

function storyCandidates() {
  const seen = new Set([state.user?.id]);
  const profiles = [];

  state.friendships
    .filter((row) => row.status === "accepted")
    .forEach((row) => {
      const profileId = row.requester_id === state.user?.id ? row.addressee_id : row.requester_id;
      if (!profileId || seen.has(profileId)) return;
      const profile = state.profiles[profileId];
      if (!profile) return;
      seen.add(profileId);
      profiles.push(profile);
    });

  state.conversations
    .filter((conversation) => !conversation.is_group)
    .forEach((conversation) => {
      const profile = otherConversationProfile(conversation);
      if (!profile?.id || seen.has(profile.id)) return;
      seen.add(profile.id);
      profiles.push(profile);
    });

  return profiles.slice(0, 10);
}

function renderStoryStrip() {
  if (!storyStrip) return;
  const cards = storyCandidates();
  storyStrip.innerHTML = `
    <button class="story-card story-create" type="button" id="storyCreateButton">
      <span class="story-avatar story-avatar-create"><i data-lucide="plus"></i></span>
      <span class="story-name">Nowa relacja</span>
    </button>
    ${cards.map((profile) => `
      <button class="story-card" type="button" data-story-profile="${profile.id}">
        ${avatarMarkup({
          label: profile.display_name || profile.username || "Kontakt",
          imageUrl: profile.avatar_url,
          online: profile.is_online,
          className: "story-avatar",
          statusClass: "story-status"
        })}
        <span class="story-name">${escapeHtml((profile.display_name || profile.username || "Kontakt").split(" ")[0])}</span>
      </button>
    `).join("")}
  `;
  storyStrip.querySelector("#storyCreateButton")?.addEventListener("click", () => {
    toast("Relacje i publikowanie notatek dopniemy w kolejnym etapie.");
  });
  storyStrip.querySelectorAll("[data-story-profile]").forEach((button) => {
    button.addEventListener("click", () => openConversationForProfile(button.dataset.storyProfile).catch((error) => toast(error.message)));
  });
}

async function openConversationForProfile(profileId) {
  if (!profileId) return;
  const existing = state.conversations.find((conversation) => (
    !conversation.is_group && conversationMembers(conversation.id).some((member) => member.user_id === profileId)
  ));
  if (existing) {
    state.activeConversationId = existing.id;
    await loadMessages();
    subscribeToRealtime();
    app.classList.add("chat-open");
    render();
    return;
  }
  const username = state.profiles[profileId]?.username;
  if (username) {
    await startChatWithUsername(username);
  }
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
  syncBuildState().catch(() => {});
  syncInlineApkDownload().catch(() => {});
  loadRuntimeHealthStatus().catch(() => {});
  renderConnectionStatus();
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    syncInlineApkDownload().catch(() => {});
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    syncInlineApkDownload().catch(() => {});
  });
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
      await bootstrapUserWithOfflineSupport();
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

  await bootstrapUserWithOfflineSupport();
}

async function bootstrapUserWithOfflineSupport() {
  try {
    await bootstrapUser();
    state.lastSyncAt = new Date().toISOString();
    persistOfflineState();
    renderConnectionStatus();
    if (!state.isOffline) {
      flushQueuedMessages().catch(() => {});
    }
  } catch (error) {
    if (state.user?.id && isOfflineLikeError(error) && hydrateOfflineState(state.user.id)) {
      showApp();
      render();
      renderConnectionStatus();
      toast("Brak internetu. Otworzono ostatnio zapisane rozmowy offline.");
      return;
    }
    throw error;
  }
}

async function bootstrapUser() {
  await loadCurrentUser();
  await syncProfileFromAuthMetadata();
  await syncLegalAcceptances();
  if (state.profile?.is_banned) {
    showAuth();
    renderEmptyApp();
    toast("Konto jest zablokowane przez administracje.");
    await supabase.auth.signOut();
    return;
  }
  await loadPrivateProfile();
  await syncPrivateProfileFromAuth();
  await loadConversations();
  await loadFriendships();
  setAdminVisibility();
  showApp();
  render();
  maybeOpenVerificationCenter();
}

function clearData() {
  state.profile = null;
  state.privateProfile = null;
  state.privateProfileMode = null;
  state.conversations = [];
  state.memberships = [];
  state.conversationMembers = [];
  state.profiles = {};
  state.messages = [];
  state.lastMessagesByConversation = {};
  state.reactions = [];
  state.reads = [];
  state.friendships = [];
  state.activeConversationId = null;
  state.queuedMessages = [];
  state.cachedMessagesByConversation = {};
  state.cachedReactionsByConversation = {};
  state.cachedReadsByConversation = {};
  state.lastSyncAt = null;
  state.pendingPhoneVerification = "";
  state.isSyncingQueue = false;
  state.signedUrls.clear();
  state.subscriptions.forEach((channel) => supabase.removeChannel(channel));
  state.subscriptions = [];
  renderConnectionStatus();
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

  const fullName = normalizePrivateField("full_name", String(currentUserMetadata().full_name || ""));
  const emailName = registrationFallbackName();
  const newProfile = {
    id: state.user.id,
    display_name: fullName || emailName,
    username: `${emailName}-${state.user.id.slice(0, 6)}`
  };
  const { data, error: insertError } = await supabase.from("profiles").insert(newProfile).select("*").single();
  if (insertError) throw insertError;
  state.profile = data;
  state.profiles[data.id] = data;
}

async function syncProfileFromAuthMetadata() {
  if (!state.user || !state.profile) return;
  const fullName = normalizePrivateField("full_name", String(currentUserMetadata().full_name || ""));
  if (!fullName) return;
  const fallbackName = registrationFallbackName();
  const isGeneric = [fallbackName, "Nowy uzytkownik"].includes(state.profile.display_name || "");
  if (!isGeneric || state.profile.display_name === fullName) return;
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: fullName })
    .eq("id", state.user.id)
    .select("*")
    .single();
  if (error) throw error;
  state.profile = data;
  state.profiles[data.id] = data;
}

async function loadPrivateProfile() {
  if (!state.user) return;
  try {
    const data = await invokePrivateProfileVault("get");
    state.privateProfile = normalizePrivateProfileRecord(data.profile);
    state.privateProfileMode = data.storageMode || "encrypted-vault";
    return;
  } catch (error) {
    if (!isVaultFunctionIssue(error)) throw error;
  }

  await loadPrivateProfileLegacy();
}

async function persistPrivateProfilePatch(patch) {
  try {
    const data = await invokePrivateProfileVault("save", patch);
    state.privateProfile = normalizePrivateProfileRecord(data.profile);
    state.privateProfileMode = data.storageMode || "encrypted-vault";
    return state.privateProfile;
  } catch (error) {
    if (!isVaultFunctionIssue(error)) throw error;
    const { data: legacyData, error: legacyError } = await supabase
      .from("profile_private")
      .upsert({ user_id: state.user.id, ...patch }, { onConflict: "user_id" })
      .select("*")
      .single();
    if (legacyError) throw legacyError;
    state.privateProfile = normalizePrivateProfileRecord(legacyData);
    state.privateProfileMode = "legacy-plaintext";
    return state.privateProfile;
  }
}

async function syncPrivateProfileFromAuth() {
  if (!state.user) return;
  const metadata = currentUserMetadata();
  const verifiedPhone = normalizePhoneInput(state.user.phone || "");
  const pendingPhone = normalizePhoneInput(metadata.pending_phone || "");
  const patch = {};

  const fullName = normalizePrivateField("full_name", String(metadata.full_name || ""));
  if (fullName && !state.privateProfile?.full_name) {
    patch.full_name = fullName;
  }
  if (verifiedPhone && state.privateProfile?.phone !== verifiedPhone) {
    patch.phone = verifiedPhone;
  } else if (!state.privateProfile?.phone && pendingPhone) {
    patch.phone = pendingPhone;
  }
  if (Object.keys(patch).length && !state.privateProfile?.data_consent_at) {
    patch.data_consent_at = metadata.terms_accepted_at || new Date().toISOString();
  }
  if (!Object.keys(patch).length) return;
  await persistPrivateProfilePatch(patch);
}

async function loadPrivateProfileLegacy() {
  if (!state.user) return;
  const { data, error } = await supabase
    .from("profile_private")
    .select("*")
    .eq("user_id", state.user.id)
    .maybeSingle();
  if (error) throw error;

  if (data) {
    state.privateProfile = normalizePrivateProfileRecord(data);
    state.privateProfileMode = "legacy-plaintext";
    return;
  }

  const { data: created, error: insertError } = await supabase
    .from("profile_private")
    .insert({ user_id: state.user.id })
    .select("*")
    .single();
  if (insertError) throw insertError;
  state.privateProfile = normalizePrivateProfileRecord(created);
  state.privateProfileMode = "legacy-plaintext";
}

async function invokePrivateProfileVault(action, profile = null) {
  const body = { action };
  if (profile) body.profile = profile;
  const { data, error } = await supabase.functions.invoke("privateProfileVault", { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data || {};
}

async function loadConversations() {
  if (state.isOffline) {
    if (!state.conversations.length) hydrateOfflineState(state.user?.id);
    state.activeConversationId = state.activeConversationId || state.conversations[0]?.id || null;
    restoreCachedConversation(state.activeConversationId);
    return;
  }
  const { data: memberships, error: memberError } = await supabase
    .from("conversation_members")
    .select("*")
    .eq("user_id", state.user.id)
    .order("pinned", { ascending: false })
    .order("joined_at", { ascending: false });
  if (memberError) {
    if (hydrateOfflineState(state.user?.id)) return;
    throw memberError;
  }

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
  if (error) {
    if (hydrateOfflineState(state.user?.id)) return;
    throw error;
  }

  state.conversations = conversations || [];
  sortConversationsInState();
  await loadConversationMembers(ids);
  await loadConversationPreviews(ids);
  state.activeConversationId = state.activeConversationId || state.conversations[0]?.id || null;
  await loadMessages();
  subscribeToRealtime();
  state.lastSyncAt = new Date().toISOString();
  persistOfflineState();
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

async function loadConversationPreviews(ids) {
  if (!ids.length) {
    state.lastMessagesByConversation = {};
    return;
  }
  if (state.isOffline) return;
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, type, created_at, attachment_name, attachment_path, attachment_url, transcript_text")
    .in("conversation_id", ids)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const latest = {};
  (data || []).forEach((message) => {
    if (!latest[message.conversation_id]) {
      latest[message.conversation_id] = message;
    }
  });
  state.lastMessagesByConversation = latest;
}

async function loadMessages() {
  if (!state.activeConversationId) {
    state.messages = [];
    state.reactions = [];
    state.reads = [];
    return;
  }
  if (state.isOffline) {
    restoreCachedConversation(state.activeConversationId);
    return;
  }
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", state.activeConversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) {
    if (restoreCachedConversation(state.activeConversationId)) return;
    throw error;
  }
  state.messages = data || [];
  state.lastMessagesByConversation[state.activeConversationId] = state.messages.at(-1) || state.lastMessagesByConversation[state.activeConversationId] || null;
  await loadMessageMeta();
  cacheConversationState(state.activeConversationId);
  state.lastSyncAt = new Date().toISOString();
  persistOfflineState();
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
  cacheConversationState(state.activeConversationId);
}

async function markActiveConversationRead() {
  const conversation = getActiveConversation();
  if (!conversation || !state.profile?.read_receipts_enabled || state.isOffline) return;
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
  if (state.isOffline) return;
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .or(`requester_id.eq.${state.user.id},addressee_id.eq.${state.user.id}`)
    .order("updated_at", { ascending: false });
  if (error) {
    if (state.friendships.length) return;
    throw error;
  }
  state.friendships = data || [];
  const ids = state.friendships.flatMap((row) => [row.requester_id, row.addressee_id]);
  await loadProfiles(ids);
  persistOfflineState();
}

function subscribeToRealtime() {
  state.subscriptions.forEach((channel) => supabase.removeChannel(channel));
  state.subscriptions = [];
  if (!state.activeConversationId || state.isOffline) return;

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

function collectRegistrationFields() {
  const fullName = normalizePrivateField("full_name", String(authFullName?.value || ""));
  const phone = normalizePhoneInput(authPhone?.value || "");
  if (!fullName) throw new Error("Przy nowym koncie wpisz imie i nazwisko.");
  if (!phone || !isValidPhoneNumber(phone)) throw new Error("Przy nowym koncie wpisz prawidlowy numer telefonu, np. +48795731886.");
  if (!authLegalConsent?.checked) throw new Error("Aby utworzyc konto, zaakceptuj regulamin i polityke prywatnosci.");
  return { fullName, phone };
}

async function register(email, password, registrationData) {
  const acceptedAt = new Date().toISOString();
  const { fullName, phone } = registrationData;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        pending_phone: phone,
        terms_accepted_at: acceptedAt,
        privacy_accepted_at: acceptedAt,
        legal_version: LEGAL_VERSION
      },
      emailRedirectTo: authRedirectUrl()
    }
  });
  if (error) throw error;
  state.pendingPhoneVerification = phone;
  if (data.session) {
    return {
      kind: "logged-in",
      message: "Konto utworzone i zalogowano. Laduje rozmowy..."
    };
  }
  const isRepeatedSignup = Array.isArray(data?.user?.identities) && data.user.identities.length === 0;
  return {
    kind: isRepeatedSignup ? "existing" : "created",
    message: isRepeatedSignup
      ? "To konto juz istnieje albo nadal czeka na potwierdzenie. Wejdz haslem albo wybierz mail z kodem i potwierdz konto."
      : "Konto zapisane. Sprawdz poczte i potwierdz email. Jesli w mailu widzisz 6-cyfrowy kod, mozesz wpisac go od razu na tej stronie."
  };
}

async function requestEmailCodeForLogin(isResend = false) {
  const email = lastAuthEmail || document.getElementById("authEmail").value.trim();
  if (!email) {
    setAuthStatus("Najpierw wpisz email, na ktory mamy wyslac link albo kod.", "error");
    return;
  }
  setAuthBusy(true, isResend ? "Ponawiam wysylke..." : "Wysylam kod albo link...");
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: authRedirectUrl()
      }
    });
    if (error) throw error;
    lastAuthEmail = email;
    lastEmailFlow = "login_otp";
    startResendCooldown(45);
    setAuthStatus(
      "Wyslalismy mail od LinkTalk. Jesli wiadomosc zawiera 6-cyfrowy kod, wpisz go ponizej. Jesli zawiera link, kliknij go i wroc do rozmow.",
      "success",
      { showResend: true, showEmailOtp: true }
    );
  } catch (error) {
    showAuthError(error);
  } finally {
    setAuthBusy(false);
  }
}

async function resendConfirmationEmail() {
  if (lastEmailFlow === "login_otp") {
    await requestEmailCodeForLogin(true);
    return;
  }
  const email = lastAuthEmail || document.getElementById("authEmail").value.trim();
  if (!email) {
    setAuthStatus("Wpisz email, zeby wyslac link potwierdzajacy.", "error");
    return;
  }
  setAuthBusy(true, "Wysylam link potwierdzajacy...");
  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: authRedirectUrl()
      }
    });
    if (error) throw error;
    startResendCooldown(45);
    setAuthStatus("Wyslano link potwierdzajacy. Sprawdz poczte i folder spam. Jesli dostales kod, wpisz go w polu ponizej.", "success", { showResend: true, showEmailOtp: true });
  } catch (error) {
    showAuthError(error);
  } finally {
    setAuthBusy(false);
  }
}

async function verifyEmailOtpCode() {
  const email = lastAuthEmail || document.getElementById("authEmail").value.trim();
  const token = String(authEmailOtp?.value || "").trim();
  if (!email) {
    setAuthStatus("Wpisz email, dla ktorego chcesz potwierdzic kod.", "error", { showEmailOtp: true, showResend: true });
    return;
  }
  if (!/^\d{6}$/.test(token)) {
    setAuthStatus("Wpisz 6-cyfrowy kod z maila.", "error", { showEmailOtp: true, showResend: true });
    return;
  }
  setAuthBusy(true, "Potwierdzanie kodu z emaila...");
  try {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email"
    });
    if (error) throw error;
    setAuthStatus(lastEmailFlow === "login_otp" ? "Kod przyjety. Laduje konto..." : "Email potwierdzony. Laduje konto...", "success");
  } catch (error) {
    setAuthStatus(humanizeAuthError(error), "error", { showEmailOtp: true, showResend: true });
  } finally {
    setAuthBusy(false);
  }
}

async function sendPhoneVerificationCode(phone) {
  const normalized = normalizePhoneInput(phone);
  if (!normalized || !isValidPhoneNumber(normalized)) throw new Error("Numer telefonu powinien miec format miedzynarodowy, np. +48795731886.");
  const { data, error } = await supabase.auth.updateUser({
    phone: normalized,
    data: {
      ...currentUserMetadata(),
      pending_phone: normalized
    }
  });
  if (error) throw error;
  if (data?.user) state.user = data.user;
  state.pendingPhoneVerification = normalized;
  return normalized;
}

async function resendPhoneVerificationCode(phone) {
  const normalized = normalizePhoneInput(phone);
  if (!normalized || !isValidPhoneNumber(normalized)) throw new Error("Najpierw wpisz prawidlowy numer telefonu.");
  const { error } = await supabase.auth.resend({
    type: "phone_change",
    phone: normalized
  });
  if (error) throw error;
  state.pendingPhoneVerification = normalized;
}

async function confirmPhoneVerificationCode(phone, token) {
  const normalized = normalizePhoneInput(phone);
  const code = String(token || "").trim();
  if (!normalized || !isValidPhoneNumber(normalized)) throw new Error("Najpierw wpisz prawidlowy numer telefonu.");
  if (!/^\d{6}$/.test(code)) throw new Error("Kod SMS powinien miec 6 cyfr.");
  const { error } = await supabase.auth.verifyOtp({
    phone: normalized,
    token: code,
    type: "phone_change"
  });
  if (error) throw error;
  await refreshAuthenticatedUser();
  await updateCurrentUserMetadata({ pending_phone: normalized });
  await syncPrivateProfileFromAuth();
  state.pendingPhoneVerification = normalized;
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
  const record = {
    conversation_id: state.activeConversationId,
    sender_id: state.user.id,
    type,
    body,
    ...extra
  };
  if (state.isOffline) {
    queueMessageLocally(record);
    messageInput.value = "";
    render();
    return;
  }
  try {
    await insertMessage(record);
    messageInput.value = "";
    await loadMessages();
    await loadConversations();
    render();
  } catch (error) {
    if (isOfflineLikeError(error)) {
      state.isOffline = true;
      queueMessageLocally(record);
      messageInput.value = "";
      render();
      toast("Brak internetu. Wiadomosc zapisano lokalnie i wysle sie po powrocie sieci.");
      return;
    }
    throw error;
  }
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
  setInboxContext("Czaty", "Rozmowy", { showStories: false, showFilters: false });
  conversationList.innerHTML = `<div class="details-card"><h3>Witaj w LinkTalk</h3><p>${state.isOffline ? "Brak internetu. Po pierwszym zalogowaniu na tym urzadzeniu aplikacja zapamieta ostatnie rozmowy offline." : "Zaloguj sie, aby zobaczyc rozmowy."}</p></div>`;
  if (storyStrip) storyStrip.innerHTML = "";
  chatHeader.innerHTML = "";
  pinnedBanner.className = "pinned-banner";
  messagesEl.innerHTML = `<div class="details-card"><h3>Wybierz rozmowe</h3><p>${state.isOffline ? "Po zalogowaniu i pierwszej synchronizacji ostatnie wiadomosci beda dostepne takze bez sieci." : "Czaty pojawia sie tutaj po zalogowaniu."}</p></div>`;
  detailsPanel.innerHTML = "";
  renderConnectionStatus();
  refreshIcons();
}

function render() {
  const conversation = getActiveConversation();
  applyThemeVariables(conversation);
  setAdminVisibility();
  renderConnectionStatus();
  renderConversationList();
  renderHeader();
  renderPinned();
  renderMessages();
  renderDetails();
  persistOfflineState();
  refreshIcons();
}

function renderConversationList() {
  const filterTitles = {
    all: "Czaty",
    unread: "Nieprzeczytane",
    groups: "Grupy",
    requests: "Prosby",
    archived: "Archiwum"
  };
  const title = filterTitles[state.activeFilter] || "Czaty";
  const showStories = state.activeFilter === "all";
  setInboxContext(title, showStories ? "Rozmowy i relacje" : BRAND_NAME, { showStories, showFilters: !isMobileLayout() });
  if (showStories) renderStoryStrip();
  else if (storyStrip) storyStrip.innerHTML = "";
  const query = searchInput.value.trim().toLowerCase();
  conversationList.innerHTML = "";
  const rows = state.conversations.filter((conversation) => {
    const member = state.memberships.find((item) => item.conversation_id === conversation.id);
    if (state.activeFilter === "groups" && !conversation.is_group) return false;
    if (state.activeFilter === "archived" && !member?.archived) return false;
    if (state.activeFilter === "unread" && !conversationUnread(conversation, member)) return false;
    if (!["archived", "requests"].includes(state.activeFilter) && member?.archived) return false;
    if (!query) return true;
    return `${conversationTitle(conversation)} ${conversationPreviewText(conversation)}`.toLowerCase().includes(query);
  });

  if (!rows.length) {
    conversationList.innerHTML = `<div class="details-card"><h3>Brak rozmow</h3><p>Utworz rozmowe przyciskiem plus.</p></div>`;
    return;
  }

  rows.forEach((conversation) => {
    const member = state.memberships.find((item) => item.conversation_id === conversation.id);
    const title = conversationTitle(conversation);
    const other = otherConversationProfile(conversation);
    const unread = conversationUnread(conversation, member);
    const queuedCount = state.queuedMessages.filter((message) => message.conversation_id === conversation.id).length;
    const preview = conversationPreviewText(conversation);
    const timeValue = getLatestConversationMessage(conversation.id)?.created_at || conversation.updated_at;
    const button = document.createElement("button");
    button.className = `conversation-card ${conversation.id === state.activeConversationId ? "active" : ""} ${unread ? "unread" : ""}`.trim();
    button.type = "button";
    button.innerHTML = `
      ${avatarMarkup({
        label: title,
        imageUrl: other?.avatar_url,
        online: other?.is_online,
        className: "",
        statusClass: unread ? "status-unread" : ""
      })}
      <span>
        <span class="conversation-title">
          <strong>${escapeHtml(title)}</strong>
          ${member?.pinned ? "<span class='conversation-tag'>Przypiete</span>" : ""}
        </span>
        <span class="preview">${escapeHtml(preview)}</span>
      </span>
      <span class="conversation-meta-stack">
        <span class="conversation-meta">${formatConversationTime(timeValue)}</span>
        ${queuedCount ? `<span class='badge'>${queuedCount}</span>` : unread ? "<span class='conversation-unread-dot'></span>" : ""}
      </span>
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
  const presenceClass = other?.is_online ? "presence-line is-online" : "presence-line";
  chatHeader.innerHTML = `
    <div class="chat-person">
      <button class="icon-button mobile-back" id="mobileBack" aria-label="Wroc"><i data-lucide="arrow-left"></i></button>
      ${avatarMarkup({
        label: title,
        imageUrl: other?.avatar_url,
        online: other?.is_online
      })}
      <span>
        <strong>${escapeHtml(title)}</strong>
        <span class="${presenceClass}">${escapeHtml(subtitle)}</span>
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
      ${mine ? "" : avatarMarkup({
        label: senderName,
        imageUrl: sender?.avatar_url,
        online: sender?.is_online,
        className: "message-avatar"
      })}
      <div class="message ${message.local_status === "queued" ? "message-pending" : ""}">
        ${!mine && getActiveConversation()?.is_group ? `<div class="message-sender">${escapeHtml(senderName)}</div>` : ""}
        <div class="bubble ${message.type === "voice" ? "voice-bubble" : ""}">${messageBody(message)}</div>
        ${renderReactionPills(message.id)}
        <div class="message-meta">${formatTime(message.created_at)}${message.edited_at ? " - edytowano" : ""}${messageLocalSummary(message)}${messageReadSummary(message)}</div>
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
  if (message.local_status === "queued") return "";
  if (message.sender_id !== state.user.id || !state.profile?.read_receipts_enabled) return "";
  const count = state.reads.filter((read) => read.message_id === message.id && read.user_id !== state.user.id).length;
  return count ? ` - odczytano ${count}` : "";
}

function messageLocalSummary(message) {
  return message.local_status === "queued" ? " - zapisano offline" : "";
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
  const other = otherConversationProfile(conversation);
  const mediaCount = media.length;
  detailsPanel.innerHTML = `
    <div class="details-card profile-card details-hero-card">
      ${avatarMarkup({
        label: title,
        imageUrl: other?.avatar_url,
        online: other?.is_online
      })}
      <h3>${escapeHtml(title)}</h3>
      <p class="preview">${escapeHtml(subtitle)}</p>
      <div class="details-inline-meta">
        <span>${conversation.is_group ? `${conversationMembers(conversation.id).length} osob` : (other?.username ? `@${other.username}` : "Rozmowa prywatna")}</span>
        <span>${mediaCount} plik${mediaCount === 1 ? "" : mediaCount < 5 ? "i" : "ow"}</span>
      </div>
      <div class="details-quick-actions">
        <button class="details-quick-action" id="detailsJumpMedia" type="button">
          <span class="details-quick-icon"><i data-lucide="image"></i></span>
          <span>Media</span>
        </button>
        <button class="details-quick-action" id="detailsMuteConversationQuick" type="button">
          <span class="details-quick-icon"><i data-lucide="bell-off"></i></span>
          <span>Wycisz</span>
        </button>
        <button class="details-quick-action" id="detailsOpenThemeQuick" type="button">
          <span class="details-quick-icon"><i data-lucide="palette"></i></span>
          <span>Motyw</span>
        </button>
      </div>
    </div>
    <div class="details-card" id="detailsCustomizeSection">
      <div class="details-section-label">Dostosuj czat</div>
      <div class="action-list">
        <button class="list-button" id="openTheme"><i data-lucide="palette"></i>Zmien tapete i motyw</button>
        <button class="list-button" id="openEmojiPicker"><i data-lucide="thumbs-up"></i>Zmien szybka reakcje</button>
        <button class="list-button" id="togglePinConversation"><i data-lucide="pin"></i>${member?.pinned ? "Odepnij rozmowe" : "Przypnij rozmowe"}</button>
        <button class="list-button" id="archiveConversation"><i data-lucide="archive"></i>Archiwizuj</button>
      </div>
    </div>
    <div class="details-card" id="detailsMediaSection">
      <div class="details-section-label">Media i pliki</div>
      <p class="details-section-note">${mediaCount ? `Ostatnie ${Math.min(mediaCount, 6)} elementow z rozmowy.` : "Brak multimediow w tej rozmowie."}</p>
      <div class="action-list">
        ${media.length ? media.slice(-6).reverse().map((message) => `<button class="list-button" data-download-file="${message.id}"><i data-lucide="file"></i>${escapeHtml(message.attachment_name || message.body || "Plik")}</button>`).join("") : "<p class='preview'>Brak plikow w tej rozmowie.</p>"}
      </div>
    </div>
    <div class="details-card">
      <div class="details-section-label">Prywatnosc i bezpieczenstwo</div>
      <div class="action-list">
        <button class="list-button" id="setDisappearing"><i data-lucide="timer"></i>Znikajace wiadomosci</button>
        <button class="list-button" id="muteConversation"><i data-lucide="bell-off"></i>Wycisz na 8 godzin</button>
        <button class="list-button danger" id="blockConversation"><i data-lucide="ban"></i>Zablokuj osobe</button>
        <button class="list-button danger" id="reportConversation"><i data-lucide="flag"></i>Zglos rozmowe</button>
      </div>
    </div>
  `;
  document.getElementById("detailsJumpMedia")?.addEventListener("click", () => {
    detailsPanel.querySelector("#detailsMediaSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.getElementById("detailsMuteConversationQuick")?.addEventListener("click", () => muteConversation().catch((error) => toast(error.message)));
  document.getElementById("detailsOpenThemeQuick")?.addEventListener("click", openThemeModal);
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
  if (state.isOffline) {
    toast("Wiadomosci glosowe wymagaja internetu do wyslania.");
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
  if (state.isOffline) {
    toast("Zalaczniki wymagaja internetu. Tekstowe wiadomosci mozesz zapisac offline.");
    return;
  }
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

function showLegalSettings() {
  settingsLayout.querySelector(".settings-content").innerHTML = `
    <h3>Informacje prawne i zasady</h3>
    <div class="settings-banner settings-banner-dark">
      <strong>Dokumenty i zasady</strong>
      <p>Ten ekran jest ulozony bardziej jak menu komunikatora: najpierw wybierasz dokument, a dopiero potem czytasz szczegoly.</p>
    </div>
    <div class="settings-doc-list">
      <button class="settings-doc-item" id="openTermsDocument" type="button">
        <span>Regulamin</span>
        <i data-lucide="chevron-right"></i>
      </button>
      <button class="settings-doc-item" id="openPrivacyDocument" type="button">
        <span>Zasady ochrony prywatnosci</span>
        <i data-lucide="chevron-right"></i>
      </button>
      <button class="settings-doc-item" id="openCookiesInfo" type="button">
        <span>Zasady dotyczace plikow cookie</span>
        <i data-lucide="chevron-right"></i>
      </button>
      <button class="settings-doc-item" id="openVendorsInfo" type="button">
        <span>Informacje dotyczace oprogramowania innych producentow</span>
        <i data-lucide="chevron-right"></i>
      </button>
      <button class="settings-doc-item" id="openEuInfo" type="button">
        <span>Rozporzadzenie UE 2021/1232</span>
        <i data-lucide="chevron-right"></i>
      </button>
    </div>
  `;
  settingsLayout.querySelector("#openTermsDocument")?.addEventListener("click", () => openInfoDocument("terms"));
  settingsLayout.querySelector("#openPrivacyDocument")?.addEventListener("click", () => openInfoDocument("privacy"));
  settingsLayout.querySelector("#openCookiesInfo")?.addEventListener("click", () => {
    infoDocuments.cookies = {
      title: "Pliki cookie",
      intro: "LinkTalk korzysta z lokalnego zapisu potrzebnego do sesji, cache aplikacji, pracy offline i zapamietania wybranych ustawien interfejsu.",
      sections: [
        {
          heading: "Jakie dane zapisujemy lokalnie",
          bullets: [
            "token sesji i stan logowania obslugiwany przez Supabase",
            "ostatnie rozmowy i kolejke wiadomosci offline",
            "ustawienia wygladu czatu, np. motyw i tapeta"
          ]
        }
      ]
    };
    openInfoDocument("cookies");
  });
  settingsLayout.querySelector("#openVendorsInfo")?.addEventListener("click", () => {
    infoDocuments.vendors = {
      title: "Oprogramowanie innych producentow",
      intro: "Aplikacja korzysta z uslug i bibliotek zewnetrznych potrzebnych do logowania, synchronizacji, hostingu i transkrypcji.",
      sections: [
        {
          heading: "Glowni dostawcy",
          bullets: [
            "Supabase do bazy danych, Auth, Storage i Realtime",
            "OpenAI do funkcji transkrypcji audio na tekst, gdy uzytkownik uruchomi te opcje",
            "hosting WWW i narzedzia publikacji dla strony oraz APK"
          ]
        }
      ]
    };
    openInfoDocument("vendors");
  });
  settingsLayout.querySelector("#openEuInfo")?.addEventListener("click", () => {
    infoDocuments.eu = {
      title: "Rozporzadzenie UE 2021/1232",
      intro: "W publicznej wersji aplikacji administrator powinien dopilnowac zgodnosci z zasadami prywatnosci, tajemnicy komunikacji oraz legalnej obslugi tresci zglaszanych przez uzytkownikow.",
      sections: [
        {
          heading: "Znaczenie dla komunikatora",
          paragraphs: [
            "Przy wdrozeniu publicznym trzeba jasno opisac zasady moderacji, przechowywania danych, zglaszania naduzyc i przetwarzania wiadomosci przez dostawcow infrastruktury.",
            "W praktyce ten ekran jest miejscem, gdzie pokazujesz uzytkownikowi, ze usluga jest uporzadkowana i prowadzona odpowiedzialnie."
          ]
        }
      ]
    };
    openInfoDocument("eu");
  });
  refreshIcons();
}

function openSettings() {
  const verification = verificationState();
  document.getElementById("settingsTitle").textContent = "Ustawienia";
  settingsLayout.innerHTML = `
    <div class="settings-menu">
      <div class="settings-profile-card">
        ${avatarMarkup({
          label: state.profile?.display_name || state.profile?.username || "Profil",
          imageUrl: state.profile?.avatar_url,
          online: state.profile?.is_online
        })}
        <div>
          <strong>${escapeHtml(state.profile?.display_name || "Profil")}</strong>
          <span>@${escapeHtml(state.profile?.username || "linktalk")}</span>
          <small>${escapeHtml(state.profile?.status_text || "Gotowy(a) do rozmowy")}</small>
        </div>
      </div>

      <div class="settings-menu-group">
        <div class="settings-group-title">Profil</div>
        <button class="list-button" id="editDisplayName"><i data-lucide="user-round"></i>Nazwa profilu</button>
        <button class="list-button" id="editUsername"><i data-lucide="at-sign"></i>Username</button>
        <button class="list-button" id="editStatus"><i data-lucide="message-square-text"></i>Status</button>
        <button class="list-button" id="showPrivateData"><i data-lucide="id-card"></i>Dane osobowe</button>
      </div>

      <div class="settings-menu-group">
        <div class="settings-group-title">Prywatnosc i logowanie</div>
        <button class="list-button" id="showVerificationCenter"><i data-lucide="badge-check"></i>Weryfikacja konta</button>
        <button class="list-button" id="toggleReadReceipts"><i data-lucide="check-check"></i>Potwierdzenia odczytu: ${state.profile?.read_receipts_enabled ? "wlaczone" : "wylaczone"}</button>
        <button class="list-button" id="toggleAutoTranscript"><i data-lucide="captions"></i>Auto-transkrypcja: ${state.profile?.auto_transcribe_voice ? "wlaczona" : "wylaczona"}</button>
      </div>

      <div class="settings-menu-group">
        <div class="settings-group-title">Aplikacja</div>
        <button class="list-button" id="showPwaInstall"><i data-lucide="smartphone"></i>Instalacja Android/iPhone</button>
        <button class="list-button" id="showLegalHub"><i data-lucide="scroll-text"></i>Informacje prawne i zasady</button>
        <button class="list-button" id="refreshApplication"><i data-lucide="refresh-cw"></i>Odswiez aplikacje</button>
        <button class="list-button" id="logoutButton"><i data-lucide="log-out"></i>Wyloguj</button>
      </div>
    </div>
    <div class="settings-content">
      <h3>Twoje konto</h3>
      <div class="settings-row"><span>Username</span><strong>${escapeHtml(state.profile?.username || "")}</strong></div>
      <div class="settings-row"><span>Rola</span><strong>${escapeHtml(state.profile?.role || "member")}</strong></div>
      <div class="settings-row"><span>Status</span><span>${escapeHtml(state.profile?.status_text || "")}</span></div>
      <div class="settings-row"><span>Email</span><strong>${verification.emailConfirmed ? "potwierdzony" : "czeka na potwierdzenie"}</strong></div>
      <div class="settings-row"><span>Telefon</span><strong>${verification.phoneConfirmed ? maskPhoneNumber(verification.phone) : (verification.phone ? "czeka na kod SMS" : "nie dodano")}</strong></div>
      <div class="settings-row"><span>Wydanie</span><strong>${escapeHtml(BUILD_VERSION)}</strong></div>
      <div class="settings-banner">
        <strong>Profil, prywatnosc i bezpieczenstwo</strong>
        <p>Uzupelnij dane prywatne, potwierdz telefon i dopnij ustawienia maili oraz SMS. To pozwoli prowadzic komunikator jak prawdziwa, uporzadkowana usluge.</p>
      </div>
      <div class="settings-status-grid">
        <div class="settings-status-card">
          <strong>${verification.emailConfirmed ? "Email gotowy" : "Email czeka"}</strong>
          <span>${verification.emailConfirmed ? "Konto moze wracac przez poczte bez przeszkod." : "Klient powinien dostac link albo 6-cyfrowy kod z maila."}</span>
        </div>
        <div class="settings-status-card">
          <strong>${verification.phoneConfirmed ? "Telefon potwierdzony" : "Telefon do dopiecia"}</strong>
          <span>${verification.phoneConfirmed ? "Numer jest juz spiety z kontem." : "Po konfiguracji dostawcy SMS mozna od razu domykac konto kodem."}</span>
        </div>
      </div>
    </div>
  `;
  settingsLayout.querySelector("#editDisplayName").addEventListener("click", () => updateProfileText("display_name", "Nowa nazwa profilu").catch((error) => toast(error.message)));
  settingsLayout.querySelector("#editUsername").addEventListener("click", () => updateProfileText("username", "Nowy username").catch((error) => toast(error.message)));
  settingsLayout.querySelector("#editStatus").addEventListener("click", () => updateProfileText("status_text", "Nowy status").catch((error) => toast(error.message)));
  settingsLayout.querySelector("#showVerificationCenter").addEventListener("click", showVerificationCenter);
  settingsLayout.querySelector("#showPrivateData").addEventListener("click", showPrivateProfileSettings);
  settingsLayout.querySelector("#toggleReadReceipts").addEventListener("click", () => toggleProfileBoolean("read_receipts_enabled").catch((error) => toast(error.message)));
  settingsLayout.querySelector("#toggleAutoTranscript").addEventListener("click", () => toggleProfileBoolean("auto_transcribe_voice").catch((error) => toast(error.message)));
  settingsLayout.querySelector("#showPwaInstall").addEventListener("click", showPwaInstall);
  settingsLayout.querySelector("#showLegalHub").addEventListener("click", showLegalSettings);
  settingsLayout.querySelector("#refreshApplication").addEventListener("click", () => refreshInstalledAssets().catch((error) => toast(error.message)));
  settingsLayout.querySelector("#logoutButton").addEventListener("click", async () => {
    await supabase.auth.signOut();
  });
  settingsModal.showModal();
  refreshIcons();
}

function showPrivateProfileSettings() {
  const details = state.privateProfile || {};
  const isLegacyMode = state.privateProfileMode === "legacy-plaintext";
  settingsLayout.querySelector(".settings-content").innerHTML = `
    <h3>Dane osobowe</h3>
    <div class="settings-banner">
      <strong>${isLegacyMode ? "Wykryto starszy zapis danych" : "Dane tylko dla Ciebie i administratora"}</strong>
      <p>${isLegacyMode
        ? "Ten rekord jest jeszcze w starszym trybie zgodnosci. Klikniecie Zapisz dane przenosi go do szyfrowanego sejfu, gdy funkcja serwerowa jest wdrozona."
        : `Email jest brany z konta Supabase Auth. Telefon, adres i PESEL sa zapisywane po stronie serwera w szyfrowanym sejfie. Telefon: ${verificationState().phoneConfirmed ? "potwierdzony" : "mozna potwierdzic kodem SMS w sekcji Weryfikacja konta"}.`}</p>
    </div>
    <form class="profile-form-grid" id="privateProfileForm">
      <label class="field">
        Email
        <input type="email" value="${escapeHtml(state.user?.email || "")}" disabled />
      </label>
      <label class="field">
        Imie i nazwisko
        <input name="full_name" type="text" maxlength="240" value="${escapeHtml(details.full_name || "")}" placeholder="Np. Ewelina Kowalska" />
      </label>
      <label class="field">
        Numer telefonu
        <input name="phone" type="tel" maxlength="40" value="${escapeHtml(details.phone || "")}" placeholder="Np. +48 600 000 000" />
      </label>
      <label class="field field-span-2">
        Adres zamieszkania
        <textarea name="home_address" rows="3" maxlength="240" placeholder="Ulica, numer, kod pocztowy, miasto">${escapeHtml(details.home_address || "")}</textarea>
      </label>
      <label class="field">
        PESEL
        <input name="pesel" type="text" inputmode="numeric" maxlength="11" value="${escapeHtml(details.pesel || "")}" placeholder="11 cyfr" />
        <span class="field-note">Aktualnie zapisany PESEL: <strong class="sensitive-value">${escapeHtml(maskPesel(details.pesel))}</strong>. Pokazujemy tylko zamaskowana koncowke.</span>
      </label>
      <div class="field">
        Tryb przechowywania
        <div class="settings-stack">
          <span>${privateProfileModeLabel()}</span>
          <span class="field-note">${isLegacyMode ? "Po udanym zapisie rekord przejdzie do sejfu szyfrujacego." : "Dane nie sa czytane bezposrednio z publicznej tabeli komunikatora."}</span>
        </div>
      </div>
      <div class="field">
        Stan rekordu
        <div class="settings-stack">
          <span>${hasSavedPrivateProfile(details) ? "Zapisano dane prywatne" : "Jeszcze nie zapisano danych prywatnych"}</span>
          <span class="field-note">${details.data_consent_at ? `Pierwszy zapis: ${escapeHtml(formatTime(details.data_consent_at))}` : "Po pierwszym zapisie aplikacja doda znacznik czasu zgody."}</span>
        </div>
      </div>
      <div class="settings-inline field-span-2">
        <button class="primary-button" type="submit">Zapisz dane</button>
        <button class="secondary-button" id="clearPrivateDataButton" type="button">Wyczysc pola</button>
      </div>
    </form>
  `;
  settingsLayout.querySelector("#privateProfileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    savePrivateProfileForm(event.currentTarget).catch((error) => toast(error.message));
  });
  settingsLayout.querySelector("#clearPrivateDataButton").addEventListener("click", clearPrivateProfileForm);
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

async function savePrivateProfileForm(form) {
  if (!state.privateProfile) await loadPrivateProfile();
  const formData = new FormData(form);
  const patch = {
    full_name: normalizePrivateField("full_name", String(formData.get("full_name") || "")) || null,
    phone: normalizePrivateField("phone", String(formData.get("phone") || "")) || null,
    home_address: normalizePrivateField("home_address", String(formData.get("home_address") || "")) || null,
    pesel: normalizePrivateField("pesel", String(formData.get("pesel") || "")) || null
  };
  if (Object.values(patch).some(Boolean) && !state.privateProfile?.data_consent_at) {
    patch.data_consent_at = new Date().toISOString();
  }
  await persistPrivateProfilePatch(patch);
  showPrivateProfileSettings();
  toast(state.privateProfileMode === "legacy-plaintext"
    ? "Zapisano dane osobowe w trybie zgodnosci. Wdroz funkcje privateProfileVault, aby przeniesc je do szyfrowanego sejfu."
    : "Zapisano dane osobowe w szyfrowanym sejfie.");
}

function clearPrivateProfileForm() {
  const form = settingsLayout.querySelector("#privateProfileForm");
  if (!form) return;
  form.querySelectorAll("input:not([disabled]), textarea").forEach((field) => {
    field.value = "";
  });
}

function normalizePrivateField(field, value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (field === "pesel") {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length !== 11) throw new Error("PESEL musi miec 11 cyfr.");
    return digits;
  }
  if (field === "phone") {
    const normalized = normalizePhoneInput(trimmed);
    if (!normalized || !isValidPhoneNumber(normalized)) throw new Error("Numer telefonu powinien miec format miedzynarodowy, np. +48795731886.");
    return normalized;
  }
  return trimmed.slice(0, 240);
}

function maskPesel(value) {
  if (!value) return "Nie podano";
  const digits = String(value).replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  return `*******${digits.slice(-4)}`;
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
    <p>Android: otworz te strone w Chrome i zainstaluj ja jak aplikacje. Gdy APK jest gotowe, mozesz tez pobrac plik bezposrednio.</p>
    ${apkDownloadMarkup()}
    <p>iPhone: otworz w Safari, wybierz udostepnianie i dodaj do ekranu poczatkowego.</p>
    <div class="settings-banner">
      <strong>WWW + APK + offline</strong>
      <p>Po pierwszej synchronizacji aplikacja zapamieta ostatnie rozmowy na urzadzeniu. Gdy zabraknie internetu, tekstowe wiadomosci beda zapisywane lokalnie i wysla sie po powrocie sieci.</p>
    </div>
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

function friendshipProfile(row) {
  const otherId = row.requester_id === state.user.id ? row.addressee_id : row.requester_id;
  return state.profiles[otherId] || null;
}

async function renderContactsView() {
  await loadFriendships();
  setInboxContext("Relacje", "Znajomi i osoby blisko Ciebie", { showStories: true, showFilters: false });
  renderStoryStrip();
  const accepted = state.friendships.filter((row) => row.status === "accepted");
  const incoming = state.friendships.filter((row) => row.status === "pending" && row.addressee_id === state.user.id);
  const outgoing = state.friendships.filter((row) => row.status === "pending" && row.requester_id === state.user.id);
  conversationList.innerHTML = `
    <div class="contact-block">
      <div class="contact-block-head">
        <div>
          <h3>Relacje</h3>
          <p class="preview">Dodaj osoby po username i otwieraj rozmowy jednym kliknieciem.</p>
        </div>
        <button class="primary-button" id="addFriendButton" type="button">Dodaj osobe</button>
      </div>
    </div>
    ${incoming.length ? `
      <div class="contact-block">
        <div class="details-section-label">Prosby do zaakceptowania</div>
        ${incoming.map((row) => {
          const profile = friendshipProfile(row);
          const username = profile?.username ? `@${profile.username}` : "Nowa osoba";
          return `
            <div class="contact-person-row">
              ${avatarMarkup({
                label: friendshipName(row),
                imageUrl: profile?.avatar_url,
                online: profile?.is_online
              })}
              <div class="contact-person-main">
                <strong>${escapeHtml(friendshipName(row))}</strong>
                <span>${escapeHtml(username)}</span>
              </div>
              <div class="contact-person-actions">
                <button class="mini-action" data-accept-friend="${row.id}">Akceptuj</button>
                <button class="mini-action" data-decline-friend="${row.id}">Odrzuc</button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    ` : ""}
    <div class="contact-block">
      <div class="details-section-label">Lista kontaktow</div>
      ${accepted.length ? accepted.map((row) => {
        const profile = friendshipProfile(row);
        const username = profile?.username || "";
        const subtitle = profile?.is_online
          ? "Aktywny(a) teraz"
          : (profile?.status_text || `@${username}`);
        return `
          <button class="contact-person-row contact-person-button" data-chat-username="${escapeHtml(username)}" type="button">
            ${avatarMarkup({
              label: friendshipName(row),
              imageUrl: profile?.avatar_url,
              online: profile?.is_online
            })}
            <div class="contact-person-main">
              <strong>${escapeHtml(friendshipName(row))}</strong>
              <span>${escapeHtml(subtitle)}</span>
            </div>
            <span class="contact-person-meta">${profile?.is_online ? "Online" : "Czat"}</span>
          </button>
        `;
      }).join("") : "<p class='preview'>Brak zaakceptowanych kontaktow.</p>"}
    </div>
    ${outgoing.length ? `
      <div class="contact-block">
        <div class="details-section-label">Wyslane prosby</div>
        ${outgoing.map((row) => {
          const profile = friendshipProfile(row);
          return `
            <div class="contact-person-row contact-person-row-muted">
              ${avatarMarkup({
                label: friendshipName(row),
                imageUrl: profile?.avatar_url
              })}
              <div class="contact-person-main">
                <strong>${escapeHtml(friendshipName(row))}</strong>
                <span>Prosba oczekuje na odpowiedz</span>
              </div>
              <span class="contact-person-meta">Wyslano</span>
            </div>
          `;
        }).join("")}
      </div>
    ` : ""}
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
  setInboxContext("Powiadomienia", "Prosby i aktywnosc", { showStories: false, showFilters: false });
  if (storyStrip) storyStrip.innerHTML = "";
  const incoming = state.friendships.filter((row) => row.status === "pending" && row.addressee_id === state.user.id);
  conversationList.innerHTML = `
    <div class="contact-block">
      <div class="contact-block-head">
        <div>
          <h3>Powiadomienia</h3>
          <p class="preview">Tu wpadaja nowe prosby i aktywnosc zwiazana z kontaktami.</p>
        </div>
      </div>
    </div>
    <div class="contact-block">
      <div class="details-section-label">Prosby o kontakt</div>
      ${incoming.length ? incoming.map((row) => {
        const profile = friendshipProfile(row);
        return `
          <div class="contact-person-row">
            ${avatarMarkup({
              label: friendshipName(row),
              imageUrl: profile?.avatar_url,
              online: profile?.is_online
            })}
            <div class="contact-person-main">
              <strong>${escapeHtml(friendshipName(row))}</strong>
              <span>${escapeHtml(profile?.status_text || "Chce nawiazac kontakt")}</span>
            </div>
            <div class="contact-person-actions">
              <button class="mini-action" data-accept-friend="${row.id}">Akceptuj</button>
            </div>
          </div>
        `;
      }).join("") : "<p class='preview'>Brak nowych prosb.</p>"}
    </div>
  `;
  conversationList.querySelectorAll("[data-accept-friend]").forEach((button) => {
    button.addEventListener("click", () => respondFriendship(button.dataset.acceptFriend, "accepted").catch((error) => toast(error.message)));
  });
}

async function renderAdminView() {
  setInboxContext("Admin", "Moderacja i zgloszenia", { showStories: false, showFilters: false });
  if (storyStrip) storyStrip.innerHTML = "";
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
    setInboxContext("Grupy", "Rozmowy grupowe", { showStories: false, showFilters: !isMobileLayout() });
    if (storyStrip) storyStrip.innerHTML = "";
    renderConversationList();
  }
}

function bindUi() {
  const openAuthForMode = (mode) => {
    setAuthMode(mode);
    setAuthPanelOpen(true);
  };
  const handleInstallClick = async () => {
    if (deferredInstallPrompt && !isStandaloneApp()) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice.catch(() => null);
      deferredInstallPrompt = null;
      syncInlineApkDownload().catch(() => {});
      return;
    }
    if (apkDownloadAvailable && apkUrl) {
      window.open(apkUrl, "_blank", "noopener");
      return;
    }
    toast("Na Androidzie otworz te strone w Chrome. Gdy przegladarka pozwoli, przycisk zmieni sie w instalacje aplikacji.");
  };

  refreshAppButton?.addEventListener("click", () => refreshInstalledAssets().catch((error) => toast(error.message)));
  authLoginModeButton?.addEventListener("click", () => setAuthMode("login"));
  authRegisterModeButton?.addEventListener("click", () => setAuthMode("register"));
  authTopLoginButton?.addEventListener("click", () => openAuthForMode("login"));
  authTopRegisterButton?.addEventListener("click", () => openAuthForMode("register"));
  heroLoginButton?.addEventListener("click", () => openAuthForMode("login"));
  heroRegisterButton?.addEventListener("click", () => openAuthForMode("register"));
  authClosePanelButton?.addEventListener("click", () => setAuthPanelOpen(false));
  authSecondaryModeButton?.addEventListener("click", () => setAuthMode(authMode === "login" ? "register" : "login"));
  sendEmailCodeButton?.addEventListener("click", () => requestEmailCodeForLogin(false));
  toggleAuthPasswordButton?.addEventListener("click", () => {
    if (!authPassword) return;
    authPassword.type = authPassword.type === "password" ? "text" : "password";
    syncPasswordToggleIcon();
  });
  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (authMode === "register") {
      if (state.isOffline) {
        setAuthStatus("Brak internetu. Rejestracja wymaga polaczenia z serwerem.", "error");
        return;
      }
      if (!authForm.reportValidity()) return;
      lastAuthEmail = document.getElementById("authEmail").value.trim();
      setAuthBusy(true, "Tworzenie konta...");
      try {
        const registrationData = collectRegistrationFields();
        lastEmailFlow = "signup";
        const registrationResult = await register(lastAuthEmail, authPassword.value, registrationData);
        if (registrationResult.kind !== "logged-in") startResendCooldown(45);
        setAuthStatus(registrationResult.message, "success", {
          showResend: registrationResult.kind !== "logged-in",
          showEmailOtp: registrationResult.kind !== "logged-in"
        });
      } catch (error) {
        showAuthError(error);
      } finally {
        setAuthBusy(false);
      }
      return;
    }
    if (state.isOffline) {
      setAuthStatus("Brak internetu. Nowe logowanie wymaga polaczenia, ale zapisane rozmowy otworza sie automatycznie po rozpoznaniu sesji.", "error");
      return;
    }
    if (!authForm.reportValidity()) return;
    lastAuthEmail = document.getElementById("authEmail").value.trim();
    lastEmailFlow = "password";
    setAuthBusy(true, "Logowanie...");
    try {
      await login(lastAuthEmail, authPassword.value);
      setAuthStatus("Zalogowano. Laduje rozmowy...", "success");
    } catch (error) {
      showAuthError(error);
    } finally {
      setAuthBusy(false);
    }
  });

  resendConfirmationButton?.addEventListener("click", resendConfirmationEmail);
  verifyEmailOtpButton?.addEventListener("click", verifyEmailOtpCode);
  authRateLimitHelpButton?.addEventListener("click", () => openInfoDocument("rateLimit"));
  document.getElementById("showTermsAuthButton")?.addEventListener("click", () => openInfoDocument("terms"));
  document.getElementById("showPrivacyAuthButton")?.addEventListener("click", () => openInfoDocument("privacy"));
  listenInfoButton?.addEventListener("click", toggleInfoNarration);
  listenLandingButton?.addEventListener("click", toggleLandingNarration);
  listenTermsButton?.addEventListener("click", () => openInfoDocumentWithAudio("terms"));
  listenPrivacyButton?.addEventListener("click", () => openInfoDocumentWithAudio("privacy"));
  infoModal?.addEventListener("close", stopInfoNarration);
  authInstallButton?.addEventListener("click", handleInstallClick);
  authTopInstallButton?.addEventListener("click", handleInstallClick);
  heroInstallButton?.addEventListener("click", handleInstallClick);

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
  inboxSettingsButton?.addEventListener("click", () => openSettings());
  openAiButton?.addEventListener("click", () => {
    searchInput.focus();
    if (isMobileLayout()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
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
  window.addEventListener("online", () => {
    state.isOffline = false;
    renderConnectionStatus();
    toast("Internet wrocil. Synchronizuje zapisane wiadomosci...");
    flushQueuedMessages().catch((error) => toast(error.message || error));
  });
  window.addEventListener("offline", () => {
    state.isOffline = true;
    renderConnectionStatus();
    toast("Brak internetu. Ostatnie rozmowy zostaja na urzadzeniu, a nowe teksty zapiszemy offline.");
    render();
  });
  window.addEventListener("resize", () => {
    if (!authScreen.classList.contains("hidden")) return;
    if (state.activeView === "chats" || state.activeView === "groups") renderConversationList();
    else renderUtilityView(state.activeView).catch(() => {});
  });
  updateLandingNarrationButton();
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
