export function initCatalogControls() {
  const modal = document.querySelector("#catalog-controls-modal");
  const openButton = document.querySelector("[data-catalog-controls-open]");
  const categories = document.querySelector(".catalog-categories");
  const sorting = document.querySelector(".catalog-sort");
  const categoriesHome = document.querySelector("[data-catalog-categories-home]");
  const sortingHome = document.querySelector("[data-catalog-sort-home]");
  const Fancybox = window.Fancybox;

  if (!modal || !openButton || !categories || !sorting || !categoriesHome || !sortingHome || !Fancybox) {
    return;
  }

  const compactLayout = window.matchMedia("(max-width: 1199px)");
  let fancyboxInstance = null;

  function restoreControls() {
    categoriesHome.after(categories);
    sortingHome.after(sorting);
    openButton.setAttribute("aria-expanded", "false");
    fancyboxInstance = null;
  }

  openButton.addEventListener("click", function () {
    if (!compactLayout.matches || fancyboxInstance) {
      return;
    }

    modal.querySelector("[data-catalog-categories-slot]").append(categories);
    modal.querySelector("[data-catalog-sort-slot]").append(sorting);
    openButton.setAttribute("aria-expanded", "true");

    Fancybox.show([{ src: "#catalog-controls-modal", type: "inline" }], {
      mainClass: "catalog-controls-fancybox",
      triggerEl: openButton,
      closeButton: false,
      dragToClose: false,
      zoomEffect: false,
      fadeEffect: false,
      showClass: false,
      hideClass: false,
      keyboard: { Escape: "close" },
      Carousel: {
        Toolbar: false,
        Thumbs: false,
        Arrows: false
      },
      l10n: { MODAL: "Фильтры и сортировка", CLOSE: "Закрыть" },
      on: {
        initLayout: function (instance) {
          fancyboxInstance = instance;
          const dialog = instance.getContainer().closest("dialog");
          dialog.classList.add("catalog-controls-fancybox__dialog");
          dialog.setAttribute("aria-labelledby", "catalog-controls-modal-title");
        },
        ready: function () {
          modal.querySelector("[data-catalog-controls-close]").focus({ preventScroll: true });
        },
        destroy: function () {
          restoreControls();
          if (!compactLayout.matches) {
            window.requestAnimationFrame(function () {
              if (!compactLayout.matches) {
                categories.querySelector("a").focus({ preventScroll: true });
              }
            });
          }
        }
      }
    });
  });

  compactLayout.addEventListener("change", function () {
    if (!compactLayout.matches && fancyboxInstance) {
      fancyboxInstance.close();
    }
  });
}
