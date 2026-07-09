import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.108.0/+esm";

const config = window.BLISKOCHAT_CONFIG || {};
const supabase = config.supabaseUrl && config.supabaseAnonKey
  ? createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;
const apkUrl = String(config.apkUrl || "").trim();

const docs = {
  terms: {
    title: "Regulamin",
    intro: "LinkTalk jest prywatnym komunikatorem do rozmow, przesylania plikow i wiadomosci glosowych.",
    sections: [
      {
        heading: "Korzystanie z aplikacji",
        paragraphs: [
          "Uzytkownik korzysta z aplikacji na wlasna odpowiedzialnosc i zobowiazuje sie nie publikowac tresci bezprawnych, obrazliwych ani naruszajacych prywatnosc innych osob.",
          "Konto moze zostac ograniczone lub zablokowane przez administratora, jesli sluzy do spamu, podszywania sie pod inne osoby albo narusza zasady bezpieczenstwa."
        ]
      },
      {
        heading: "Konta i dostep",
        paragraphs: [
          "Logowanie i rejestracja dzialaja przez Supabase Auth. Uzytkownik odpowiada za poprawnosc podanego emaila oraz bezpieczenstwo swojego hasla.",
          "W prywatnym trybie testowym administrator moze tymczasowo wylaczyc potwierdzanie emaila, aby uniknac limitu 429 przy testach."
        ]
      },
      {
        heading: "Wiadomosci i pliki",
        paragraphs: [
          "Wiadomosci, pliki i nagrania glosowe sa zapisywane w uslugach Supabase podlaczonych do tej instancji aplikacji.",
          "Administrator aplikacji odpowiada za konfiguracje retencji danych, kopii zapasowych i dostepow administracyjnych."
        ]
      }
    ]
  },
  privacy: {
    title: "Polityka prywatnosci",
    intro: "Aplikacja przetwarza tylko dane potrzebne do logowania, komunikacji i obslugi prywatnego profilu uzytkownika.",
    sections: [
      {
        heading: "Jakie dane sa zapisywane",
        bullets: [
          "email i haslo w Supabase Auth",
          "publiczny profil czatu: nazwa, username, status, avatar i ustawienia rozmow",
          "profil prywatny: imie i nazwisko, telefon, adres zamieszkania, PESEL",
          "wiadomosci, reakcje, pliki, raporty i blokady potrzebne do dzialania komunikatora"
        ]
      },
      {
        heading: "Cel przetwarzania",
        paragraphs: [
          "Dane konta i rozmowy sa potrzebne do logowania, synchronizacji wiadomosci oraz utrzymania kontaktow miedzy uzytkownikami.",
          "Dane prywatne z tabeli profile_private nie sa pokazywane publicznie w czacie i sa ograniczone przez RLS do wlasciciela konta oraz administratora."
        ]
      },
      {
        heading: "Prawa uzytkownika",
        paragraphs: [
          "Uzytkownik moze poprawiac swoje dane z poziomu ustawien aplikacji oraz poprosic administratora o ich usuniecie.",
          "Przed publicznym uruchomieniem aplikacji warto dopisac prawdziwe dane kontaktowe administratora oraz opis okresu przechowywania danych."
        ]
      }
    ]
  },
  rateLimit: {
    title: "Pomoc 429",
    intro: "Blad 429 przy rejestracji najczesciej oznacza limit wysylki maili potwierdzajacych po stronie Supabase Auth.",
    sections: [
      {
        heading: "Co zrobic teraz",
        bullets: [
          "odczekaj chwile i nie klikaj rejestracji lub resend kilka razy pod rzad",
          "w Supabase wejdz w Authentication -> Providers -> Email",
          "dla prywatnych testow ustaw Confirm email na OFF",
          "po zmianie odswiez strone i sprobuj utworzyc konto jeszcze raz"
        ]
      },
      {
        heading: "Co ustawic docelowo",
        paragraphs: [
          "Dla publicznej wersji warto zostawic potwierdzanie emaila wlaczone i podpiac wlasny SMTP, np. Brevo, Resend albo Mailgun.",
          "W aplikacji zostal dodany cooldown na ponowna wysylke, zeby ograniczyc wpadanie w limit przy testach."
        ]
      }
    ]
  }
};

