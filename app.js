// إعدادات الربط مع مشروع Firebase: second-year-networks
// انسخ قيم apiKey و messagingSenderId و appId من Project settings -> Your apps
const firebaseConfig = {
  apiKey: "AIzaSy8kZCo86Mv6kItemXClu4tqZ5pT9enJDmk",
  authDomain: "second-year-networks.firebaseapp.com",
  projectId: "second-year-networks",
  storageBucket: "second-year-networks.firebasestorage.app",
  messagingSenderId: "PUT_YOUR_SENDER_ID_HERE",
  appId: "PUT_YOUR_APP_ID_HERE"
};

let db = null;
const isFirebaseReady =
  !firebaseConfig.messagingSenderId.startsWith("PUT_YOUR_") &&
  !firebaseConfig.appId.startsWith("PUT_YOUR_");

if (isFirebaseReady && typeof firebase !== "undefined") {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
}

const SUBJECTS = [
  "أنظمة توليد القوى الكهربية",
  "إلكترونيات قوى كهربية",
  "شبكات قوى كهربية",
  "تحكم آلي",
  "معالجات ومتحكمات",
  "ضبط جودة",
  "تكنولوجيا وورش شبكات وأجهزة كهربائية"
];

// قائمة أسماء طلاب الفرقة الثانية شعبة شبكات كهربائية (بدون رقم تسلسلي)
const INITIAL_STUDENTS = [
  "محمد سامح محمد عبد الحليم غنيم",
  "أحمد محمود إبراهيم علي",
  "إبراهيم السيد محمد حسن",
  "محمود رضا عبد الفتاح سالم",
  "يوسف طارق محمد عبد الله",
  "كريم حسام الدين محمود",
  "مصطفى عادل محمد سليمان",
  "عبد الرحمن خالد أحمد منصور",
  "زياد وليد محمد السيد",
  "عمر أشرف محمود عبد الغني"
];

const STORAGE_KEYS = {
  cvs: "quesna_cvs_v1",
  tickets: "quesna_tickets_v1",
  materials: "quesna_materials_v1",
  students: "quesna_students_v1"
};

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

if (!localStorage.getItem(STORAGE_KEYS.students)) {
  writeLocal(STORAGE_KEYS.students, INITIAL_STUDENTS);
}

// التنقل بين الأقسام
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.target).classList.add("active");
  });
});

// تعبئة قائمة المواد في لوحة الأدمن
const matSubjectSelect = document.getElementById("matSubject");
SUBJECTS.forEach((subj) => {
  const opt = document.createElement("option");
  opt.value = subj;
  opt.textContent = subj;
  matSubjectSelect.appendChild(opt);
});

// عرض المواد السبع
function renderSubjects() {
  const materials = readLocal(STORAGE_KEYS.materials, []);
  const container = document.getElementById("subjectsList");
  container.innerHTML = "";

  SUBJECTS.forEach((subj) => {
    const lecItems = materials.filter((m) => m.subject === subj && m.category === "lectures");
    const examItems = materials.filter((m) => m.subject === subj && m.category === "exams");

    const box = document.createElement("div");
    box.className = "subject-card";
    box.innerHTML = `
      <h4>${subj}</h4>
      <div class="subject-links">
        <div>
          <strong style="font-size:12px; color:#cbd5e1;">محاضرات PDF:</strong>
          ${
            lecItems.length
              ? lecItems.map((i) => `<a href="${i.url}" target="_blank" rel="noopener">${i.title}</a>`).join(" ")
              : `<span style="font-size:12px; color:#94a3b8;">لا توجد ملفات مضافة بعد</span>`
          }
        </div>
        <div>
          <strong style="font-size:12px; color:#cbd5e1;">امتحانات PDF:</strong>
          ${
            examItems.length
              ? examItems.map((i) => `<a href="${i.url}" target="_blank" rel="noopener">${i.title}</a>`).join(" ")
              : `<span style="font-size:12px; color:#94a3b8;">لا توجد ملفات مضافة بعد</span>`
          }
        </div>
      </div>
    `;
    container.appendChild(box);
  });
}

