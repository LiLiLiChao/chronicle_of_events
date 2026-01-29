const timeline = document.getElementById("timeline");
const sidebar = document.getElementById("sidebar");
const showSidebarButton = document.getElementById("show-sidebar");
const toggleSidebarButton = document.getElementById("toggle-sidebar");
const startMonthInput = document.getElementById("start-month");
const endMonthInput = document.getElementById("end-month");
const applyMonthButton = document.getElementById("apply-month-range");
const addLineButton = document.getElementById("add-line");
const saveButton = document.getElementById("save-json");
const loadInput = document.getElementById("load-json");
const imageHeightInput = document.getElementById("image-height");
const imageHeightValue = document.getElementById("image-height-value");

const contextMenu = document.getElementById("context-menu");
const lineModal = document.getElementById("line-modal");
const lineTitleInput = document.getElementById("line-title");
const lineStartSelect = document.getElementById("line-start");
const lineEndSelect = document.getElementById("line-end");
const lineSaveButton = document.getElementById("line-save");
const lineCancelButton = document.getElementById("line-cancel");

const bubbleModal = document.getElementById("bubble-modal");
const bubbleTitleInput = document.getElementById("bubble-title");
const bubbleDescInput = document.getElementById("bubble-desc");
const bubbleImageInput = document.getElementById("bubble-image");
const bubbleSaveButton = document.getElementById("bubble-save");
const bubbleCancelButton = document.getElementById("bubble-cancel");

const state = {
  settings: {
    startYear: 2026,
    startMonth: 1,
    endYear: 2026,
    endMonth: 12,
    imageHeight: 90,
  },
  months: [],
  lines: [],
  bubbles: [],
};

let activeLineId = null;
let activeBubbleId = null;
let dragState = null;

const monthWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--month-width"), 10);

function generateId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function init() {
  startMonthInput.value = `${state.settings.startYear}-${String(state.settings.startMonth).padStart(2, "0")}`;
  endMonthInput.value = `${state.settings.endYear}-${String(state.settings.endMonth).padStart(2, "0")}`;
  imageHeightInput.value = state.settings.imageHeight;
  imageHeightValue.textContent = state.settings.imageHeight;
  document.documentElement.style.setProperty("--image-height", `${state.settings.imageHeight}px`);
  buildMonths();
  render();
}

function buildMonths() {
  const { startYear, startMonth, endYear, endMonth } = state.settings;
  const months = [];
  let currentYear = startYear;
  let currentMonth = startMonth;

  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
    months.push({
      year: currentYear,
      month: currentMonth,
      label: `${String(currentYear).slice(-2)}年${currentMonth}月`,
    });
    currentMonth += 1;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear += 1;
    }
  }

  state.months = months;
}

function renderMonths() {
  timeline.innerHTML = "";
  state.months.forEach((month, index) => {
    const column = document.createElement("div");
    column.className = "month-column";
    column.style.left = `${index * monthWidth}px`;

    const label = document.createElement("div");
    label.className = "month-label";
    label.textContent = month.label;
    label.style.left = `${index * monthWidth}px`;

    timeline.appendChild(column);
    timeline.appendChild(label);
  });

  timeline.style.width = `${state.months.length * monthWidth}px`;
}

function renderLines() {
  state.lines.forEach((line) => {
    const lineElement = document.createElement("div");
    lineElement.className = "line";
    lineElement.dataset.lineId = line.id;
    const startX = line.startIndex * monthWidth + 20;
    const endX = (line.endIndex + 1) * monthWidth - 20;
    lineElement.style.left = `${startX}px`;
    lineElement.style.width = `${Math.max(endX - startX, 40)}px`;
    lineElement.style.top = `${line.y}px`;

    const title = document.createElement("span");
    title.className = "line-title";
    title.textContent = line.title;
    lineElement.appendChild(title);

    timeline.appendChild(lineElement);
  });
}

function renderBubbles() {
  state.bubbles.forEach((bubble) => {
    const bubbleElement = document.createElement("div");
    bubbleElement.className = "bubble";
    bubbleElement.dataset.bubbleId = bubble.id;
    bubbleElement.style.left = `${bubble.x}px`;
    bubbleElement.style.top = `${bubble.y}px`;

    const title = document.createElement("h4");
    title.textContent = bubble.title || "未命名气泡";

    const description = document.createElement("p");
    description.innerHTML = formatDescription(bubble.description);

    bubbleElement.appendChild(title);

    if (bubble.image) {
      const image = document.createElement("img");
      image.src = bubble.image;
      bubbleElement.appendChild(image);
    }

    bubbleElement.appendChild(description);
    timeline.appendChild(bubbleElement);
  });
}

function render() {
  renderMonths();
  renderLines();
  renderBubbles();
}

