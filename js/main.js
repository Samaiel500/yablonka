export function initMenu() {
  const header = document.querySelector("[data-site-header-root]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const navigation = document.querySelector("#site-navigation");

  if (!header || !toggle || !navigation) {
    return;
  }

  function setMenuState(isOpen) {
    header.classList.toggle("site-header--menu-open", isOpen);
    document.body.classList.toggle("body--menu-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
  }

  toggle.addEventListener("click", function () {
    setMenuState(toggle.getAttribute("aria-expanded") !== "true");
  });

  navigation.addEventListener("click", function (event) {
    if (event.target.closest("a")) {
      setMenuState(false);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !event.defaultPrevented && toggle.getAttribute("aria-expanded") === "true") {
      setMenuState(false);
      toggle.focus();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 1200) {
      setMenuState(false);
    }
  });
}

export function initSearch() {
  document.querySelectorAll(".site-search").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
    });
  });
}