const cooldown = {
  until: 0,
  timer: null
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function apkDownloadMarkup() {
  if (!apkUrl) {
    return '<p class="field-note">Link do APK pojawi sie tutaj po zbudowaniu paczki Android i wgraniu jej na serwer.</p>';
  }
  return `<p><a class="download-link" href="${escapeHtml(apkUrl)}" download>Pobierz aplikacje mobilna</a></p>`;
}

function toast(text) {
  const item = document.createElement("div");
  item.textContent = text;
  Object.assign(item.style, {
    position: "fixed",
    left: "50%",
    bottom: "74px",
    transform: "translateX(-50%)",
    background: "var(--text, #050505)",
    color: "var(--panel, #ffffff)",
    padding: "10px 14px",
    borderRadius: "8px",
    zIndex: 200,
    maxWidth: "min(520px, calc(100vw - 32px))"
  });
  document.body.appendChild(item);
  window.setTimeout(() => item.remove(), 3600);
}

function refreshIcons() {
  window.lucide?.createIcons({
    attrs: {
      "aria-hidden": "true"
    }
  });
}

function injectStyles() {
  if (document.getElementById("enhancementStyles")) return;
  const style = document.createElement("style");
  style.id = "enhancementStyles";
  style.textContent = `
    .settings-banner {
      margin-top: 12px;
      padding: 12px;
      border-radius: 8px;
      background: var(--panel, #ffffff);
      border: 1px solid var(--line, #e4e6eb);
    }
    .settings-banner strong {
      display: block;
      margin-bottom: 4px;
    }
    .settings-banner p {
      margin: 0;
      color: var(--muted, #65676b);
    }
    .settings-inline {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }
    .settings-stack {
      display: grid;
      gap: 6px;
    }
    .profile-form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 14px;
    }
    .field-span-2 {
      grid-column: 1 / -1;
    }
    .field textarea {
      width: 100%;
      min-height: 88px;
      resize: vertical;
      padding: 12px;
      border: 0;
      border-radius: 8px;
      background: var(--panel-2, #f5f6f8);
      color: var(--text, #050505);
      font: inherit;
      outline: none;
    }
    .field input:disabled {
      color: var(--muted, #65676b);
    }
    .field-note {
      color: var(--muted, #65676b);
      font-size: 12px;
      line-height: 1.4;
    }
    .auth-quick-links {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 14px;
    }
    .inline-link-button {
      border: 0;
      background: transparent;
      color: var(--accent, #0866ff);
      font-weight: 800;
      padding: 0;
    }
    .inline-link-button:hover {
      text-decoration: underline;
    }
    .modal-wide {
      width: min(860px, calc(100vw - 28px));
    }
    .info-content {
      display: grid;
      gap: 18px;
      margin-top: 12px;
    }
    .info-intro {
      padding: 12px 14px;
      border-radius: 8px;
      background: var(--panel-2, #f5f6f8);
      color: var(--text, #050505);
      line-height: 1.5;
    }
    .info-section {
      border-bottom: 1px solid var(--line, #e4e6eb);
      padding-bottom: 16px;
    }
    .info-section:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }
    .info-section h3 {
      margin-bottom: 8px;
    }
    .info-section p {
      margin-bottom: 8px;
      color: var(--muted, #65676b);
      line-height: 1.5;
    }
    .info-list {
      margin: 0;
      padding-left: 18px;
      color: var(--muted, #65676b);
      line-height: 1.5;
    }
    @media (max-width: 760px) {
      .profile-form-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureInfoModal() {
  let modal = document.getElementById("infoModal");
  if (modal) return modal;
  modal = document.createElement("dialog");
  modal.id = "infoModal";
  modal.className = "modal modal-wide";
  modal.innerHTML = `
    <div class="modal-header">
      <h2 id="infoTitle">Informacje</h2>
      <button class="icon-button" type="button" id="closeInfoModal" aria-label="Zamknij">
        <i data-lucide="x"></i>
      </button>
    </div>
    <div class="info-content" id="infoContent"></div>
  `;
  document.body.appendChild(modal);
  modal.querySelector("#closeInfoModal")?.addEventListener("click", () => modal.close());
  refreshIcons();
  return modal;
}

function renderInfoDocument(kind) {
  const doc = docs[kind] || docs.terms;
  const modal = ensureInfoModal();
  const title = modal.querySelector("#infoTitle");
  const content = modal.querySelector("#infoContent");
  if (!title || !content) return modal;

  title.textContent = doc.title;
  content.innerHTML = `
    <div class="info-intro">${escapeHtml(doc.intro || "")}</div>
    ${doc.sections.map((section) => `
      <section class="info-section">
        <h3>${escapeHtml(section.heading)}</h3>
        ${(section.paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        ${section.bullets?.length ? `<ul class="info-list">${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
      </section>
    `).join("")}
  `;
  return modal;
}

function openInfoDocument(kind) {
  const modal = renderInfoDocument(kind);
  if (!modal.open) modal.showModal();
  refreshIcons();
}

function getCooldownSeconds() {
  return Math.max(0, Math.ceil((cooldown.until - Date.now()) / 1000));
}

function syncResendButton() {
  const button = document.getElementById("resendConfirmationButton");
  if (!button || button.classList.contains("hidden")) return;
  const seconds = getCooldownSeconds();
  button.textContent = seconds > 0
    ? `Wyslij ponownie za ${seconds}s`
    : "Wyslij link potwierdzajacy ponownie";
  button.disabled = seconds > 0;
}

function startCooldown(seconds) {
  cooldown.until = Date.now() + seconds * 1000;
  window.clearInterval(cooldown.timer);
  syncResendButton();
  cooldown.timer = window.setInterval(() => {
    syncResendButton();
    if (getCooldownSeconds() <= 0) {
      window.clearInterval(cooldown.timer);
      cooldown.timer = null;
    }
  }, 1000);
}

function getAuthStatusState() {
  const status = document.getElementById("authStatus");
  const text = String(status?.textContent || "").toLowerCase();
  return {
    status,
    text,
    isRateLimit: text.includes("429") || text.includes("rate limit") || text.includes("too many requests"),
    needsConfirm: text.includes("potwierdzone") || text.includes("potwierdzaj")
  };
}

function ensureAuthExtras() {
  const authCard = document.querySelector(".auth-card");
  if (!authCard) return;

  const helpActions = authCard.querySelector(".auth-help-actions");
  if (helpActions && !document.getElementById("authRateLimitHelpButton")) {
    const helpButton = document.createElement("button");
    helpButton.type = "button";
    helpButton.id = "authRateLimitHelpButton";
    helpButton.className = "secondary-button hidden";
    helpButton.textContent = "Pomoc 429 i testy";
    helpActions.appendChild(helpButton);
  }

  if (!authCard.querySelector(".auth-quick-links")) {
    const links = document.createElement("div");
    links.className = "auth-quick-links";
    links.innerHTML = `
      <button class="inline-link-button" type="button" data-open-info="terms">Regulamin</button>
      <button class="inline-link-button" type="button" data-open-info="privacy">Polityka prywatnosci</button>
    `;
    authCard.appendChild(links);
  }

  const state = getAuthStatusState();
  const helpButton = document.getElementById("authRateLimitHelpButton");
  if (helpButton) helpButton.classList.toggle("hidden", !state.isRateLimit);
  if (state.isRateLimit) startCooldown(Math.max(getCooldownSeconds(), 60));
  if (state.needsConfirm && state.text.includes("wyslano")) startCooldown(Math.max(getCooldownSeconds(), 45));
  syncResendButton();
}

async function getCurrentUser() {
  if (!supabase) throw new Error("Brak konfiguracji Supabase.");
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Najpierw zaloguj sie do aplikacji.");
  return data.user;
}

async function loadPrivateProfile() {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from("profile_private")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (data) return { user, profile: data };

  const { data: created, error: insertError } = await supabase
    .from("profile_private")
    .insert({ user_id: user.id })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return { user, profile: created };
}

function normalizePrivateField(field, value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (field === "pesel") {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length !== 11) throw new Error("PESEL musi miec 11 cyfr.");
    return digits;
  }
  if (field === "phone") {
    return trimmed.replace(/[^\d+()\s-]/g, "").slice(0, 40);
  }
  return trimmed.slice(0, 240);
}

function formatSavedAt(value) {
  if (!value) return "Nie zapisano jeszcze danych.";
  return `Zapisano dane od ${new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value))}.`;
}

function ensureSettingsExtras() {
  const layout = document.getElementById("settingsLayout");
  const menu = layout?.querySelector(".settings-menu");
  const content = layout?.querySelector(".settings-content");
  if (!menu || !content) return;

  if (!menu.querySelector('[data-extra-settings="terms"]')) {
    const termsButton = document.createElement("button");
    termsButton.type = "button";
    termsButton.className = "list-button";
    termsButton.dataset.extraSettings = "terms";
    termsButton.dataset.openInfo = "terms";
    termsButton.innerHTML = '<i data-lucide="scroll-text"></i>Regulamin';
    menu.appendChild(termsButton);
  }

  if (!menu.querySelector('[data-extra-settings="privacy"]')) {
    const privacyButton = document.createElement("button");
    privacyButton.type = "button";
    privacyButton.className = "list-button";
    privacyButton.dataset.extraSettings = "privacy";
    privacyButton.dataset.openInfo = "privacy";
    privacyButton.innerHTML = '<i data-lucide="shield-check"></i>Polityka prywatnosci';
    menu.appendChild(privacyButton);
  }

  if (!content.querySelector('[data-settings-banner="profile"]')) {
    const banner = document.createElement("div");
    banner.className = "settings-banner";
    banner.dataset.settingsBanner = "profile";
    banner.innerHTML = `
      <strong>Prywatne dane i testy</strong>
      <p>Dane osobowe sa trzymane osobno w profile_private. Przy testach rejestracji z limitem 429 warto tymczasowo wylaczyc Confirm email w Supabase.</p>
    `;
    content.appendChild(banner);
  }

  refreshIcons();
}

async function renderPrivateProfileForm() {
  const content = document.querySelector("#settingsLayout .settings-content");
  if (!content) return;
  try {
    const { user, profile } = await loadPrivateProfile();
    content.innerHTML = `
      <h3>Dane osobowe</h3>
      <div class="settings-banner">
        <strong>Prywatny profil</strong>
        <p>Te dane sa zapisywane osobno od profilu czatu i nie sa publicznie pokazywane w rozmowach.</p>
      </div>
      <form id="privateProfileEnhancementForm" class="profile-form-grid">
        <label class="field">
          Email
          <input type="email" value="${escapeHtml(user.email || "")}" disabled />
        </label>
        <label class="field">
          Telefon
          <input type="text" name="phone" value="${escapeHtml(profile.phone || "")}" />
        </label>
        <label class="field">
          Imie i nazwisko
          <input type="text" name="full_name" value="${escapeHtml(profile.full_name || "")}" />
        </label>
        <label class="field">
          PESEL
          <input type="text" name="pesel" inputmode="numeric" maxlength="11" value="${escapeHtml(profile.pesel || "")}" />
        </label>
        <label class="field field-span-2">
          Adres zamieszkania
          <textarea name="home_address">${escapeHtml(profile.home_address || "")}</textarea>
        </label>
        <div class="field-note field-span-2">${escapeHtml(formatSavedAt(profile.data_consent_at))}</div>
        <div class="settings-inline field-span-2">
          <button class="primary-button" type="submit">Zapisz dane</button>
          <button class="secondary-button" type="button" id="clearPrivateProfileButton">Wyczysc pola</button>
        </div>
      </form>
    `;

    const form = content.querySelector("#privateProfileEnhancementForm");
    const clearButton = content.querySelector("#clearPrivateProfileButton");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const formData = new FormData(form);
        const patch = {
          full_name: normalizePrivateField("full_name", formData.get("full_name")) || null,
          phone: normalizePrivateField("phone", formData.get("phone")) || null,
          home_address: normalizePrivateField("home_address", formData.get("home_address")) || null,
          pesel: normalizePrivateField("pesel", formData.get("pesel")) || null
        };
        if (Object.values(patch).some(Boolean) && !profile.data_consent_at) {
          patch.data_consent_at = new Date().toISOString();
        }
        const { error } = await supabase
          .from("profile_private")
          .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });
        if (error) throw error;
        toast("Zapisano dane osobowe.");
        await renderPrivateProfileForm();
      } catch (error) {
        toast(error.message || "Nie udalo sie zapisac danych.");
      }
    });

    clearButton?.addEventListener("click", () => {
      form?.querySelectorAll("input:not([disabled]), textarea").forEach((field) => {
        field.value = "";
      });
    });
  } catch (error) {
    content.innerHTML = `
      <h3>Dane osobowe</h3>
      <div class="settings-banner">
        <strong>Nie udalo sie otworzyc formularza</strong>
        <p>${escapeHtml(error.message || "Sprobuj ponownie po zalogowaniu.")}</p>
      </div>
    `;
  }
}