function addLine() {
  const line = {
    id: generateId(),
    title: "新水平线",
    startIndex: 0,
    endIndex: Math.max(state.months.length - 1, 0),
    y: 180 + state.lines.length * 120,
  };
  state.lines.push(line);
  render();
}

function addBubble(line) {
  const startX = line.startIndex * monthWidth + 30;
  const bubble = {
    id: generateId(),
    lineId: line.id,
    title: "新气泡",
    description: "请输入描述",
    image: "",
    x: startX,
    y: line.y - 60,
    offsetY: -60,
  };
  state.bubbles.push(bubble);
  render();
}

function formatDescription(text = "") {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function openLineModal(line) {
  activeLineId = line.id;
  lineTitleInput.value = line.title;
  lineStartSelect.innerHTML = "";
  lineEndSelect.innerHTML = "";
  state.months.forEach((month, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = month.label;
    lineStartSelect.appendChild(option);
    lineEndSelect.appendChild(option.cloneNode(true));
  });
  lineStartSelect.value = line.startIndex;
  lineEndSelect.value = line.endIndex;
  lineModal.classList.remove("hidden");
}

function openBubbleModal(bubble) {
  activeBubbleId = bubble.id;
  bubbleTitleInput.value = bubble.title;
  bubbleDescInput.value = bubble.description;
  bubbleImageInput.value = "";
  bubbleModal.classList.remove("hidden");
}

function closeModals() {
  lineModal.classList.add("hidden");
  bubbleModal.classList.add("hidden");
}

function showMenu(items, x, y) {
  contextMenu.innerHTML = "";
  items.forEach((item) => {
    const button = document.createElement("button");
    button.textContent = item.label;
    button.addEventListener("click", () => {
      item.action();
      hideMenu();
    });
    contextMenu.appendChild(button);
  });
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.remove("hidden");
}

function hideMenu() {
  contextMenu.classList.add("hidden");
}

function updateLineBubbles(line) {
  state.bubbles
    .filter((bubble) => bubble.lineId === line.id)
    .forEach((bubble) => {
      bubble.y = line.y + (bubble.offsetY ?? 0);
    });
}

function updateOffsets() {
  state.lines.forEach((line) => {
    state.bubbles
      .filter((bubble) => bubble.lineId === line.id)
      .forEach((bubble) => {
        bubble.offsetY = bubble.y - line.y;
      });
  });
}

function clampLineRange(line) {
  const maxIndex = state.months.length - 1;
  line.startIndex = Math.max(0, Math.min(line.startIndex, maxIndex));
  line.endIndex = Math.max(line.startIndex, Math.min(line.endIndex, maxIndex));
}

function applyMonthRange() {
  const [startYear, startMonth] = startMonthInput.value.split("-").map(Number);
  const [endYear, endMonth] = endMonthInput.value.split("-").map(Number);
  if (!startYear || !endYear) {
    return;
  }
  state.settings.startYear = startYear;
  state.settings.startMonth = startMonth;
  state.settings.endYear = endYear;
  state.settings.endMonth = endMonth;
  buildMonths();
  state.lines.forEach(clampLineRange);
  render();
}

function handlePointerDown(event) {
  const lineElement = event.target.closest(".line");
  const bubbleElement = event.target.closest(".bubble");

  if (lineElement) {
    const lineId = lineElement.dataset.lineId;
    const line = state.lines.find((item) => item.id === lineId);
    if (!line) return;
    dragState = {
      type: "line",
      id: lineId,
      startY: event.clientY,
      initialY: line.y,
    };
    lineElement.style.cursor = "grabbing";
  }

  if (bubbleElement) {
    const bubbleId = bubbleElement.dataset.bubbleId;
    const bubble = state.bubbles.find((item) => item.id === bubbleId);
    if (!bubble) return;
    dragState = {
      type: "bubble",
      id: bubbleId,
      startX: event.clientX,
      startY: event.clientY,
      initialX: bubble.x,
      initialY: bubble.y,
    };
    bubbleElement.style.cursor = "grabbing";
  }
}

function handlePointerMove(event) {
  if (!dragState) return;
  if (dragState.type === "line") {
    const line = state.lines.find((item) => item.id === dragState.id);
    if (!line) return;
    const deltaY = event.clientY - dragState.startY;
    line.y = dragState.initialY + deltaY;
    updateLineBubbles(line);
    render();
  }
  if (dragState.type === "bubble") {
    const bubble = state.bubbles.find((item) => item.id === dragState.id);
    if (!bubble) return;
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    bubble.x = dragState.initialX + deltaX;
    bubble.y = dragState.initialY + deltaY;
    const line = state.lines.find((item) => item.id === bubble.lineId);
    if (line) {
      bubble.offsetY = bubble.y - line.y;
    }
    render();
  }
}

function handlePointerUp() {
  dragState = null;
  updateOffsets();
}

function handleContextMenu(event) {
  const lineElement = event.target.closest(".line");
  const bubbleElement = event.target.closest(".bubble");
  if (!lineElement && !bubbleElement) {
    hideMenu();
    return;
  }
  event.preventDefault();

  if (lineElement) {
    const lineId = lineElement.dataset.lineId;
    const line = state.lines.find((item) => item.id === lineId);
    if (!line) return;
    showMenu(
      [
        { label: "编辑", action: () => openLineModal(line) },
        {
          label: "删除",
          action: () => {
            state.lines = state.lines.filter((item) => item.id !== lineId);
            state.bubbles = state.bubbles.filter((item) => item.lineId !== lineId);
            render();
          },
        },
        { label: "添加气泡", action: () => addBubble(line) },
      ],
      event.clientX,
      event.clientY
    );
  }

  if (bubbleElement) {
    const bubbleId = bubbleElement.dataset.bubbleId;
    const bubble = state.bubbles.find((item) => item.id === bubbleId);
    if (!bubble) return;
    showMenu(
      [
        { label: "编辑", action: () => openBubbleModal(bubble) },
        {
          label: "删除",
          action: () => {
            state.bubbles = state.bubbles.filter((item) => item.id !== bubbleId);
            render();
          },
        },
      ],
      event.clientX,
      event.clientY
    );
  }
}

function saveJson() {
  const payload = {
    settings: state.settings,
    lines: state.lines,
    bubbles: state.bubbles,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "timeline.json";
  link.click();
  URL.revokeObjectURL(url);
}

function loadJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const data = JSON.parse(reader.result);
    state.settings = data.settings;
    state.lines = data.lines || [];
    state.bubbles = data.bubbles || [];
    startMonthInput.value = `${state.settings.startYear}-${String(state.settings.startMonth).padStart(2, "0")}`;
    endMonthInput.value = `${state.settings.endYear}-${String(state.settings.endMonth).padStart(2, "0")}`;
    imageHeightInput.value = state.settings.imageHeight || 90;
    imageHeightValue.textContent = imageHeightInput.value;
    document.documentElement.style.setProperty("--image-height", `${imageHeightInput.value}px`);
    buildMonths();
    state.lines.forEach(clampLineRange);
    updateOffsets();
    render();
  };
  reader.readAsText(file);
}

