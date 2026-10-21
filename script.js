
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const USERS_KEY = "tutorlink_users";
const SESSION_KEY = "tutorlink_session";

let selectedRole = "student";
let authMode = "signup";
let selectedSubject = "";

const sampleTutors = [
  {
    id: "demo1",
    name: "Amara Okafor",
    level: "Exam Preparation",
    subjects: ["Mathematics", "Physics"],
    bio: "Helping students understand difficult STEM topics and prepare confidently."
  },
  {
    id: "demo2",
    name: "Michael Adeyemi",
    level: "Secondary School",
    subjects: ["English", "Literature"],
    bio: "Improve your grammar, writing, reading and communication skills."
  },
  {
    id: "demo3",
    name: "Zainab Ibrahim",
    level: "Intermediate",
    subjects: ["Chemistry", "Biology"],
    bio: "Making science easier through clear explanations and practical examples."
  },
  {
    id: "demo4",
    name: "Daniel Mensah",
    level: "Beginner",
    subjects: ["Coding", "JavaScript", "HTML & CSS"],
    bio: "Learn web development step by step with a friendly coding mentor."
  },
  {
    id: "demo5",
    name: "Chidera Nwosu",
    level: "Advanced",
    subjects: ["Mathematics", "Further Mathematics"],
    bio: "Build problem-solving skills and master advanced mathematics."
  },
  {
    id: "demo6",
    name: "Fatima Bello",
    level: "Secondary School",
    subjects: ["Biology", "English"],
    bio: "Supportive lessons designed to improve understanding and confidence."
  }
];

// Read demo accounts saved in this browser.
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getInitials(name) {
  return name.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();
}

// Prevent user-provided text from being interpreted as HTML.
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// Combine registered teachers with demonstration profiles.
function getTutors() {
  const registeredTeachers = getUsers()
    .filter(user => user.role === "teacher")
    .map(user => ({
      ...user,
      initials: getInitials(user.name)
    }));

  return [...registeredTeachers, ...sampleTutors];
}

// Display tutor cards and apply search filters.
function renderTutors() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const level = $("#levelFilter").value;

  const tutors = getTutors().filter(tutor => {
    const subjects = tutor.subjects || [];

    const searchableText = [
      tutor.name,
      tutor.bio,
      ...subjects
    ].join(" ").toLowerCase();

    const matchesSearch =
      !query || searchableText.includes(query);

    const matchesSubject =
      !selectedSubject ||
      subjects.some(subject =>
        subject.toLowerCase().includes(
          selectedSubject.toLowerCase()
        )
      );

    const matchesLevel =
      !level || tutor.level === level;

    return matchesSearch && matchesSubject && matchesLevel;
  });

  $("#tutorGrid").innerHTML = tutors.map(tutor => `
    <article class="tutor-card">
      <div class="tutor-top">
        <div class="tutor-avatar">
          ${escapeHTML(tutor.initials || getInitials(tutor.name))}
        </div>

        <div>
          <div class="tutor-name">${escapeHTML(tutor.name)}</div>
          <div class="tutor-level">${escapeHTML(tutor.level || "Tutor")}</div>
        </div>

        <span class="tutor-badge">✦ Tutor</span>
      </div>

      <p class="tutor-bio">
        ${escapeHTML(tutor.bio || "Ready to help you learn.")}
      </p>

      <div class="subject-tags">
        ${(tutor.subjects || []).map(subject => `
          <span class="subject-tag">${escapeHTML(subject)}</span>
        `).join("")}
      </div>

      <div class="tutor-footer">
        <small>Discuss your lessons</small>
        <button
          class="contact-tutor"
          data-id="${escapeHTML(tutor.id)}"
          data-email="${escapeHTML(tutor.email || "")}"
          data-name="${escapeHTML(tutor.name)}">
          Contact Tutor ↗
        </button>
      </div>
    </article>
  `).join("");

  $("#emptyState").classList.toggle("hidden", tutors.length > 0);
  $("#tutorGrid").classList.toggle("hidden", tutors.length === 0);
}

// Toast notification.
let toastTimer;

