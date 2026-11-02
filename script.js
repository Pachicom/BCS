(() => {
  "use strict";

  const data = loadContentData();
  const STORAGE_KEY = "chembio-lab9-progress-v2";
  const pageTitles = {
    home: "Добро пожаловать в лабораторию",
    topics: "Учебные темы",
    labs: "Виртуальные лаборатории",
    quiz: "Проверка знаний",
    glossary: "Словарь терминов",
    progress: "Мой прогресс"
  };
  const periodicElements = [
    {n:1,s:"H",name:"Водород",mass:"1.008",desc:"Самый лёгкий элемент; входит в состав воды и многих органических веществ.",col:1,row:1},
    {n:2,s:"He",name:"Гелий",mass:"4.003",desc:"Инертный газ; используется, например, в газоразрядных лампах.",col:18,row:1},
    {n:3,s:"Li",name:"Литий",mass:"6.94",desc:"Лёгкий щелочной металл; применяется в аккумуляторах.",col:1,row:2},
    {n:4,s:"Be",name:"Бериллий",mass:"9.012",desc:"Лёгкий твёрдый металл; его соединения требуют осторожного обращения.",col:2,row:2},
    {n:5,s:"B",name:"Бор",mass:"10.81",desc:"Элемент, встречающийся в составе минералов и некоторых природных веществ.",col:13,row:2},
    {n:6,s:"C",name:"Углерод",mass:"12.011",desc:"Основа огромного числа органических соединений и биомолекул.",col:14,row:2},
    {n:7,s:"N",name:"Азот",mass:"14.007",desc:"Составляет большую часть атмосферы и входит в состав белков и нуклеиновых кислот.",col:15,row:2},
    {n:8,s:"O",name:"Кислород",mass:"15.999",desc:"Участвует в аэробном дыхании и поддерживает процессы горения.",col:16,row:2},
    {n:9,s:"F",name:"Фтор",mass:"18.998",desc:"Очень активный неметалл; соединения фтора применяют в разных материалах.",col:17,row:2},
    {n:10,s:"Ne",name:"Неон",mass:"20.180",desc:"Инертный газ, известный применением в световых приборах.",col:18,row:2},
    {n:11,s:"Na",name:"Натрий",mass:"22.990",desc:"Активный щелочной металл; ион Na⁺ важен для водно-солевого баланса.",col:1,row:3},
    {n:12,s:"Mg",name:"Магний",mass:"24.305",desc:"Металл; магний входит в состав хлорофилла и многих минералов.",col:2,row:3},
    {n:13,s:"Al",name:"Алюминий",mass:"26.982",desc:"Лёгкий металл, защищённый на воздухе тонкой оксидной плёнкой.",col:13,row:3},
    {n:14,s:"Si",name:"Кремний",mass:"28.085",desc:"Полупроводник; его соединения широко распространены в минералах и горных породах.",col:14,row:3},
    {n:15,s:"P",name:"Фосфор",mass:"30.974",desc:"Входит в состав ДНК, АТФ и минеральной основы костной ткани.",col:15,row:3},
    {n:16,s:"S",name:"Сера",mass:"32.06",desc:"Неметалл, входящий в состав некоторых аминокислот и минералов.",col:16,row:3},
    {n:17,s:"Cl",name:"Хлор",mass:"35.45",desc:"Активный неметалл; хлорид-ионы входят в состав поваренной соли.",col:17,row:3},
    {n:18,s:"Ar",name:"Аргон",mass:"39.948",desc:"Инертный газ, применяемый, например, в лампах и сварочной среде.",col:18,row:3},
    {n:19,s:"K",name:"Калий",mass:"39.098",desc:"Щелочной металл; ионы K⁺ важны для работы клеток.",col:1,row:4},
    {n:20,s:"Ca",name:"Кальций",mass:"40.078",desc:"Металл; соединения кальция входят в состав костей и минералов.",col:2,row:4}
  ];
  const state = loadState();
  let activeSubject = "chem";
  let activeTopicId = null;
  let favoritesOnly = false;
  let activeLabId = null;
  let quiz = null;
  let toastTimer = 0;

  function loadContentData() {
    const contentKey = "chembio-lab9-admin-content-v1";
    try {
      const saved = localStorage.getItem(contentKey);
      if (!saved) return window.CHEMBIO_DATA;
      const extra = JSON.parse(saved);
      if (!extra || extra.version !== 1 ||
          !Array.isArray(extra.topics) || !Array.isArray(extra.glossary) || !Array.isArray(extra.questions)) {
        throw new Error("Формат материалов админки не распознан.");
      }
      const data = window.CHEMBIO_DATA;
      const topicIds = new Set(data.topics.map((item) => item.id));
      const questionIds = new Set(data.questions.map((item) => item.id));
      extra.topics.filter((item) =>
        item && typeof item.id === "string" && !topicIds.has(item.id) &&
        ["chem", "bio"].includes(item.subject) && typeof item.title === "string" &&
        typeof item.summary === "string" && typeof item.description === "string" &&
        Array.isArray(item.sections) && Array.isArray(item.definitions)
      ).forEach((item) => {
        topicIds.add(item.id);
        data.topics.push(item);
      });
      extra.glossary.filter((item) =>
        item && typeof item.term === "string" && typeof item.meaning === "string" &&
        ["chem", "bio"].includes(item.subject)
      ).forEach((item) => data.glossary.push(item));
      extra.questions.filter((item) =>
        item && typeof item.id === "string" && !questionIds.has(item.id) &&
        ["chem", "bio"].includes(item.subject) && topicIds.has(item.topic) &&
        ["easy", "medium", "hard"].includes(item.difficulty) &&
        typeof item.question === "string" && Array.isArray(item.options) &&
        item.options.length >= 2 && Number.isInteger(item.answer) &&
        item.answer >= 0 && item.answer < item.options.length &&
        typeof item.explanation === "string"
      ).forEach((item) => {
        questionIds.add(item.id);
        data.questions.push(item);
      });
      return data;
    } catch (error) {
      window.setTimeout(() => showToast(`Не удалось загрузить дополнительные материалы: ${error.message}`), 0);
      return window.CHEMBIO_DATA;
    }
  }

  function defaultState() {
    return {
      version: 2,
      xp: 0,
      completed: [],
      favorites: [],
      studyHistory: [],
      quizHistory: [],
      wrongQuestionIds: [],
      lastTopic: null,
      theme: "dark"
    };
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return defaultState();
      const parsed = JSON.parse(saved);
      if (!parsed || parsed.version !== 2) throw new Error("Неизвестный формат сохранённого прогресса.");
      const clean = defaultState();
      clean.xp = Number.isSafeInteger(parsed.xp) && parsed.xp >= 0 ? parsed.xp : 0;
      ["completed", "favorites", "wrongQuestionIds"].forEach((key) => {
        clean[key] = Array.isArray(parsed[key]) ? parsed[key].filter((value) => typeof value === "string").slice(0, 1000) : [];
      });
      clean.studyHistory = Array.isArray(parsed.studyHistory) ? parsed.studyHistory.filter(isHistoryEntry).slice(0, 100) : [];
      clean.quizHistory = Array.isArray(parsed.quizHistory) ? parsed.quizHistory.filter(isQuizEntry).slice(0, 100) : [];
      clean.lastTopic = typeof parsed.lastTopic === "string" ? parsed.lastTopic : null;
      clean.theme = parsed.theme === "light" ? "light" : "dark";
      return clean;
    } catch (error) {
      window.setTimeout(() => showToast(`Не удалось прочитать сохранённый прогресс: ${error.message}`), 0);
      return defaultState();
    }
  }

  function isHistoryEntry(entry) {
    return entry && typeof entry.topicId === "string" && typeof entry.at === "string" && Number.isFinite(Date.parse(entry.at));
  }

  function isQuizEntry(entry) {
    return entry && typeof entry.at === "string" && Number.isFinite(Date.parse(entry.at)) &&
      Number.isInteger(entry.score) && Number.isInteger(entry.total) && entry.total > 0 &&
      entry.total <= 1000 && entry.score >= 0 && entry.score <= entry.total;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      showToast(`Не удалось сохранить прогресс в этом браузере: ${error.message}`);
      return false;
    }
  }

  function showToast(message) {
    const node = document.getElementById("toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => node.classList.remove("show"), 3600);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function showPage(name) {
    if (!pageTitles[name]) return;
    document.querySelectorAll(".page").forEach((page) => page.classList.toggle("active", page.id === name));
    document.querySelectorAll(".nav").forEach((button) => button.classList.toggle("active", button.dataset.page === name));
    document.getElementById("page-title").textContent = pageTitles[name];
    document.getElementById("search-results").hidden = true;
    if (name === "progress") renderProgress();
    if (name === "quiz") renderQuizHistory();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      showPage(button.dataset.page);
    });
  });
  document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.subjectGo) {
      activeSubject = button.dataset.subjectGo;
      renderTopics();
    }
    if (button.dataset.go === "labs" && !activeLabId) activeLabId = data.labs[0].id;
    showPage(button.dataset.go);
  }));

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    const button = document.getElementById("theme-toggle");
    button.textContent = state.theme === "dark" ? "☼" : "☾";
    button.setAttribute("aria-label", state.theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему");
    document.querySelector('meta[name="theme-color"]').content = state.theme === "dark" ? "#0b1018" : "#f3f5fa";
  }

  document.getElementById("theme-toggle").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
    saveState();
  });

  function renderHome() {
    document.getElementById("home-xp").textContent = `${state.xp} XP`;
    document.getElementById("home-completed").textContent = String(state.completed.length);
    document.getElementById("home-quizzes").textContent = String(state.quizHistory.length);
    document.getElementById("home-favorites").textContent = String(state.favorites.length);
    const resume = document.getElementById("resume-card");
    const topic = data.topics.find((item) => item.id === state.lastTopic);
    resume.replaceChildren();
    if (!topic) return;
    const title = document.createElement("b");
    title.textContent = "Продолжить с последней темы";
    const text = document.createElement("span");
    text.textContent = `${topic.title} · ${topic.subject === "chem" ? "Химия" : "Биология"}`;
    const button = document.createElement("button");
    button.className = "secondary";
    button.textContent = "Открыть тему →";
    button.addEventListener("click", () => openTopic(topic.id));
    resume.append(title, text, button);
  }

  document.querySelectorAll(".subject-tab").forEach((button) => button.addEventListener("click", () => {
    activeSubject = button.dataset.subject;
    document.querySelectorAll(".subject-tab").forEach((tab) => {
      const selected = tab === button;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });
    activeTopicId = null;
    renderTopics();
  }));

  function renderTopics() {
    const topics = data.topics.filter((topic) => topic.subject === activeSubject && (!favoritesOnly || state.favorites.includes(topic.id)));
    const list = document.getElementById("topic-list");
    list.replaceChildren();
    topics.forEach((topic) => {
      const button = document.createElement("button");
      button.className = `topic-item${topic.id === activeTopicId ? " active" : ""}`;
      button.innerHTML = `${escapeHtml(topic.title)}<small>${escapeHtml(topic.summary)}</small>`;
      button.addEventListener("click", () => openTopic(topic.id));
      list.append(button);
    });
    if (topics.length && !topics.some((topic) => topic.id === activeTopicId)) openTopic(topics[0].id, false);
    if (!topics.length) document.getElementById("topic-detail").innerHTML = `<div class="empty-state">${favoritesOnly ? "В этом предмете пока нет избранных тем. Нажми ♡ в карточке темы." : "Материалы для этого раздела пока не добавлены."}</div>`;
    document.getElementById("favorite-filter").textContent = favoritesOnly ? "♥ Показать все темы" : "♡ Только избранное";
    document.getElementById("favorite-filter").setAttribute("aria-pressed", String(favoritesOnly));
  }

  document.getElementById("favorite-filter").addEventListener("click", () => {
    favoritesOnly = !favoritesOnly;
    activeTopicId = null;
    renderTopics();
  });

  function renderSection(section) {
    let html = `<h3>${escapeHtml(section.title)}</h3>`;
    if (section.text) html += `<p>${escapeHtml(section.text)}</p>`;
    if (section.formula) html += `<div class="lab-result"><strong>${escapeHtml(section.formula)}</strong></div>`;
    if (section.bullets) html += `<ul>${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    if (section.steps) html += `<ol>${section.steps.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`;
    if (section.table) {
      html += `<div class="table-wrap"><table><thead><tr>${section.table.headers.map((value) => `<th>${escapeHtml(value)}</th>`).join("")}</tr></thead><tbody>`;
      html += section.table.rows.map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`).join("");
      html += "</tbody></table></div>";
    }
    return html;
  }

  function openTopic(topicId, addHistory = true) {
    const topic = data.topics.find((item) => item.id === topicId);
    if (!topic) return;
    const subjectChanged = activeSubject !== topic.subject;
    const filterChanged = favoritesOnly && !state.favorites.includes(topicId);
    activeSubject = topic.subject;
    if (filterChanged) favoritesOnly = false;
    activeTopicId = topicId;
    if (subjectChanged || filterChanged) renderTopics();
    document.querySelectorAll(".subject-tab").forEach((tab) => {
      const selected = tab.dataset.subject === activeSubject;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });
    document.querySelectorAll(".topic-item").forEach((button) => button.classList.toggle("active", button.textContent.startsWith(topic.title)));
    if (addHistory) {
      state.lastTopic = topicId;
      state.studyHistory.unshift({ topicId, at: new Date().toISOString() });
      state.studyHistory = state.studyHistory.slice(0, 100);
      saveState();
      renderHome();
    }
    const isFavorite = state.favorites.includes(topicId);
    const isComplete = state.completed.includes(topicId);
    const definitions = (topic.definitions || []).map((item) => `<div class="definition"><b>${escapeHtml(item.term)}</b> — ${escapeHtml(item.meaning)}</div>`).join("");
    const equations = (topic.equations || []).map((item) => `<div class="definition"><b>${escapeHtml(item.label)}</b><br>${escapeHtml(item.value)}</div>`).join("");
    const example = topic.example ? `<section><h3>${escapeHtml(topic.example.title)}</h3><ol>${topic.example.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol><p><b>Ответ:</b> ${escapeHtml(topic.example.answer)}</p></section>` : "";
    const mistakes = topic.mistakes?.length ? `<section><h3>Типичные ошибки</h3><ul>${topic.mistakes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>` : "";
    const facts = topic.facts?.length ? `<section><h3>Запомни</h3><ul>${topic.facts.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>` : "";
    const cellModel = topic.id === "bio-cell" ? `
      <section class="cell-model"><h3>Интерактивная схема животной клетки</h3>
        <div class="cell-scheme">
          <svg viewBox="0 0 500 320" role="img" aria-label="Схема животной клетки; выбери органоид">
            <ellipse cx="250" cy="160" rx="226" ry="137" class="cell-outline"/>
            <ellipse cx="250" cy="160" rx="214" ry="126" class="cell-cytoplasm"/>
            <ellipse cx="258" cy="154" rx="65" ry="54" class="cell-nucleus cell-part" data-cell-part="Ядро" tabindex="0" role="button" aria-label="Ядро"/>
            <circle cx="266" cy="156" r="18" class="cell-nucleolus cell-part" data-cell-part="Ядро" tabindex="0" role="button" aria-label="Ядро"/>
            <path d="M92 112c-27-23 27-44 51-17 19 22-18 44-42 25z" class="cell-mito cell-part" data-cell-part="Митохондрия" tabindex="0" role="button" aria-label="Митохондрия"/>
            <path d="M342 224c-27-23 27-44 51-17 19 22-18 44-42 25z" class="cell-mito cell-part" data-cell-part="Митохондрия" tabindex="0" role="button" aria-label="Митохондрия"/>
            <g class="cell-part" data-cell-part="Эндоплазматическая сеть" tabindex="0" role="button" aria-label="Эндоплазматическая сеть"><path d="M190 85q-28 15 0 28t0 27q-28 15 0 27" class="cell-er"/><path d="M326 101q24 12 0 24t0 24" class="cell-er"/></g>
            <g class="cell-part" data-cell-part="Аппарат Гольджи" tabindex="0" role="button" aria-label="Аппарат Гольджи"><path d="M132 194q32-20 62 0M130 207q32-20 62 0M128 220q32-20 62 0" class="cell-golgi"/></g>
            <circle cx="377" cy="112" r="12" class="cell-lysosome cell-part" data-cell-part="Лизосома" tabindex="0" role="button" aria-label="Лизосома"/>
            <g class="cell-part" data-cell-part="Рибосома" tabindex="0" role="button" aria-label="Рибосома"><circle cx="219" cy="72" r="4" class="cell-ribosome"/><circle cx="303" cy="76" r="4" class="cell-ribosome"/><circle cx="311" cy="205" r="4" class="cell-ribosome"/><circle cx="216" cy="231" r="4" class="cell-ribosome"/></g>
          </svg>
          <div class="cell-description"><b>Выбери структуру на схеме</b><p id="cell-info" aria-live="polite">Схема условная, не в масштабе. Нажми на цветную структуру, чтобы прочитать её роль.</p>
            <div class="cell-key">${["Ядро","Митохондрия","Эндоплазматическая сеть","Аппарат Гольджи","Лизосома","Рибосома"].map((name) => `<button class="secondary" type="button" data-cell-part="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join("")}</div>
          </div>
        </div><span class="topic-meta">Условная модель эукариотической клетки; органоиды показаны не в масштабе.</span>
      </section>` : "";
    const nephronModel = topic.id === "bio-excretion" ? `
      <section class="nephron-model"><h3>Схема нефрона</h3>
        <div class="nephron-layout">
          <svg viewBox="0 0 500 300" role="img" aria-label="Упрощённая схема нефрона; выбери его часть">
            <path d="M142 78 C235 40 270 120 224 155 C185 185 128 140 155 108 C177 81 215 96 205 119" class="nephron-tubule nephron-part" data-nephron="Клубочек" tabindex="0" role="button" aria-label="Клубочек"/>
            <ellipse cx="184" cy="112" rx="72" ry="64" class="nephron-capsule nephron-part" data-nephron="Капсула Боумена" tabindex="0" role="button" aria-label="Капсула Боумена"/>
            <path d="M252 135 C300 100 345 120 318 155 C298 182 350 193 329 220" class="nephron-tubule nephron-part" data-nephron="Проксимальный каналец" tabindex="0" role="button" aria-label="Проксимальный каналец"/>
            <path d="M329 220 C315 272 255 272 249 221 L249 185" class="nephron-loop nephron-part" data-nephron="Петля нефрона" tabindex="0" role="button" aria-label="Петля нефрона"/>
            <path d="M249 185 C243 150 280 138 311 148 C340 158 365 149 375 123" class="nephron-distal nephron-part" data-nephron="Дистальный каналец" tabindex="0" role="button" aria-label="Дистальный каналец"/>
            <path d="M390 70 L390 250" class="nephron-collecting nephron-part" data-nephron="Собирательная трубочка" tabindex="0" role="button" aria-label="Собирательная трубочка"/>
            <path d="M184 47 L184 27 M184 27 L175 39 M184 27 L193 39" class="nephron-arrow"/>
            <text x="164" y="18" class="nephron-label">кровь</text><text x="402" y="264" class="nephron-label">к оттоку мочи</text>
          </svg>
          <div><p id="nephron-info" aria-live="polite">Нажми на участок нефрона или выбери его в списке, чтобы увидеть его роль.</p>
            <div class="nephron-key">${["Клубочек","Капсула Боумена","Проксимальный каналец","Петля нефрона","Дистальный каналец","Собирательная трубочка"].map((name) => `<button class="secondary" type="button" data-nephron="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join("")}</div>
          </div>
        </div><span class="topic-meta">Схема упрощённая и не в масштабе; направление потока показано условно.</span>
      </section>` : "";
    const periodicModel = topic.id === "chem-groups" ? `
      <section class="periodic-widget"><h3>Первые 20 элементов таблицы Менделеева</h3>
        <p>Найди элемент по символу, названию или атомному номеру и выбери его карточку.</p>
        <input id="element-search" type="search" placeholder="Поиск элемента…" aria-label="Поиск элемента">
        <div id="periodic" class="periodic-grid" aria-label="Периодическая таблица, элементы 1–20"></div>
        <div id="element-info" class="element-info" aria-live="polite"></div>
      </section>` : "";
    const detail = document.getElementById("topic-detail");
    detail.innerHTML = `
      <span class="eyebrow">${topic.subject === "chem" ? "ХИМИЯ" : "БИОЛОГИЯ"} · ${escapeHtml(topic.bookChapter || "УЧЕБНЫЙ МАТЕРИАЛ")}</span>
      <h2>${escapeHtml(topic.title)}</h2><p>${escapeHtml(topic.description)}</p>
      ${cellModel}${nephronModel}${periodicModel}
      ${topic.sections.map(renderSection).join("")}
      ${definitions ? `<section><h3>Основные понятия</h3><div class="definition-list">${definitions}</div></section>` : ""}
      ${equations ? `<section><h3>Формулы и реакции</h3><div class="definition-list">${equations}</div></section>` : ""}
      ${example}${mistakes}${facts}
      <div class="topic-actions">
        <button class="secondary" id="favorite-topic">${isFavorite ? "♥ В избранном" : "♡ В избранное"}</button>
        <button class="primary" id="complete-topic">${isComplete ? "✓ Тема изучена" : "Отметить изученной +15 XP"}</button>
        <button class="secondary" id="topic-quiz">Проверить знания →</button>
        <span class="topic-meta">${escapeHtml(topic.source || "По учебнику 9 класса")}</span>
      </div>`;
    if (topic.id === "chem-groups") {
        const periodic = detail.querySelector("#periodic");
        const info = detail.querySelector("#element-info");
        const selectElement = (element) => {
          periodic.querySelectorAll(".element-tile").forEach((tile) => tile.classList.toggle("selected", Number(tile.dataset.number) === element.n));
          info.innerHTML = `<span class="element-symbol">${element.s}</span><div><span class="eyebrow">ЭЛЕМЕНТ · ${String(element.n).padStart(3,"0")}</span><h4>${element.name}</h4><p>${element.desc}</p><small>Символ <b>${element.s}</b> · атомная масса ${element.mass}</small></div>`;
        };
        periodicElements.forEach((element) => {
          const tile = document.createElement("button");
          tile.type = "button";
          tile.className = "element-tile";
          tile.style.gridColumn = String(element.col);
          tile.style.gridRow = String(element.row);
          tile.dataset.number = String(element.n);
          tile.title = `${element.name} · № ${element.n}`;
          tile.setAttribute("aria-label", `${element.name}, атомный номер ${element.n}`);
          tile.innerHTML = `<span>${element.n}</span><b>${element.s}</b>`;
          tile.addEventListener("click", () => selectElement(element));
          periodic.append(tile);
        });
        detail.querySelector("#element-search").addEventListener("input", (event) => {
          const query = event.target.value.trim().toLocaleLowerCase("ru");
          periodic.querySelectorAll(".element-tile").forEach((tile) => {
            const element = periodicElements.find((item) => item.n === Number(tile.dataset.number));
            tile.classList.toggle("dimmed", Boolean(query) && !`${element.n} ${element.s} ${element.name}`.toLocaleLowerCase("ru").includes(query));
          });
        });
        selectElement(periodicElements[0]);
    }
    const organelleDetails = {
        "Ядро": "Содержит основную часть ДНК и участвует в регуляции процессов клетки.",
        "Митохондрия": "Участвует в клеточном дыхании; в ней образуется значительная часть АТФ.",
        "Эндоплазматическая сеть": "Мембранная сеть участвует в синтезе и перемещении веществ; на шероховатой ЭПС находятся рибосомы.",
        "Аппарат Гольджи": "Модифицирует, сортирует и упаковывает вещества для транспорта.",
        "Лизосома": "Содержит ферменты, расщепляющие частицы и старые клеточные компоненты.",
        "Рибосома": "Синтезирует белок по информации, доставленной молекулами РНК."
    };
    detail.querySelectorAll("[data-cell-part]").forEach((part) => {
        const describe = () => {
          const name = part.dataset.cellPart;
          const info = detail.querySelector("#cell-info");
          if (info) info.textContent = `${name}: ${organelleDetails[name]}`;
          detail.querySelectorAll(".cell-key button").forEach((button) => button.classList.toggle("cell-selected", button.dataset.cellPart === name));
        };
        part.addEventListener("click", describe);
        if (part.tagName.toLowerCase() === "button") return;
        part.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            describe();
          }
        });
    });
    const nephronDetails = {
        "Клубочек": "В капиллярном клубочке фильтруется часть плазмы крови; клетки крови и большинство крупных белков остаются в кровотоке.",
        "Капсула Боумена": "Принимает фильтрат из клубочка; он становится первичной мочой и поступает в канальцы.",
        "Проксимальный каналец": "Здесь обратно в кровь всасывается большая часть воды и полезных растворённых веществ.",
        "Петля нефрона": "Различное перемещение воды и солей по её участкам помогает создавать условия для концентрации мочи.",
        "Дистальный каналец": "Участвует в регулируемой реабсорбции и секреции ионов, влияя на состав жидкости в канальце.",
        "Собирательная трубочка": "Здесь может дополнительно всасываться вода; далее окончательная моча направляется к почечной лоханке."
    };
    detail.querySelectorAll("[data-nephron]").forEach((part) => {
        const describe = () => {
          const name = part.dataset.nephron;
          const info = detail.querySelector("#nephron-info");
          if (info) info.textContent = `${name}: ${nephronDetails[name]}`;
          detail.querySelectorAll(".nephron-key button").forEach((button) => button.classList.toggle("cell-selected", button.dataset.nephron === name));
        };
        part.addEventListener("click", describe);
        if (part.tagName.toLowerCase() !== "button") {
          part.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              describe();
            }
          });
        }
    });
    detail.querySelector("#favorite-topic").addEventListener("click", () => {
      const index = state.favorites.indexOf(topicId);
      if (index >= 0) {
        state.favorites.splice(index, 1);
        if (favoritesOnly) favoritesOnly = false;
      }
      else state.favorites.push(topicId);
      saveState();
      renderHome();
      activeTopicId = topicId;
      renderTopics();
      openTopic(topicId, false);
    });
    detail.querySelector("#complete-topic").addEventListener("click", () => {
      if (state.completed.includes(topicId)) {
        showToast("Эта тема уже отмечена как изученная.");
        return;
      }
      state.completed.push(topicId);
      state.xp += 15;
      saveState();
      renderHome();
      renderProgress();
      openTopic(topicId, false);
      showToast("Тема изучена: начислено 15 XP.");
    });
    detail.querySelector("#topic-quiz").addEventListener("click", () => {
      document.getElementById("quiz-subject").value = topic.subject;
      updateQuizTopicOptions(topic.subject);
      document.getElementById("quiz-topic").value = topic.id;
      showPage("quiz");
      startQuiz();
    });
    renderHome();
  }

  function renderLabs() {
    const list = document.getElementById("lab-list");
    list.replaceChildren();
    data.labs.forEach((lab) => {
      const button = document.createElement("button");
      button.className = `lab-item${lab.id === activeLabId ? " active" : ""}`;
      button.textContent = lab.title;
      button.addEventListener("click", () => {
        activeLabId = lab.id;
        renderLabs();
      });
      list.append(button);
    });
    const lab = data.labs.find((item) => item.id === activeLabId) || data.labs[0];
    activeLabId = lab.id;
    document.getElementById("lab-workspace").innerHTML = `<span class="eyebrow">${lab.subject === "chem" ? "ХИМИЯ" : "БИОЛОГИЯ"} · МОДЕЛЬ</span><h2>${escapeHtml(lab.title)}</h2><p>${escapeHtml(lab.summary)}</p><div class="lab-instructions"><h3>Инструкция</h3><ol>${lab.instructions.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol></div><div class="lab-controls" id="lab-controls"></div><div id="lab-output" aria-live="polite"></div><button class="secondary" id="reset-lab">Сбросить модель ↻</button>`;
    setupLabControls(lab);
    document.getElementById("reset-lab").addEventListener("click", () => setupLabControls(lab));
  }

  function setupLabControls(lab) {
    const controls = document.getElementById("lab-controls");
    if (!controls) return;
    const inputs = {
      conductivity: [
        ["substance", "Раствор", [["salt","NaCl — соль"],["sugar","Сахароза"],["acid","HCl — кислота"],["water","Дистиллированная вода"]]],
        ["concentration", "Концентрация, усл. ед.", "range", 1, 10, 5]
      ],
      dissociation: [["substance","Электролит",[["NaCl","NaCl"],["CaCl2","CaCl₂"],["HCl","HCl"],["NaOH","NaOH"]]]],
      qualitative: [
        ["sample","Ион в пробе",[["chloride","Cl⁻"],["sulfate","SO₄²⁻"],["carbonate","CO₃²⁻"]]],
        ["reagent","Реактив",[["silver","AgNO₃"],["barium","BaCl₂"],["acid","HCl"]]]
      ],
      ions: [["reaction","Смешиваем растворы",[["AgNO3_NaCl","AgNO₃ + NaCl"],["BaCl2_Na2SO4","BaCl₂ + Na₂SO₄"],["HCl_NaOH","HCl + NaOH"]]]],
      microscope: [["field","Размер поля зрения при ×40, мм","range",0.5,2,1],["cells","Клеток поперёк поля","range",1,20,5]],
      mitosis: [["stage","Стадия деления",[["prophase","Профаза"],["metaphase","Метафаза"],["anaphase","Анафаза"],["telophase","Телофаза"]]]],
      punnett: [["parent1","Генотип родителя 1",[["Aa","Aa"],["AA","AA"],["aa","aa"]]],["parent2","Генотип родителя 2",[["Aa","Aa"],["AA","AA"],["aa","aa"]]]],
      ecosystem: [["predators","Хищники","range",0,20,5],["prey","Жертвы","range",5,100,50]]
    }[lab.type] || [];
    controls.innerHTML = inputs.map(([id,label,kind,a,b,c]) => {
      if (kind === "range") {
        const step = id === "field" ? "0.1" : "1";
        const initial = Math.min(b, Math.max(a, Number(c)));
        return `<label>${escapeHtml(label)} <output id="out-${id}">${initial}</output><input id="lab-${id}" type="range" min="${a}" max="${b}" step="${step}" value="${initial}" aria-label="${escapeHtml(label)}"></label>`;
      }
      const options = Array.isArray(kind) ? kind : a;
      return `<label>${escapeHtml(label)}<select id="lab-${id}">${options.map(([value,text]) => `<option value="${value}">${escapeHtml(text)}</option>`).join("")}</select></label>`;
    }).join("");
    controls.querySelectorAll("input,select").forEach((input) => input.addEventListener("input", updateLab));
    updateLab();
  }

  function updateLab() {
    const lab = data.labs.find((item) => item.id === activeLabId);
    if (!lab) return;
    const value = (name) => document.getElementById(`lab-${name}`)?.value;
    const range = (name) => {
      const input = document.getElementById(`lab-${name}`);
      if (!input) return 0;
      const output = document.getElementById(`out-${name}`);
      output.textContent = input.value;
      return Number(input.value);
    };
    let title = "Наблюдение модели";
    let result = "";
    let percent = 50;
    if (lab.type === "conductivity") {
      const strength = { salt: 82, acid: 72, sugar: 0, water: 0 }[value("substance")];
      const level = Math.round(strength * range("concentration") / 10);
      percent = level;
      title = level > 0 ? `Проводимость: ${level}% от условного максимума` : "Проводимость близка к нулю";
      result = level > 0 ? "В растворах соли и кислоты подвижные ионы переносят заряд. При увеличении концентрации модели становится больше носителей заряда." : "Молекулы сахара остаются нейтральными, а в дистиллированной воде очень мало ионов; поэтому модель не показывает заметного тока.";
    } else if (lab.type === "dissociation") {
      const reactions = {
        NaCl: "NaCl → Na⁺ + Cl⁻",
        CaCl2: "CaCl₂ → Ca²⁺ + 2Cl⁻",
        HCl: "HCl → H⁺ + Cl⁻",
        NaOH: "NaOH → Na⁺ + OH⁻"
      };
      title = "Уравнение диссоциации";
      result = `${reactions[value("substance")]}<br>В воде растворённое соединение образует гидратированные ионы. Это схема процесса, а не наблюдение частиц без приборов.`;
      percent = 75;
    } else if (lab.type === "qualitative") {
      const sample = value("sample");
      const reagent = value("reagent");
      const tests = {
        chloride: { silver: ["Ag⁺ + Cl⁻ → AgCl↓", "Белый осадок хлорида серебра — модель положительной реакции на Cl⁻."], barium: ["Ba²⁺ + Cl⁻", "Характерного осадка в этой модели нет."], acid: ["Cl⁻ + H⁺", "Характерного осадка или газа в этой модели нет."] },
        sulfate: { silver: ["Ag⁺ + SO₄²⁻", "Для выбранной школьной пробы характерный сульфат-осадок проверяют ионами Ba²⁺."], barium: ["Ba²⁺ + SO₄²⁻ → BaSO₄↓", "Белый малорастворимый осадок BaSO₄ — модель положительной реакции на SO₄²⁻."], acid: ["SO₄²⁻ + H⁺", "Характерного признака этой качественной реакции в модели нет."] },
        carbonate: { silver: ["Ag⁺ + CO₃²⁻", "В этой модели для карбоната выбрана проверка кислотой."], barium: ["Ba²⁺ + CO₃²⁻", "Может образоваться малорастворимый карбонат бария; для подтверждения карбоната в модели выбери кислоту."], acid: ["CO₃²⁻ + 2H⁺ → CO₂↑ + H₂O", "Выделяются пузырьки CO₂; газ можно подтвердить известковой водой."] }
      }[sample][reagent];
      title = "Качественная реакция · наблюдение";
      result = `${tests[0]}<br>${tests[1]}`;
      percent = tests[1].includes("модели нет") || tests[1].includes("выбрана") ? 18 : 78;
    } else if (lab.type === "ions") {
      const reactions = {
        AgNO3_NaCl: ["AgNO₃ + NaCl → AgCl↓ + NaNO₃", "Образуется белый осадок хлорида серебра; сокращённое ионное уравнение: Ag⁺ + Cl⁻ → AgCl↓."],
        BaCl2_Na2SO4: ["BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl", "Образуется малорастворимый белый BaSO₄; сокращённое уравнение: Ba²⁺ + SO₄²⁻ → BaSO₄↓."],
        HCl_NaOH: ["HCl + NaOH → NaCl + H₂O", "Ионы H⁺ и OH⁻ образуют воду: H⁺ + OH⁻ → H₂O. Это реакция нейтрализации."]
      }[value("reaction")];
      title = "Модель результата реакции";
      result = `${reactions[0]}<br>${reactions[1]}`;
      percent = 62;
    } else if (lab.type === "microscope") {
      const field = range("field");
      const cells = range("cells");
      const diameter = (field * 1000 / cells).toFixed(0);
      title = `Оценочный размер клетки: около ${diameter} мкм`;
      result = `Расчёт: диаметр поля зрения ${field} мм ÷ ${cells} клеток × 1000 мкм/мм = ${diameter} мкм. При увеличении объектива поле зрения обычно уменьшается.`;
      percent = Math.min(100, Math.round(1000 / field / 10));
    } else if (lab.type === "mitosis") {
      const phases = {
        prophase: ["Профаза", "Хроматин уплотняется в хромосомы; ядерная оболочка постепенно разрушается, формируется веретено деления."],
        metaphase: ["Метафаза", "Хромосомы располагаются в экваториальной плоскости клетки и прикрепляются к нитям веретена."],
        anaphase: ["Анафаза", "Сестринские хроматиды расходятся к противоположным полюсам клетки."],
        telophase: ["Телофаза", "Хромосомы деспирализуются, восстанавливаются ядра; цитокинез разделяет цитоплазму."]
      }[value("stage")];
      title = phases[0];
      result = `${phases[1]}<br>Результат митоза — две дочерние клетки с одинаковым набором хромосом, если исходная клетка нормально прошла деление.`;
      percent = { prophase: 25, metaphase: 50, anaphase: 75, telophase: 100 }[value("stage")];
    } else if (lab.type === "punnett") {
      const first = value("parent1");
      const second = value("parent2");
      const gametes = (genotype) => genotype.split("");
      const a = gametes(first);
      const b = gametes(second);
      const combinations = a.flatMap((x) => b.map((y) => [x, y].sort().join("")));
      const dominant = combinations.filter((x) => x !== "aa").length;
      const recessive = combinations.length - dominant;
      title = "Решётка Пеннета · вероятные генотипы потомства";
      result = `<div class="punnett-grid"><span>×</span>${b.map(escapeHtml).map((item) => `<span>${item}</span>`).join("")}${a.map((allele) => `<span>${escapeHtml(allele)}</span>${b.map((other) => `<span>${escapeHtml([allele,other].sort().join(""))}</span>`).join("")}`).join("")}</div>В этой модели вероятность проявления доминантного фенотипа — ${Math.round(dominant / combinations.length * 100)}%, рецессивного — ${Math.round(recessive / combinations.length * 100)}%. Вероятность не предсказывает результат для каждого отдельного ребёнка.`;
      percent = Math.round(dominant / combinations.length * 100);
    } else if (lab.type === "ecosystem") {
      const predators = range("predators");
      const prey = range("prey");
      const balance = Math.max(0, Math.min(100, Math.round(prey - predators * 4)));
      title = predators === 0 ? "Хищники отсутствуют в модели" : predators * 4 > prey ? "Высокая нагрузка хищников" : "Популяции условно сбалансированы";
      result = `Условный индекс доступности добычи: ${balance}%. При росте числа хищников доступность добычи уменьшается. Реальные экосистемы зависят от гораздо большего числа факторов, поэтому это упрощённая модель.`;
      percent = balance;
    }
    document.getElementById("lab-output").innerHTML = `<div class="lab-result"><strong>${escapeHtml(title)}</strong><div class="sim-meter" aria-label="Условная визуализация"><span style="width:${percent}%"></span></div><p>${result}</p><small class="topic-meta">Модель показывает закономерность качественно и не заменяет экспериментальные измерения.</small></div>`;
  }

  document.getElementById("quiz-subject").addEventListener("change", (event) => updateQuizTopicOptions(event.target.value));

  function updateQuizTopicOptions(subject) {
    const select = document.getElementById("quiz-topic");
    const current = select.value;
    select.innerHTML = '<option value="all">Все темы</option>';
    data.topics.filter((topic) => subject === "all" || topic.subject === subject).forEach((topic) => {
      const option = document.createElement("option");
      option.value = topic.id;
      option.textContent = topic.title;
      select.append(option);
    });
    if ([...select.options].some((option) => option.value === current)) select.value = current;
  }

  function shuffle(items) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function startQuiz(onlyWrong = false) {
    const subject = document.getElementById("quiz-subject").value;
    const topicId = document.getElementById("quiz-topic").value;
    const difficulty = document.getElementById("quiz-difficulty").value;
    let pool = data.questions.filter((question) =>
      (subject === "all" || question.subject === subject) &&
      (topicId === "all" || question.topic === topicId) &&
      (difficulty === "all" || question.difficulty === difficulty)
    );
    if (onlyWrong) pool = pool.filter((question) => state.wrongQuestionIds.includes(question.id));
    if (!pool.length) {
      showToast(onlyWrong ? "Пока нет сохранённых ошибок для повторения." : "Для выбранных фильтров вопросов не найдено.");
      return;
    }
    quiz = { items: shuffle(pool).slice(0, 10), index: 0, correct: 0, wrong: [], answered: false };
    renderQuestion();
  }

  function renderQuestion() {
    const item = quiz.items[quiz.index];
    const box = document.getElementById("quiz-box");
    box.innerHTML = `<div class="quiz-progress"><span>Вопрос ${quiz.index + 1} из ${quiz.items.length}</span><span>${item.subject === "chem" ? "Химия" : "Биология"} · ${item.difficulty === "easy" ? "базовый" : item.difficulty === "hard" ? "повышенный" : "средний"}</span></div><h3>${escapeHtml(item.question)}</h3><div class="answers">${item.options.map((option, index) => `<button class="answer" data-answer="${index}">${String.fromCharCode(65 + index)}. ${escapeHtml(option)}</button>`).join("")}</div><div id="answer-feedback"></div><button id="next-question" class="primary" disabled>${quiz.index === quiz.items.length - 1 ? "Завершить тест →" : "Следующий вопрос →"}</button>`;
    box.querySelectorAll(".answer").forEach((button) => button.addEventListener("click", () => answerQuestion(Number(button.dataset.answer))));
    box.querySelector("#next-question").addEventListener("click", nextQuestion);
  }

  function answerQuestion(selected) {
    if (!quiz || quiz.answered) return;
    quiz.answered = true;
    const item = quiz.items[quiz.index];
    if (selected === item.answer) quiz.correct++;
    else quiz.wrong.push(item.id);
    document.querySelectorAll("#quiz-box .answer").forEach((button, index) => {
      button.disabled = true;
      if (index === item.answer) button.classList.add("correct");
      if (index === selected && selected !== item.answer) button.classList.add("wrong");
    });
    document.getElementById("answer-feedback").innerHTML = `<div class="answer-explanation"><b>${selected === item.answer ? "Верно!" : "Разберём ответ:"}</b> ${escapeHtml(item.explanation)}</div>`;
    document.getElementById("next-question").disabled = false;
  }

  function nextQuestion() {
    if (!quiz?.answered) return;
    if (quiz.index < quiz.items.length - 1) {
      quiz.index++;
      quiz.answered = false;
      renderQuestion();
      return;
    }
    finishQuiz();
  }

  function finishQuiz() {
    const score = quiz.correct;
    const total = quiz.items.length;
    const wrongIds = quiz.wrong;
    const earned = score * 3 + (score === total ? 5 : 0);
    state.xp += earned;
    state.wrongQuestionIds = [...new Set([...wrongIds, ...state.wrongQuestionIds.filter((id) => !quiz.items.some((item) => item.id === id))])].slice(0, 500);
    state.quizHistory.unshift({ at: new Date().toISOString(), score, total, subject: document.getElementById("quiz-subject").value, topic: document.getElementById("quiz-topic").value, wrongIds });
    state.quizHistory = state.quizHistory.slice(0, 100);
    saveState();
    renderHome();
    renderQuizHistory();
    renderProgress();
    document.getElementById("quiz-box").innerHTML = `<div class="empty-state"><span class="eyebrow">ТЕСТ ЗАВЕРШЁН</span><h2>${score} из ${total}</h2><p>${score === total ? "Отличный результат — все ответы верны!" : score >= total / 2 ? "Хорошая работа. Повтори ошибки, чтобы закрепить материал." : "Вернись к объяснениям тем и попробуй ещё раз."}</p><p>Начислено ${earned} XP. Ошибок: ${wrongIds.length}.</p><button class="primary" id="again-quiz">Пройти ещё раз ↻</button><button class="secondary" id="mistakes-quiz">Повторить ошибки</button></div>`;
    document.getElementById("again-quiz").addEventListener("click", () => startQuiz());
    document.getElementById("mistakes-quiz").addEventListener("click", () => startQuiz(true));
    showToast(`Тест сохранён. Начислено ${earned} XP.`);
    quiz = null;
  }

  function renderQuizHistory() {
    const node = document.getElementById("quiz-history");
    const entries = state.quizHistory.slice(0, 8);
    node.innerHTML = entries.length ? entries.map((entry) => {
      const date = new Date(entry.at);
      const subject = entry.subject === "chem" ? "Химия" : entry.subject === "bio" ? "Биология" : "Все предметы";
      return `<div class="history-row"><span><b>${subject}</b><small>${escapeHtml(date.toLocaleString("ru-RU"))}</small></span><b>${entry.score} / ${entry.total}</b></div>`;
    }).join("") : '<div class="empty-state">Здесь появятся результаты тестов.</div>';
    document.getElementById("retry-mistakes").disabled = state.wrongQuestionIds.length === 0;
  }

  document.getElementById("start-quiz").addEventListener("click", () => startQuiz());
  document.getElementById("retry-mistakes").addEventListener("click", () => startQuiz(true));

  function renderGlossary() {
    const term = document.getElementById("glossary-search").value.trim().toLocaleLowerCase("ru");
    const subject = document.getElementById("glossary-subject").value;
    const entries = data.glossary.filter((entry) =>
      (subject === "all" || entry.subject === subject) &&
      (!term || `${entry.term} ${entry.meaning}`.toLocaleLowerCase("ru").includes(term))
    );
    document.getElementById("glossary-list").innerHTML = entries.length ? entries.map((entry) =>
      `<article class="glossary-entry"><b>${escapeHtml(entry.term)}</b><p>${escapeHtml(entry.meaning)}</p><small>${entry.subject === "chem" ? "Химия" : "Биология"}</small></article>`
    ).join("") : '<div class="empty-state">Термины не найдены.</div>';
  }

  document.getElementById("glossary-search").addEventListener("input", renderGlossary);
  document.getElementById("glossary-subject").addEventListener("change", renderGlossary);

  function renderProgress() {
    const achievements = [
      ["Первое открытие", state.studyHistory.length >= 1, "Открой первую учебную тему"],
      ["Любознательность", state.completed.length >= 5, "Изучи пять тем"],
      ["Практика", state.quizHistory.length >= 3, "Пройди три теста"],
      ["Исследователь", state.completed.length >= 10, "Изучи десять тем"]
    ];
    const average = state.quizHistory.length
      ? Math.round(state.quizHistory.reduce((sum, item) => sum + item.score / item.total, 0) / state.quizHistory.length * 100)
      : 0;
    document.getElementById("progress-overview").innerHTML = [
      ["Уровень опыта", `${Math.floor(state.xp / 100) + 1}`, `${state.xp} XP`],
      ["Изучено тем", `${state.completed.length} / ${data.topics.length}`, `${state.favorites.length} в избранном`],
      ["Пройдено тестов", String(state.quizHistory.length), `${state.wrongQuestionIds.length} ошибок к повторению`],
      ["Средний результат", `${average}%`, "по всем попыткам"]
    ].map(([label, value, note]) => `<article class="progress-card"><span>${label}</span><b>${value}</b><span>${note}</span></article>`).join("");
    const study = state.studyHistory.slice(0, 12);
    document.getElementById("study-history").innerHTML = study.length ? study.map((entry) => {
      const topic = data.topics.find((item) => item.id === entry.topicId);
      if (!topic) return "";
      return `<div class="history-row"><span><b>${escapeHtml(topic.title)}</b><small>${topic.subject === "chem" ? "Химия" : "Биология"} · ${escapeHtml(new Date(entry.at).toLocaleString("ru-RU"))}</small></span><button class="secondary" data-open-topic="${escapeHtml(topic.id)}">Открыть</button></div>`;
    }).join("") : '<div class="empty-state">Открой любую тему — она появится в истории.</div>';
    document.querySelectorAll("[data-open-topic]").forEach((button) => button.addEventListener("click", () => openTopic(button.dataset.openTopic)));
    const completedAchievements = achievements.map(([name, unlocked, description]) => `<article class="progress-card"><span>${unlocked ? "🏅 Получено" : "◇ Достижение"}</span><b>${name}</b><span>${description}</span></article>`).join("");
    document.getElementById("quiz-stats").innerHTML = completedAchievements;
    renderQuizHistory();
  }

  function exportProgress() {
    const payload = {
      app: "ChemBio Lab 9",
      version: 2,
      exportedAt: new Date().toISOString(),
      progress: state
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chembio-lab9-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Файл прогресса подготовлен.");
  }

  document.getElementById("export-progress").addEventListener("click", exportProgress);
  document.getElementById("import-progress").addEventListener("click", () => document.getElementById("import-file").click());
  document.getElementById("import-file").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      showToast("Файл слишком большой: допустимо не более 1 МБ.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => showToast("Не удалось прочитать выбранный JSON-файл.");
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const incoming = parsed?.progress;
        if (parsed?.app !== "ChemBio Lab 9" || parsed?.version !== 2 || !incoming || incoming.version !== 2 ||
            !Number.isSafeInteger(incoming.xp) || incoming.xp < 0 || !Array.isArray(incoming.completed) ||
            !Array.isArray(incoming.favorites) || !Array.isArray(incoming.quizHistory) || !Array.isArray(incoming.studyHistory)) {
          throw new Error("Файл не является резервной копией ChemBio Lab 9 или имеет неподдерживаемый формат.");
        }
        const validTopicIds = new Set(data.topics.map((topic) => topic.id));
        const validQuestionIds = new Set(data.questions.map((question) => question.id));
        const clean = defaultState();
        clean.xp = Math.max(0, Math.floor(incoming.xp));
        clean.completed = [...new Set(incoming.completed.filter((id) => validTopicIds.has(id)))];
        clean.favorites = [...new Set(incoming.favorites.filter((id) => validTopicIds.has(id)))];
        clean.studyHistory = incoming.studyHistory.filter((entry) => isHistoryEntry(entry) && validTopicIds.has(entry.topicId)).slice(0, 100);
        clean.quizHistory = incoming.quizHistory.filter(isQuizEntry).slice(0, 100);
        clean.wrongQuestionIds = Array.isArray(incoming.wrongQuestionIds) ? [...new Set(incoming.wrongQuestionIds.filter((id) => validQuestionIds.has(id)))].slice(0, 500) : [];
        clean.lastTopic = validTopicIds.has(incoming.lastTopic) ? incoming.lastTopic : null;
        clean.theme = incoming.theme === "light" ? "light" : "dark";
        Object.assign(state, clean);
        if (!saveState()) return;
        applyTheme();
        renderHome();
        renderTopics();
        renderLabs();
        renderGlossary();
        renderProgress();
        showToast("Прогресс успешно импортирован.");
      } catch (error) {
        showToast(`Импорт не выполнен: ${error.message}`);
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  });

  function renderSearchResults(query) {
    const results = document.getElementById("search-results");
    const normalized = query.trim().toLocaleLowerCase("ru");
    if (!normalized) {
      results.hidden = true;
      return;
    }
    const matches = [];
    data.topics.forEach((topic) => {
      if (JSON.stringify(topic).toLocaleLowerCase("ru").includes(normalized)) {
        matches.push({ title: topic.title, subtitle: `Тема · ${topic.subject === "chem" ? "Химия" : "Биология"}`, action: () => openTopic(topic.id) });
      }
    });
    data.glossary.forEach((entry) => {
      if (`${entry.term} ${entry.meaning}`.toLocaleLowerCase("ru").includes(normalized)) {
        matches.push({ title: entry.term, subtitle: `Термин · ${entry.subject === "chem" ? "Химия" : "Биология"}`, action: () => {
          showPage("glossary");
          document.getElementById("glossary-search").value = entry.term;
          renderGlossary();
        } });
      }
    });
    data.labs.forEach((lab) => {
      if (`${lab.title} ${lab.summary}`.toLocaleLowerCase("ru").includes(normalized)) {
        matches.push({ title: lab.title, subtitle: "Виртуальная лаборатория", action: () => {
          activeLabId = lab.id;
          renderLabs();
          showPage("labs");
        } });
      }
    });
    data.questions.forEach((question) => {
      if (`${question.question} ${question.options.join(" ")} ${question.explanation}`.toLocaleLowerCase("ru").includes(normalized)) {
        matches.push({ title: question.question, subtitle: `Вопрос тренажёра · ${question.subject === "chem" ? "Химия" : "Биология"}`, action: () => {
          document.getElementById("quiz-subject").value = question.subject;
          updateQuizTopicOptions(question.subject);
          document.getElementById("quiz-topic").value = question.topic;
          document.getElementById("quiz-difficulty").value = question.difficulty;
          showPage("quiz");
          startQuiz();
        } });
      }
    });
    results.innerHTML = matches.length ? matches.slice(0, 12).map((item, index) => `<button class="search-result" data-result="${index}">${escapeHtml(item.title)}<small>${escapeHtml(item.subtitle)}</small></button>`).join("") : '<div class="empty-state">Ничего не найдено.</div>';
    results.hidden = false;
    results.querySelectorAll("[data-result]").forEach((button) => button.addEventListener("click", () => {
      matches[Number(button.dataset.result)].action();
      results.hidden = true;
      document.getElementById("global-search").value = "";
    }));
  }

  const searchInput = document.getElementById("global-search");
  searchInput.addEventListener("input", () => renderSearchResults(searchInput.value));
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".global-search") && !event.target.closest("#search-results")) {
      document.getElementById("search-results").hidden = true;
    }
  });
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      searchInput.focus();
    }
    if (event.key === "Escape") document.getElementById("search-results").hidden = true;
  });

  applyTheme();
  renderTopics();
  renderLabs();
  renderQuizHistory();
  renderGlossary();
  renderHome();
  renderProgress();
  updateQuizTopicOptions("all");
})();
