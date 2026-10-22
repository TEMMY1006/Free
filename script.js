
"use strict";

// TutorLink front-end demonstration.
// Browser storage is not a secure production authentication system.

const USERS_KEY = "tutorlink_users_v1";
const SESSION_KEY = "tutorlink_session_v1";

let authMode = "login";
let currentUser = null;
let currentPage = "dashboard";

const $ = (id) => document.getElementById(id);

function getUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function setMessage(text, type = "error") {
  const box = $("message");
  box.textContent = text;
  box.className = `message ${type}`;
}

function clearMessage() {
  $("message").textContent = "";
  $("message").className = "message hidden";
}

function showOnly(view) {
  ["homeView", "authView", "dashboardView"].forEach(id => {
    $(id).classList.toggle("hidden", id !== view);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showHome() {
  showOnly("homeView");
}

function showAuth(mode = "login", role = "student") {
  authMode = mode;
  clearMessage();
  showOnly("authView");

  const registering = mode === "register";

  $("authTitle").textContent = registering
    ? "Create your account"
    : "Welcome back";

  $("authSubtitle").textContent = registering
    ? "Join TutorLink and start your journey."
    : "Log in with the account you already created.";

  $("nameField").classList.toggle("hidden", !registering);
  $("roleField").classList.toggle("hidden", !registering);

  $("loginTab").classList.toggle("active", !registering);
  $("registerTab").classList.toggle("active", registering);

  $("submitBtn").textContent = registering
    ? "Create My Account"
    : "Log In";

  $("switchText").replaceChildren();

  const text = document.createTextNode(
    registering ? "Already have an account? " : "New to TutorLink? "
  );

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = registering ? "Log in" : "Create an account";
  button.addEventListener("click", () =>
    showAuth(registering ? "login" : "register")
  );

  $("switchText").append(text, button);

  $("role").value = role;
  $("password").value = "";
  $("password").autocomplete = registering
    ? "new-password"
    : "current-password";
}

async function hashPassword(password) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error(
      "Secure browser cryptography is unavailable. Open the site through VS Code Live Server or localhost."
    );
  }

  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

function makeId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

$("authForm").addEventListener("submit", async event => {
  event.preventDefault();
  clearMessage();

  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;
  const name = $("fullName").value.trim();
  const role = $("role").value;

  const button = $("submitBtn");
  button.disabled = true;
  button.textContent = "Please wait...";

  try {
    const users = getUsers();

    if (authMode === "register") {
      if (name.length < 2) {
        throw new Error("Please enter your full name.");
      }

      if (password.length < 8) {
        throw new Error("Your password must contain at least 8 characters.");
      }

      const existingUser = users.find(user => user.email === email);

      if (existingUser) {
        throw new Error(
          "This email already has an account. Please log in instead."
        );
      }

      const passwordHash = await hashPassword(password);

      const newUser = {
        id: makeId(),
        name,
        email,
        passwordHash,
        role,
        subject: "",
        bio: "",
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      saveUsers(users);

      setMessage("Account created! Logging you in...", "success");
      await new Promise(resolve => setTimeout(resolve, 500));

      loginUser(newUser);
    } else {
      const user = users.find(item => item.email === email);

      if (!user) {
        throw new Error(
          "No account was found with this email. Please register first."
        );
      }

      const passwordHash = await hashPassword(password);

      if (user.passwordHash !== passwordHash) {
        throw new Error("Incorrect password. Please try again.");
      }

      loginUser(user);
    }
  } catch (error) {
    setMessage(error.message || "Something went wrong. Please try again.");
  } finally {
    button.disabled = false;
    button.textContent = authMode === "register"
      ? "Create My Account"
      : "Log In";
  }
});

function loginUser(user) {
  currentUser = user;

  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ userId: user.id })
  );

  $("password").value = "";
  renderDashboard();
  showOnly("dashboardView");
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  currentUser = null;
  currentPage = "dashboard";
  showAuth("login");
  setMessage("You have logged out successfully.", "success");
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function initials(name = "User") {
  return name.trim().split(/\s+/).slice(0, 2)
    .map(part => part.charAt(0).toUpperCase()).join("");
}

function renderDashboard() {
  if (!currentUser) return;

  const user = currentUser;
  const isTeacher = user.role === "teacher";

  $("welcomeTitle").textContent = `Welcome back, ${user.name.split(" ")[0]}!`;
  $("sideName").textContent = user.name;
  $("sideRole").textContent = user.role;
  $("sideAvatar").textContent = initials(user.name);
  $("headerUser").textContent = user.email;

  $("browseLink").classList.toggle("hidden", isTeacher);
  $("profileLink").classList.toggle("hidden", !isTeacher);

  if (currentPage === "browse" && !isTeacher) {
    showBrowse();
    return;
  }

  if (currentPage === "profile" && isTeacher) {
    showProfile();
    return;
  }

  currentPage = "dashboard";
  $("dashboardContent").innerHTML = `
    <div class="welcome-banner">
      <h2>${isTeacher ? "Share your knowledge with the world." : "Your next learning adventure starts here."}</h2>
      <p>${isTeacher
        ? "Build your profile so students can discover your teaching skills."
        : "Explore teacher profiles and find help with the subjects you want to learn."}</p>
    </div>

    <div class="dash-grid">
      <article class="dash-card">
        <div class="dash-number">${isTeacher ? "01" : "01"}</div>
        <h3>${isTeacher ? "Complete your profile" : "Discover teachers"}</h3>
        <p>${isTeacher
          ? "Add the subject you teach and a short introduction."
          : "Search the teacher directory by name or subject."}</p>
        <button class="btn btn-primary" onclick="${isTeacher ? "showProfile()" : "showBrowse()"}">
          ${isTeacher ? "Edit My Profile" : "Find a Teacher"}
        </button>
      </article>

      <article class="dash-card">
        <div class="dash-number">✓</div>
        <h3>Account status</h3>
        <p>Your ${escapeHTML(user.role)} account is active in this demo.</p>
        <p><strong>Email:</strong> ${escapeHTML(user.email)}</p>
      </article>
    </div>

    <div class="dash-card" style="margin-top:18px">
      <h3>Your TutorLink account</h3>
      <p>You only need to register once. Next time, log in with this same email and password.</p>
      <button class="btn btn-outline" onclick="logout()">Log Out</button>
    </div>
  `;
}

function showDashboard() {
  currentPage = "dashboard";
  renderDashboard();
}

function showBrowse() {
  if (!currentUser || currentUser.role !== "student") return;

  currentPage = "browse";

  const teachers = getUsers().filter(user =>
    user.role === "teacher" && user.subject.trim()
  );

  $("dashboardContent").innerHTML = `
    <h2 class="dash-title">Find your teacher</h2>
    <p style="color:#667085;font-size:14px;margin-top:-8px">
      Search teacher names, subjects, or profile descriptions.
    </p>

    <div class="search-bar">
      <input class="search-input" id="teacherSearch"
        placeholder="Try Mathematics, English, or a teacher's name...">
      <button class="btn btn-primary" id="searchBtn">Search</button>
    </div>

    <div id="teacherResults" class="teacher-list"></div>
  `;

  $("searchBtn").addEventListener("click", searchTeachers);
  $("teacherSearch").addEventListener("input", searchTeachers);

  renderTeacherResults(teachers);
}

function searchTeachers() {
  const term = $("teacherSearch").value.trim().toLowerCase();

  const teachers = getUsers().filter(user => {
    if (user.role !== "teacher" || !user.subject.trim()) return false;

    const searchable = [
      user.name, user.subject, user.bio
    ].join(" ").toLowerCase();

    return searchable.includes(term);
  });

  renderTeacherResults(teachers);
}

function renderTeacherResults(teachers) {
  const results = $("teacherResults");
  if (!results) return;

  if (!teachers.length) {
    results.innerHTML = `
      <div class="empty-state">
        <h3>No teachers found yet</h3>
        <p>Try another search or check back after teachers create their profiles.</p>
      </div>`;
    return;
  }

  results.innerHTML = teachers.map(teacher => `
    <article class="teacher-card">
      <div class="teacher-top">
        <div class="avatar">${escapeHTML(initials(teacher.name))}</div>
        <div>
          <h3>${escapeHTML(teacher.name)}</h3>
          <div class="muted">TutorLink Teacher</div>
        </div>
      </div>
      <div style="margin-top:14px">
        <span class="tag">${escapeHTML(teacher.subject)}</span>
      </div>
      <p class="muted">${escapeHTML(teacher.bio || "This teacher has not added an introduction yet.")}</p>
      <button class="btn btn-outline" onclick="contactTeacher('${escapeHTML(teacher.id)}')">
        View Contact Options
      </button>
    </article>
  `).join("");
}

function contactTeacher(teacherId) {
  const teacher = getUsers().find(user => user.id === teacherId);

  if (!teacher) {
    alert("This teacher profile could not be found.");
    return;
  }

  alert(
    `Teacher: ${teacher.name}\nSubject: ${teacher.subject}\n\n` +
    "TutorLink messaging is not connected in this demo. " +
    "A real messaging feature requires a backend."
  );
}

function showProfile() {
  if (!currentUser || currentUser.role !== "teacher") return;

  currentPage = "profile";

  $("dashboardContent").innerHTML = `
    <h2 class="dash-title">My teacher profile</h2>
    <p style="color:#667085;font-size:14px">
      Tell students about your teaching subject and experience.
    </p>

    <form id="profileForm" class="profile-form">
      <div class="field">
        <label for="teacherName">Full name</label>
        <input id="teacherName" value="${escapeHTML(currentUser.name)}"
          required minlength="2">
      </div>

      <div class="field">
        <label for="teacherSubject">Subject you teach</label>
        <input id="teacherSubject" value="${escapeHTML(currentUser.subject)}"
          placeholder="e.g. Mathematics, English, Biology" required>
      </div>

      <div class="field">
        <label for="teacherBio">About your teaching</label>
        <textarea id="teacherBio" rows="5" maxlength="700"
          placeholder="Describe your teaching approach and experience...">${escapeHTML(currentUser.bio)}</textarea>
      </div>

      <button class="btn btn-primary btn-large" type="submit">Save Profile</button>
      <div id="profileMessage" class="message hidden" role="status"></div>
    </form>
  `;

  $("profileForm").addEventListener("submit", event => {
    event.preventDefault();

    const users = getUsers();
    const index = users.findIndex(user => user.id === currentUser.id);

    if (index < 0) {
      alert("Your account could not be found.");
      return;
    }

    users[index].name = $("teacherName").value.trim();
    users[index].subject = $("teacherSubject").value.trim();
    users[index].bio = $("teacherBio").value.trim();

    if (!users[index].name || !users[index].subject) {
      return;
    }

    saveUsers(users);
    currentUser = users[index];

    $("profileMessage").textContent =
      "Your profile has been saved. Students can now find you by subject.";
    $("profileMessage").className = "message success";

    $("sideName").textContent = currentUser.name;
    $("sideAvatar").textContent = initials(currentUser.name);
  });
}

// Restore a logged-in session when the page is reopened in the same tab.
function restoreSession() {
  const session = getSession();
  if (!session) return;

  const user = getUsers().find(item => item.id === session.userId);

  if (user) {
    currentUser = user;
    renderDashboard();
    showOnly("dashboardView");
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

$("year").textContent = new Date().getFullYear();
restoreSession();
