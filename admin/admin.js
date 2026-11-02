(() => {
  "use strict";

  const SESSION_KEY = "chembio-lab9-admin-session";
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "admin";
  const loginScreen = document.getElementById("admin-login");
  const workspace = document.getElementById("admin-workspace");
  const loginForm = document.getElementById("admin-login-form");
  const loginError = document.getElementById("login-error");
  const logoutButton = document.getElementById("admin-logout");
  const usernameInput = loginForm.elements.namedItem("username");

  function showWorkspace(isAuthenticated) {
    loginScreen.hidden = isAuthenticated;
    workspace.hidden = !isAuthenticated;
  }

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(loginForm);
    if (form.get("username") !== ADMIN_USERNAME || form.get("password") !== ADMIN_PASSWORD) {
      loginError.textContent = "Неверный логин или пароль.";
      loginError.hidden = false;
      loginForm.elements.namedItem("password").value = "";
      loginForm.elements.namedItem("password").focus();
      return;
    }

    try {
      sessionStorage.setItem(SESSION_KEY, "authenticated");
      window.location.reload();
    } catch (error) {
      loginError.textContent = `Не удалось сохранить состояние входа: ${error.message}`;
      loginError.hidden = false;
    }
  });

  logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  });

  const isAuthenticated = sessionStorage.getItem(SESSION_KEY) === "authenticated";
  showWorkspace(isAuthenticated);
  if (!isAuthenticated) {
    usernameInput.focus();
    return;
  }

  const CONTENT_KEY = "chembio-lab9-admin-content-v1";
  const base = window.CHEMBIO_DATA;
  const initial = loadContent();
  const content = {
    version: 1,
    topics: initial.topics,
    glossary: initial.glossary,
    questions: initial.questions
  };
  let toastTimer = 0;

  function emptyContent() {
    return { version: 1, topics: [], glossary: [], questions: [] };
  }

  function loadContent() {
    try {
      const saved = localStorage.getItem(CONTENT_KEY);
      if (!saved) return emptyContent();
      const data = JSON.parse(saved);
      if (!data || data.version !== 1 || !Array.isArray(data.topics) ||
          !Array.isArray(data.glossary) || !Array.isArray(data.questions)) {
        throw new Error("Сохранённые материалы повреждены или используют неподдерживаемый формат.");
      }
      return normalizeContent(data);
    } catch (error) {
      window.setTimeout(() => notify(`Не удалось загрузить сохранённые материалы: ${error.message}`), 0);
      return emptyContent();
    }
  }

  function normalizeContent(value) {
    const topicIds = new Set(base.topics.map((topic) => topic.id));
    const questionIds = new Set(base.questions.map((question) => question.id));
    const normalized = emptyContent();
    (value.topics || []).forEach((item) => {
      if (!isTopic(item) || topicIds.has(item.id)) return;
      topicIds.add(item.id);
      normalized.topics.push(item);
    });
    (value.glossary || []).forEach((item) => {
      if (isGlossary(item)) normalized.glossary.push(item);
    });
    (value.questions || []).forEach((item) => {
      if (!isQuestion(item) || questionIds.has(item.id) || !topicIds.has(item.topic)) return;
      questionIds.add(item.id);
      normalized.questions.push(item);
    });
    return normalized;
  }

  function isTopic(item) {
    return item && typeof item.id === "string" && ["chem", "bio"].includes(item.subject) &&
      typeof item.title === "string" && typeof item.summary === "string" &&
      typeof item.description === "string" && Array.isArray(item.sections) &&
      Array.isArray(item.definitions);
  }

  function isGlossary(item) {
    return item && typeof item.id === "string" && typeof item.term === "string" &&
      typeof item.meaning === "string" && ["chem", "bio"].includes(item.subject);
  }

  function isQuestion(item) {
    return item && typeof item.id === "string" && ["chem", "bio"].includes(item.subject) &&
      ["easy", "medium", "hard"].includes(item.difficulty) &&
      typeof item.topic === "string" && typeof item.question === "string" &&
      Array.isArray(item.options) && item.options.length === 4 &&
      Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.options.length &&
      typeof item.explanation === "string";
  }

  function saveContent() {
    try {
      localStorage.setItem(CONTENT_KEY, JSON.stringify(content));
      renderAll();
      notify("Изменения сохранены в этом браузере.");
      return true;
    } catch (error) {
      notify(`Не удалось сохранить материалы: ${error.message}`);
      return false;
    }
  }

  function notify(message) {
    const toast = document.getElementById("admin-toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 4200);
  }

  function createId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function subjectLabel(subject) {
    return subject === "chem" ? "Химия" : "Биология";
  }

  function fillTableRows(tbody, items, renderRow, empty) {
    tbody.replaceChildren();
    empty.hidden = items.length > 0;
    items.forEach((item) => tbody.append(renderRow(item)));
  }

  function makeCell(text, className = "") {
    const cell = document.createElement("td");
    cell.textContent = text;
    if (className) cell.className = className;
    return cell;
  }

  function makeActions(id, type) {
    const cell = document.createElement("td");
    cell.className = "actions-cell";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "secondary";
    edit.textContent = "Изменить";
    edit.addEventListener("click", () => editEntry(type, id));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "danger-button";
    remove.textContent = "Удалить";
    remove.addEventListener("click", () => removeEntry(type, id));
    cell.append(edit, remove);
    return cell;
  }

  function formFor(type) {
    const formType = { topics: "topic", questions: "question" }[type] || type;
    return document.getElementById(`${formType}-form`);
  }

  function renderAll() {
    fillTableRows(
      document.getElementById("glossary-rows"),
      content.glossary,
      (item) => {
        const row = document.createElement("tr");
        row.append(makeCell(item.term), makeCell(subjectLabel(item.subject)), makeCell(item.meaning, "description-cell"), makeActions(item.id, "glossary"));
        return row;
      },
      document.getElementById("glossary-empty")
    );
    fillTableRows(
      document.getElementById("topic-rows"),
      content.topics,
      (item) => {
        const row = document.createElement("tr");
        row.append(makeCell(item.title), makeCell(subjectLabel(item.subject)), makeCell(item.summary, "description-cell"), makeActions(item.id, "topics"));
        return row;
      },
      document.getElementById("topic-empty")
    );
    fillTableRows(
      document.getElementById("question-rows"),
      content.questions,
      (item) => {
        const row = document.createElement("tr");
        const topic = [...base.topics, ...content.topics].find((entry) => entry.id === item.topic);
        const difficulty = { easy: "Базовая", medium: "Средняя", hard: "Повышенная" }[item.difficulty];
        row.append(makeCell(item.question), makeCell(topic ? topic.title : "Тема удалена"), makeCell(difficulty), makeActions(item.id, "questions"));
        return row;
      },
      document.getElementById("question-empty")
    );
  }

  function showForm(type) {
    const form = formFor(type);
    form.hidden = false;
    form.elements.namedItem("id").value = "";
    form.reset();
    if (type === "questions") refreshQuestionTopics();
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    form.querySelector("input:not([type=hidden]), textarea, select")?.focus();
  }

  function hideForm(type) {
    const form = formFor(type);
    form.reset();
    form.elements.namedItem("id").value = "";
    form.hidden = true;
  }

  function editEntry(type, id) {
    const form = formFor(type);
    const collection = content[type];
    const item = collection.find((entry) => entry.id === id);
    if (!item) {
      notify("Эта запись уже удалена.");
      renderAll();
      return;
    }
    form.hidden = false;
    form.reset();
    form.elements.namedItem("id").value = item.id;
    if (type === "glossary") {
      form.elements.namedItem("term").value = item.term;
      form.elements.namedItem("subject").value = item.subject;
      form.elements.namedItem("meaning").value = item.meaning;
    } else if (type === "topics") {
      form.elements.namedItem("subject").value = item.subject;
      form.elements.namedItem("title").value = item.title;
      form.elements.namedItem("summary").value = item.summary;
      form.elements.namedItem("description").value = item.description;
    } else {
      form.elements.namedItem("subject").value = item.subject;
      refreshQuestionTopics();
      form.elements.namedItem("topic").value = item.topic;
      form.elements.namedItem("difficulty").value = item.difficulty;
      form.elements.namedItem("question").value = item.question;
      item.options.forEach((option, index) => {
        form.elements.namedItem(`option${index}`).value = option;
      });
      form.elements.namedItem("answer").value = String(item.answer);
      form.elements.namedItem("explanation").value = item.explanation;
    }
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function removeEntry(type, id) {
    const entry = content[type].find((item) => item.id === id);
    if (!entry || !window.confirm(`Удалить «${entry.term || entry.title || entry.question}»?`)) return;
    content[type] = content[type].filter((item) => item.id !== id);
    if (type === "topics") {
      const removedQuestions = content.questions.filter((question) => question.topic === id);
      content.questions = content.questions.filter((question) => question.topic !== id);
      if (removedQuestions.length) notify(`Тема удалена вместе с вопросами: ${removedQuestions.length}.`);
    }
    saveContent();
  }

  function refreshQuestionTopics() {
    const form = document.getElementById("question-form");
    const subject = form.elements.namedItem("subject").value;
    const select = form.elements.namedItem("topic");
    const current = select.value;
    select.replaceChildren();
    [...base.topics, ...content.topics].filter((topic) => topic.subject === subject).forEach((topic) => {
      const option = document.createElement("option");
      option.value = topic.id;
      option.textContent = topic.title;
      select.append(option);
    });
    if ([...select.options].some((option) => option.value === current)) select.value = current;
  }

  function handleGlossarySubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const id = values.id || createId("glossary");
    const entry = {
      id,
      subject: values.subject,
      term: values.term.trim(),
      meaning: values.meaning.trim()
    };
    if (!isGlossary(entry) || !entry.term || !entry.meaning) {
      notify("Заполни термин и его определение.");
      return;
    }
    upsert(content.glossary, entry);
    hideForm("glossary");
    saveContent();
  }

  function handleTopicSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const entry = {
      id: values.id || createId("topic"),
      subject: values.subject,
      title: values.title.trim(),
      summary: values.summary.trim(),
      bookChapter: "Дополнительный материал",
      description: values.description.trim(),
      sections: [{ title: "Объяснение", text: values.description.trim() }],
      definitions: [],
      source: "Дополнительный материал, добавленный в админке"
    };
    if (!isTopic(entry) || !entry.title || !entry.summary || !entry.description) {
      notify("Заполни название, краткое описание и учебный материал.");
      return;
    }
    upsert(content.topics, entry);
    hideForm("topics");
    saveContent();
  }

  function handleQuestionSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const entry = {
      id: values.id || createId("question"),
      subject: values.subject,
      topic: values.topic,
      difficulty: values.difficulty,
      question: values.question.trim(),
      options: [values.option0, values.option1, values.option2, values.option3].map((value) => value.trim()),
      answer: Number(values.answer),
      explanation: values.explanation.trim()
    };
    if (!isQuestion(entry) || !entry.question || entry.options.some((option) => !option) || !entry.explanation) {
      notify("Заполни вопрос, все варианты ответа и объяснение.");
      return;
    }
    upsert(content.questions, entry);
    hideForm("questions");
    saveContent();
  }

  function upsert(collection, entry) {
    const index = collection.findIndex((item) => item.id === entry.id);
    if (index >= 0) collection[index] = entry;
    else collection.unshift(entry);
  }

  document.querySelectorAll(".admin-tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach((tab) => tab.classList.toggle("active", tab === button));
      document.querySelectorAll(".admin-panel").forEach((panel) => {
        const active = panel.id === `panel-${button.dataset.tab}`;
        panel.classList.toggle("active", active);
        panel.hidden = !active;
      });
    });
  });

  document.getElementById("add-glossary").addEventListener("click", () => showForm("glossary"));
  document.getElementById("add-topic").addEventListener("click", () => showForm("topics"));
  document.getElementById("add-question").addEventListener("click", () => showForm("questions"));
  document.getElementById("glossary-form").addEventListener("submit", handleGlossarySubmit);
  document.getElementById("topic-form").addEventListener("submit", handleTopicSubmit);
  document.getElementById("question-form").addEventListener("submit", handleQuestionSubmit);
  document.getElementById("question-form").elements.namedItem("subject").addEventListener("change", refreshQuestionTopics);
  document.querySelectorAll("[data-cancel]").forEach((button) => button.addEventListener("click", () => hideForm(button.dataset.cancel)));

  document.getElementById("export-content").addEventListener("click", () => {
    const payload = {
      app: "ChemBio Lab 9",
      version: 1,
      exportedAt: new Date().toISOString(),
      content
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `chembio-lab9-admin-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Резервная копия материалов подготовлена.");
  });

  document.getElementById("import-content").addEventListener("click", () => document.getElementById("content-file").click());
  document.getElementById("content-file").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      notify("Файл слишком большой: допустимо не более 2 МБ.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => notify("Не удалось прочитать файл материалов.");
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result));
        if (payload?.app !== "ChemBio Lab 9" || payload?.version !== 1 || !payload.content) {
          throw new Error("Файл не является резервной копией админки ChemBio Lab 9.");
        }
        const normalized = normalizeContent(payload.content);
        content.topics = normalized.topics;
        content.glossary = normalized.glossary;
        content.questions = normalized.questions;
        saveContent();
      } catch (error) {
        notify(`Импорт не выполнен: ${error.message}`);
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("clear-content").addEventListener("click", () => {
    const total = content.topics.length + content.glossary.length + content.questions.length;
    if (!total || !window.confirm(`Удалить все добавленные материалы (${total})? Это действие нельзя отменить.`)) return;
    content.topics = [];
    content.glossary = [];
    content.questions = [];
    saveContent();
  });

  renderAll();
})();