// عرض قائمة الطلاب بدون رقم تسلسلي
function renderStudents(filterText = "") {
  const list = readLocal(STORAGE_KEYS.students, INITIAL_STUDENTS);
  const q = filterText.trim().toLowerCase();
  const filtered = q ? list.filter((name) => name.toLowerCase().includes(q)) : list;

  document.getElementById("studentsCount").textContent =
    `الأسماء المعروضة حالياً: ${filtered.length} (القائمة المستهدفة الكاملة: 286 طالباً)`;

  const tbody = document.getElementById("studentsTableBody");
  tbody.innerHTML = filtered
    .map(
      (name) => `
      <tr>
        <td>${name}</td>
        <td>الفرقة الثانية - شعبة شبكات كهربائية</td>
      </tr>
    `
    )
    .join("");
}

document.getElementById("studentSearch").addEventListener("input", (e) => {
  renderStudents(e.target.value);
});

// إرسال السيرة الذاتية
document.getElementById("cvForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const record = {
    id: "cv_" + Date.now(),
    name: document.getElementById("studentName").value.trim(),
    phone: document.getElementById("studentPhone").value.trim(),
    email: document.getElementById("studentEmail").value.trim(),
    birth: document.getElementById("studentBirth").value,
    bio: document.getElementById("studentBio").value.trim(),
    status: "قيد المراجعة",
    createdAt: new Date().toISOString()
  };

  const cvs = readLocal(STORAGE_KEYS.cvs, []);
  cvs.unshift(record);
  writeLocal(STORAGE_KEYS.cvs, cvs);

  if (db) {
    try {
      await db.collection("students_cv").doc(record.id).set(record);
    } catch (err) {
      console.error(err);
    }
  }

  e.target.reset();
  document.getElementById("cvStatus").textContent =
    "تم إرسال السيرة الذاتية بنجاح وهي الآن بانتظار موافقة الأدمن.";
  renderAdminCVs();
});

// إرسال رسالة دعم فني
document.getElementById("supportForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const ticket = {
    id: "tkt_" + Date.now(),
    name: document.getElementById("ticketName").value.trim(),
    type: document.getElementById("ticketType").value,
    message: document.getElementById("ticketMessage").value.trim(),
    reply: "",
    createdAt: new Date().toLocaleString("ar-EG")
  };

  const tickets = readLocal(STORAGE_KEYS.tickets, []);
  tickets.unshift(ticket);
  writeLocal(STORAGE_KEYS.tickets, tickets);

  if (db) {
    try {
      await db.collection("support_tickets").doc(ticket.id).set(ticket);
    } catch (err) {
      console.error(err);
    }
  }

  e.target.reset();
  document.getElementById("supportStatus").textContent =
    "تم إرسال رسالتك إلى صندوق وارد الأدمن.";
  renderTickets();
  renderAdminTickets();
});

function renderTickets() {
  const tickets = readLocal(STORAGE_KEYS.tickets, []);
  const box = document.getElementById("ticketsFeed");
  if (!tickets.length) {
    box.innerHTML = `<p style="color:#94a3b8; font-size:13px;">لا توجد رسائل دعم فني حتى الآن.</p>`;
    return;
  }
  box.innerHTML = tickets
    .map(
      (t) => `
      <div class="item-box">
        <span class="pill">${t.type}</span>
        <div style="font-size:14px; font-weight:700;">${t.name} <span style="color:#94a3b8; font-weight:400; font-size:12px;">(${t.createdAt})</span></div>
        <p style="margin-top:6px; font-size:13px;">${t.message}</p>
        ${
          t.reply
            ? `<p style="margin-top:8px; padding:8px; background:rgba(16,185,129,0.12); border-radius:8px; color:#6ee7b7; font-size:13px;"><strong>رد الأدمن:</strong> ${t.reply}</p>`
            : `<p style="margin-top:6px; color:#94a3b8; font-size:12px;">بانتظار رد الأدمن...</p>`
        }
      </div>
    `
    )
    .join("");
}

// دخول الأدمن
document.getElementById("adminLoginBtn").addEventListener("click", () => {
  const pass = document.getElementById("adminPassInput").value;
  if (pass === "admin123") {
    document.getElementById("adminPanel").style.display = "block";
    document.getElementById("adminAuthMsg").textContent = "تم فتح لوحة تحكم الأدمن.";
    renderAdminCVs();
    renderAdminTickets();
  } else {
    document.getElementById("adminAuthMsg").textContent = "كلمة المرور غير صحيحة.";
  }
});