function renderInstallHelp() {
  const content = document.querySelector("#settingsLayout .settings-content");
  if (!content) return;
  content.innerHTML = `
    <h3>Instalacja</h3>
    <p>Android: pobierz testowe APK albo otworz strone w Chrome i wybierz instalacje aplikacji.</p>
    ${apkDownloadMarkup()}
    <p>iPhone: otworz w Safari, wybierz udostepnianie i dodaj do ekranu poczatkowego.</p>
    <div class="settings-banner">
      <strong>WWW + APK + offline</strong>
      <p>Po pierwszej synchronizacji aplikacja zapamieta ostatnie rozmowy na urzadzeniu. Gdy zabraknie internetu, tekstowe wiadomosci beda zapisywane lokalnie i wysla sie po powrocie sieci.</p>
    </div>
  `;
}

function bindDocumentEvents() {
  document.addEventListener("click", (event) => {
    const infoButton = event.target.closest("[data-open-info]");
    if (infoButton) {
      event.preventDefault();
      event.stopPropagation();
      openInfoDocument(infoButton.dataset.openInfo);
      return;
    }

    const rateLimitHelp = event.target.closest("#authRateLimitHelpButton");
    if (rateLimitHelp) {
      event.preventDefault();
      event.stopPropagation();
      openInfoDocument("rateLimit");
      return;
    }

    const resendButton = event.target.closest("#resendConfirmationButton");
    if (resendButton && getCooldownSeconds() > 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    const privateButton = event.target.closest("#showPrivateData");
    if (privateButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderPrivateProfileForm();
      return;
    }

    const installButton = event.target.closest("#showPwaInstall");
    if (installButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderInstallHelp();
    }
  }, true);
}

function observeUi() {
  const observer = new MutationObserver(() => {
    ensureAuthExtras();
    ensureSettingsExtras();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"]
  });

  const authStatus = document.getElementById("authStatus");
  if (authStatus) {
    const authObserver = new MutationObserver(() => ensureAuthExtras());
    authObserver.observe(authStatus, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });
  }
}

injectStyles();
ensureInfoModal();
bindDocumentEvents();
ensureAuthExtras();
ensureSettingsExtras();
observeUi();
refreshIcons();
