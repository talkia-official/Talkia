// Login / sign-up / session. Session listeners are started from app.js
let mode = "login",
  currentUser = null,
  currentProfile = null;
let currentTab = "home";

function setMode(m) {
  mode = m;
  $("mode-login").classList.toggle("on", m === "login");
  $("mode-signup").classList.toggle("on", m === "signup");
  $("name-field").classList.toggle("hidden", m !== "signup");
  $("auth-submit").textContent = t(m === "login" ? "login" : "signup");
  $("password").autocomplete =
    m === "login" ? "current-password" : "new-password";
  $("auth-msg").textContent = "";
  renderLangButtons();
}
$("mode-login").onclick = () => setMode("login");
$("mode-signup").onclick = () => setMode("signup");

$("auth-form").onsubmit = async (e) => {
  e.preventDefault();
  const email = $("email").value.trim(),
    password = $("password").value,
    msg = $("auth-msg");
  msg.className = "msg";
  msg.textContent = "";
  $("auth-submit").disabled = true;
  try {
    if (mode === "signup") {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { name: $("name").value.trim() || t("user") } },
      });
      if (error) throw error;
      if (!data.session) {
        msg.className = "msg ok";
        msg.textContent = t("check_email");
      }
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
  } catch (err) {
    msg.textContent = err.message || String(err);
  } finally {
    $("auth-submit").disabled = false;
  }
};

async function onSession(session) {
  currentUser = session ? session.user : null;
  if (!currentUser) {
    currentProfile = null;
    $("app").classList.add("hidden");
    $("auth").classList.remove("hidden");
    setMode(mode);
    return;
  }
  $("auth").classList.add("hidden");
  $("app").classList.remove("hidden");
  await loadProfile();
  showTab("home");
}

function startAuth() {
  sb.auth.onAuthStateChange((_e, session) => {
    setTimeout(() => onSession(session), 0);
  });
  sb.auth
    .getSession()
    .then(({ data }) => onSession(data ? data.session : null));
}
function logout() {
  sb.auth.signOut().then(() => location.reload());
}