// إضافة رابط مادة PDF
document.getElementById("addMaterialForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const item = {
    id: "mat_" + Date.now(),
    subject: document.getElementById("matSubject").value,
    category: document.getElementById("matCategory").value,
    title: document.getElementById("matTitle").value.trim(),
    url: document.getElementById("matUrl").value.trim()
  };

  const materials = readLocal(STORAGE_KEYS.materials, []);
  materials.unshift(item);
  writeLocal(STORAGE_KEYS.materials, materials);

  if (db) {
    try {
      await db.collection("materials").doc(item.id).set(item);
    } catch (err) {
      console.error(err);
    }
  }

  e.target.reset();
  document.getElementById("matStatus").textContent = "تمت إضافة رابط الملف بنجاح.";
  renderSubjects();
});

function renderAdminCVs() {
  const cvs = readLocal(STORAGE_KEYS.cvs, []);
  const box = document.getElementById("adminCvList");
  if (!cvs.length) {
    box.innerHTML = `<p style="color:#94a3b8; font-size:13px;">لا توجد سير ذاتية مرسلة حالياً.</p>`;
    return;
  }
  box.innerHTML = cvs
    .map(
      (c) => `
      <div class="item-box">
        <span class="pill">الحالة: ${c.status}</span>
        <div style="font-weight:700;">${c.name}</div>
        <div style="font-size:12px; color:#94a3b8;">واتساب: ${c.phone} | بريد: ${c.email} | تاريخ الميلاد: ${c.birth}</div>
        ${c.bio ? `<p style="margin-top:6px; font-size:13px;">${c.bio}</p>` : ""}
        <div style="margin-top:10px; display:flex; gap:8px;">
          <button class="btn success" onclick="updateCvStatus('${c.id}', 'مقبول')">قبول</button>
          <button class="btn danger" onclick="updateCvStatus('${c.id}', 'محظور')">حظر</button>
        </div>
      </div>
    `
    )
    .join("");
}

window.updateCvStatus = async function (id, newStatus) {
  const cvs = readLocal(STORAGE_KEYS.cvs, []);
  const updated = cvs.map((c) => (c.id === id ? { ...c, status: newStatus } : c));
  writeLocal(STORAGE_KEYS.cvs, updated);
  if (db) {
    try {
      await db.collection("students_cv").doc(id).update({ status: newStatus });
    } catch (err) {
      console.error(err);
    }
  }
  renderAdminCVs();
};

function renderAdminTickets() {
  const tickets = readLocal(STORAGE_KEYS.tickets, []);
  const box = document.getElementById("adminTicketsList");
  if (!tickets.length) {
    box.innerHTML = `<p style="color:#94a3b8; font-size:13px;">صندوق وارد الدعم الفني فارغ.</p>`;
    return;
  }
  box.innerHTML = tickets
    .map(
      (t) => `
      <div class="item-box">
        <span class="pill">${t.type}</span>
        <div style="font-weight:700;">${t.name}</div>
        <p style="margin:6px 0; font-size:13px;">${t.message}</p>
        <input type="text" id="reply_${t.id}" value="${t.reply || ""}" placeholder="اكتب الرد هنا..." style="margin-bottom:8px;" />
        <button class="btn" onclick="saveTicketReply('${t.id}')">حفظ الرد</button>
      </div>
    `
    )
    .join("");
}

window.saveTicketReply = async function (id) {
  const inputEl = document.getElementById("reply_" + id);
  if (!inputEl) return;
  const replyText = inputEl.value.trim();

  const tickets = readLocal(STORAGE_KEYS.tickets, []);
  const updated = tickets.map((t) => (t.id === id ? { ...t, reply: replyText } : t));
  writeLocal(STORAGE_KEYS.tickets, updated);

  if (db) {
    try {
      await db.collection("support_tickets").doc(id).update({ reply: replyText });
    } catch (err) {
      console.error(err);
    }
  }
  renderTickets();
  renderAdminTickets();
};

renderSubjects();
renderStudents();
renderTickets();
