
// App bootstrap: wires header buttons, tabs, search, then starts the session listener
function showTab(name) {
  currentTab = name;
  document
    .querySelectorAll(".tab")
    .forEach((s) => s.classList.toggle("active", s.id === "tab-" + name));
  document
    .querySelectorAll(".nav-btn")
    .forEach((b) => b.classList.toggle("on", b.dataset.tab === name));
  if (name === "prompt") loadPrompt();
  if (name === "home") loadFeed();
  if (name === "groups" && typeof window.loadGroupRooms === "function")
    window.loadGroupRooms();
  if (name === "profile") {
    renderProfile();
    loadUserMyPostsAndPhotos(currentUser.id);
  }
  document.querySelector("main").scrollTop = 0;
}
document.querySelectorAll(".nav-btn").forEach(
  (b) =>
    (b.onclick = (e) => {
      e.preventDefault();
      showTab(b.dataset.tab);
    })
);

function initSearch() {
  const srForm = document.getElementById("sr-form");
  if (srForm) {
    srForm.onsubmit = async (e) => {
      e.preventDefault();
      const q = document.getElementById("sr-q").value.trim();
      const resBox = document.getElementById("sr-results");
      if (!q || q.length < 2) {
        resBox.innerHTML = `<div class="muted" style="text-align:center; padding:10px;">${t( "min2" )}</div>`;
        return;
      }
      resBox.innerHTML = `<div class="muted" style="text-align:center; padding:10px;">${t( "loading" )}</div>`;

      const { data, error } = await sb
        .from("profiles")
        .select("*")
        .ilike("display_name", `%${q}%`)
        .limit(20);
      if (error || !data || data.length === 0) {
        resBox.innerHTML = `<div class="muted" style="text-align:center; padding:10px;">${t( "no_results" )}</div>`;
        return;
      }

      resBox.innerHTML = data
        .map(
          (u) => ` <div class="search-user-item" data-uid="${ u.id }" style="display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid var(--line); cursor:pointer;"> <div class="uav">${ u.avatar_url ? `<img src="${esc(u.avatar_url)}">` : esc((u.display_name || "U").charAt(0)) }</div> <div> <div style="color:var(--text); font-weight:600;">${esc( u.display_name )}</div> <div class="muted" style="font-size:12px;">@${esc( u.username || "" )}</div> </div> </div> `
        )
        .join("");

      resBox.querySelectorAll(".search-user-item").forEach((el) => {
        el.onclick = () => {
          const uid = el.dataset.uid;
          document.getElementById("search").classList.add("hidden");
          openUserProfileModal(uid);
        };
      });
    };
  }
}
function initApp() {
  try {
    const th = localStorage.getItem("talkia_theme");
    if (th) document.documentElement.dataset.theme = th;
  } catch (e) {}
  $("btn-settings").onclick = openSettings;
  $("btn-search").onclick = () => $("search").classList.remove("hidden");
  $("btn-inbox").onclick = openInboxModal;
  $("btn-bell").onclick = openNotificationsModal;
  $("sr-close").onclick = () => $("search").classList.add("hidden");
  $("pp-close").onclick = () => $("people").classList.add("hidden");
  document.addEventListener(
    "click",
    (e) => {
      const el = e.target.closest && e.target.closest("[data-profile-id]");
      if (el) {
        e.stopPropagation();
        openUserProfileModal(el.dataset.profileId);
      }
    },
    true
  );
  initSearch();
  initProfileUI();
  applyLang();
  setMode("login");
  startAuth();
  if ("serviceWorker" in navigator)
    window.addEventListener("load", () =>
      navigator.serviceWorker.register("service-worker.js").catch(() => {})
    );
}
initApp();