function showToast(message) {
  const toast = $("#toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

// Open the signup/login window.
function openModal(mode = "signup", role = "student") {
  authMode = mode;
  selectedRole = role;

  $("#authModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";

  $("#formMessage").textContent = "";
  $("#authForm").reset();

  updateModal();
}

function closeModal() {
  $("#authModal").classList.add("hidden");
  document.body.style.overflow = "";
}

// Update the form depending on signup or login.
function updateModal() {
  const signingUp = authMode === "signup";

  $("#modalTitle").textContent = signingUp
    ? "Create your account"
    : "Welcome back";

  $("#modalDescription").textContent = signingUp
    ? "Choose how you want to use TutorLink."
    : "Enter your account details to continue.";

  $("#roleOptions").classList.toggle("hidden", !signingUp);

  $("#nameField").classList.toggle("hidden", !signingUp);

  $("#fullName").required = signingUp;

  $("#teacherFields").classList.toggle(
    "hidden",
    !signingUp || selectedRole !== "teacher"
  );

  $("#subjectsInput").required =
    signingUp && selectedRole === "teacher";

  $$(".role-option").forEach(button => {
    button.classList.toggle(
      "selected",
      button.dataset.role === selectedRole
    );
  });

  $("#submitBtn").textContent = signingUp
    ? "Create Account →"
    : "Log In →";

  $("#switchAuth").innerHTML = signingUp
    ? 'Already have an account? <button type="button" id="switchToLogin">Log in</button>'
    : 'New to TutorLink? <button type="button" id="switchToSignup">Create an account</button>';

  $("#switchToLogin")?.addEventListener("click", () => {
    authMode = "login";
    updateModal();
  });

  $("#switchToSignup")?.addEventListener("click", () => {
    authMode = "signup";
    selectedRole = "student";
    updateModal();
  });
}

// Navigation and modal buttons.
$("#signupBtn").addEventListener("click", () => {
  openModal("signup", "student");
});

$("#loginBtn").addEventListener("click", () => {
  openModal("login");
});

$("#heroTeacherBtn").addEventListener("click", () => {
  openModal("signup", "teacher");
});

$("#teacherSignupBtn").addEventListener("click", () => {
  openModal("signup", "teacher");
});

$("#closeModal").addEventListener("click", closeModal);

$("#authModal").addEventListener("click", event => {
  if (event.target === $("#authModal")) {
    closeModal();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeModal();
});

// Choose student or teacher.
$$(".role-option").forEach(button => {
  button.addEventListener("click", () => {
    selectedRole = button.dataset.role;
    updateModal();
  });
});

// Handle registration and login.
$("#authForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("#fullName").value.trim();
  const email = $("#emailInput").value.trim().toLowerCase();
  const password = $("#passwordInput").value;
  const message = $("#formMessage");

  message.textContent = "";
  message.classList.remove("success");

  if (!email || password.length < 6) {
    message.textContent =
      "Enter a valid email and a password with at least 6 characters.";
    return;
  }

  const users = getUsers();

  if (authMode === "signup") {
    if (!name) {
      message.textContent = "Please enter your full name.";
      return;
    }

    if (users.some(user => user.email === email)) {
      message.textContent =
        "This email already has an account. Please log in.";
      return;
    }

    let subjects = [];

    if (selectedRole === "teacher") {
      subjects = $("#subjectsInput").value
        .split(",")
        .map(subject => subject.trim())
        .filter(Boolean);

      if (subjects.length === 0) {
        message.textContent =
          "Please enter at least one subject you teach.";
        return;
      }
    }

    const user = {
      id: "user-" + Date.now(),
      name,
      email,
      password,
      role: selectedRole,
      subjects,
      level: selectedRole === "teacher"
        ? $("#teacherLevel").value
        : "Student",
      bio: selectedRole === "teacher"
        ? $("#bioInput").value.trim()
        : "",
      createdAt: new Date().toISOString()
    };

    users.push(user);
    saveUsers(users);

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      })
    );

    closeModal();
    renderTutors();

    showToast(
      selectedRole === "teacher"
        ? "Tutor profile created! Search for your subjects."
        : "Welcome to TutorLink! Your account is ready."
    );

  } else {
    const user = users.find(item =>
      item.email === email &&
      item.password === password
    );

    if (!user) {
      message.textContent =
        "Account not found or password is incorrect. Try again.";
      return;
    }

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      })
    );

    closeModal();
    showToast("Welcome back, " + user.name + "!");
  }
});

// Search button and live search.
$("#searchBtn").addEventListener("click", renderTutors);

$("#searchInput").addEventListener("input", renderTutors);

$("#levelFilter").addEventListener("change", renderTutors);

$("#searchInput").addEventListener("keydown", event => {
  if (event.key === "Enter") renderTutors();
});

// Popular subject filters.
$$(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    selectedSubject = chip.dataset.subject;

    $$(".chip").forEach(item => {
      item.classList.toggle("active", item === chip);
    });

    $("#searchInput").value = "";

    renderTutors();
  });
});

// Clear search filters.
$("#clearSearch").addEventListener("click", () => {
  $("#searchInput").value = "";
  $("#levelFilter").value = "";
  selectedSubject = "";

  $$(".chip").forEach(chip => {
    chip.classList.toggle("active", chip.dataset.subject === "");
  });

  renderTutors();
});

// Contact a tutor through their email application.
$("#tutorGrid").addEventListener("click", event => {
  const button = event.target.closest(".contact-tutor");

  if (!button) return;

  const email = button.dataset.email;
  const name = button.dataset.name;

  if (!email) {
    showToast(
      "This is a sample profile. Registered tutors can publish their email."
    );
    return;
  }

  const subject = encodeURIComponent(
    "Tutoring enquiry through TutorLink"
  );

  const body = encodeURIComponent(
    `Hello ${name}, I found your profile on TutorLink and would like to discuss lessons.`
  );

  window.location.href =
    `mailto:${email}?subject=${subject}&body=${body}`;
});

// Mobile navigation.
$("#menuToggle").addEventListener("click", () => {
  const nav = $("#navigation");
  nav.classList.toggle("open");
});

$$(".navbar nav a").forEach(link => {
  link.addEventListener("click", () => {
    $("#navigation").classList.remove("open");
  });
});

// Footer year.
$("#year").textContent = new Date().getFullYear();

// Load the tutor cards when the website opens.
renderTutors();