function updateImageHeight() {
  const value = Number(imageHeightInput.value);
  state.settings.imageHeight = value;
  imageHeightValue.textContent = value;
  document.documentElement.style.setProperty("--image-height", `${value}px`);
}

function loadImageAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

addLineButton.addEventListener("click", addLine);
applyMonthButton.addEventListener("click", applyMonthRange);
imageHeightInput.addEventListener("input", updateImageHeight);
saveButton.addEventListener("click", saveJson);
loadInput.addEventListener("change", loadJson);

lineSaveButton.addEventListener("click", () => {
  const line = state.lines.find((item) => item.id === activeLineId);
  if (!line) return;
  line.title = lineTitleInput.value.trim() || "水平线";
  line.startIndex = Number(lineStartSelect.value);
  line.endIndex = Number(lineEndSelect.value);
  if (line.endIndex < line.startIndex) {
    line.endIndex = line.startIndex;
  }
  closeModals();
  render();
});

lineCancelButton.addEventListener("click", closeModals);

bubbleSaveButton.addEventListener("click", async () => {
  const bubble = state.bubbles.find((item) => item.id === activeBubbleId);
  if (!bubble) return;
  bubble.title = bubbleTitleInput.value.trim() || "气泡";
  bubble.description = bubbleDescInput.value.trim();
  if (bubbleImageInput.files[0]) {
    bubble.image = await loadImageAsBase64(bubbleImageInput.files[0]);
  }
  closeModals();
  render();
});

bubbleCancelButton.addEventListener("click", closeModals);

window.addEventListener("click", (event) => {
  if (!contextMenu.contains(event.target)) {
    hideMenu();
  }
});

window.addEventListener("contextmenu", handleContextMenu);
window.addEventListener("pointerdown", handlePointerDown);
window.addEventListener("pointermove", handlePointerMove);
window.addEventListener("pointerup", handlePointerUp);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModals();
    hideMenu();
  }
});

toggleSidebarButton.addEventListener("click", () => {
  sidebar.classList.add("hidden");
  showSidebarButton.classList.remove("hidden");
});

showSidebarButton.addEventListener("click", () => {
  sidebar.classList.remove("hidden");
  showSidebarButton.classList.add("hidden");
});

init();
