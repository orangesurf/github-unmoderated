// ---- Configuration ----
const BUTTON_ID = "__gh_expand_hidden_btn__";

// Selectors for things we can expand
const SELECTORS = {
  minimizedCommentSummary:
    ".minimized-comment details:not([open]) > summary, " +
    ".minimized-comment--comment details:not([open]) > summary",
  timelineButtons:
    ".ajax-pagination-form button, .ajax-pagination-btn, form.ajax-pagination-form button"
};

// ---- Utilities ----
const qsAll = (sel) => Array.from(document.querySelectorAll(sel));

function hasHiddenContent() {
  const hasMinimized = qsAll(SELECTORS.minimizedCommentSummary).length > 0;
  const hasTimeline = qsAll(SELECTORS.timelineButtons).length > 0;
  return hasMinimized || hasTimeline;
}

function expandOnce() {
  // Expand minimized/hidden comments
  qsAll(SELECTORS.minimizedCommentSummary).forEach((el) => {
    try { el.click(); } catch {}
  });

  // Click timeline “Load more” buttons
  qsAll(SELECTORS.timelineButtons).forEach((btn) => {
    if (btn.dataset.__gh_clicked) return;
    btn.dataset.__gh_clicked = "1";
    try { btn.click(); } catch {}
  });
}

function createButton() {
  // Avoid duplicates
  let btn = document.getElementById(BUTTON_ID);
  if (btn) return btn;

  btn = document.createElement("button");
  btn.id = BUTTON_ID;
  btn.type = "button";
  btn.textContent = "Expand hidden items";
  Object.assign(btn.style, {
    position: "fixed",
    right: "16px",
    bottom: "16px",
    zIndex: "2147483647",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(31,35,40,0.15)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
    background: "#1f883d",
    color: "#fff",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
    fontSize: "14px",
    cursor: "pointer",
    opacity: "0.95"
  });

  btn.addEventListener("mouseenter", () => (btn.style.opacity = "1"));
  btn.addEventListener("mouseleave", () => (btn.style.opacity = "0.95"));

  btn.addEventListener("click", () => {
    expandOnce();
    removeButton();
  });

  document.documentElement.appendChild(btn);
  return btn;
}

function showButtonIfNeeded() {
  if (hasHiddenContent()) {
    const btn = createButton();
    btn.style.display = "inline-block";
  } else {
    removeButton();
  }
}

function removeButton() {
  const btn = document.getElementById(BUTTON_ID);
  if (btn) btn.remove();
}

// ---- Bootstrapping ----
function init() {
  // ✅ Correct domain check
  if (location.hostname !== "github.com" || !location.pathname.startsWith("/bitcoin/")) return;

  // Initial check
  showButtonIfNeeded();

  // Re-check after GitHub PJAX/Turbo navigations
  document.addEventListener("pjax:end", () => setTimeout(showButtonIfNeeded, 150));
  document.addEventListener("turbo:load", () => setTimeout(showButtonIfNeeded, 150));

  // Watch DOM for dynamically added hidden content
  const observer = new MutationObserver(() => {
    if (observer._pending) return;
    observer._pending = true;
    setTimeout(() => {
      observer._pending = false;
      showButtonIfNeeded();
    }, 200);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // One more delayed check for late DOM settling
  setTimeout(showButtonIfNeeded, 500);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
