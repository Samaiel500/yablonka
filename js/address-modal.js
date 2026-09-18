export function initAddressModal() {
  const modal = document.querySelector("#address-modal");
  const openButton = document.querySelector("[data-address-modal-open]");
  const $ = window.jQuery;
  const Fancybox = window.Fancybox;

  if (!modal || !openButton || !$ || !$.fn.select2 || !Fancybox) {
    return;
  }

  const form = modal.querySelector("[data-address-form]");
  const tabs = Array.from(modal.querySelectorAll("[data-address-tab]"));
  const panels = Array.from(modal.querySelectorAll("[data-address-panel]"));
  const confirmButton = modal.querySelector(".address-modal__confirm");
  const selects = {};
  let activeMode = "delivery";
  let confirmedSelection = null;
  let fancyboxInstance = null;

  function updateConfirmButton() {
    confirmButton.disabled = !selects[activeMode].value;
  }

  function updateClearButton(select) {
    const instance = $(select).data("select2");
    const query = instance.isOpen() ? instance.$dropdown.find(".select2-search__field").val() : "";
    select.parentElement.querySelector("[data-address-clear]").hidden = !select.value && !query;
  }

  function closeDropdowns() {
    Object.values(selects).forEach(function (select) {
      $(select).select2("close");
    });
  }

  function setActiveMode(mode, moveFocus) {
    closeDropdowns();
    activeMode = mode;

    tabs.forEach(function (tab) {
      const isActive = tab.dataset.addressTab === mode;
      tab.classList.toggle("address-tabs__tab--active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      if (isActive && moveFocus) {
        tab.focus();
      }
    });

    panels.forEach(function (panel) {
      panel.hidden = panel.dataset.addressPanel !== mode;
    });

    updateConfirmButton();
  }

  modal.querySelectorAll("[data-address-select]").forEach(function (select) {
    const mode = select.dataset.addressSelect;
    const field = select.parentElement;
    const clearButton = field.querySelector("[data-address-clear]");
    selects[mode] = select;

    $(select).select2({
      width: "100%",
      placeholder: select.dataset.placeholder,
      dropdownParent: $(field),
      minimumResultsForSearch: 0,
      language: {
        noResults: function () { return "Адреса не найдены"; },
        searching: function () { return "Поиск адресов…"; }
      }
    });

    const instance = $(select).data("select2");
    instance.$selection.attr("aria-labelledby", field.querySelector("label").getAttribute("for") + "-label");
    field.querySelector("label").id = select.id + "-label";

    $(select).on("change", function () {
      updateConfirmButton();
      updateClearButton(select);
    });

    $(select).on("select2:open", function () {
      // Select2 фиксирует прокрутку родителей для позиционирования списка.
      // Здесь список находится внутри поля и прокручивается вместе с Fancybox.
      instance.$container.closest(".fancybox__slide").off("scroll.select2." + instance.id);
      const search = instance.$dropdown.find(".select2-search__field");
      search.attr({
        "aria-label": mode === "delivery" ? "Поиск адреса доставки" : "Поиск кондитерской для самовывоза",
        "placeholder": "Начните вводить адрес"
      });
      search.off("input.addressModal").on("input.addressModal", function () {
        updateClearButton(select);
      });
      updateClearButton(select);
      search.trigger("focus");
    });

    $(select).on("select2:close", function () {
      updateClearButton(select);
    });

    // Select2 закрывает список при mousedown вне своего контейнера.
    // Кнопка очистки — соседний элемент; сохраняем список до обработки клика.
    clearButton.addEventListener("mousedown", function (event) {
      event.preventDefault();
      event.stopPropagation();
    });

    clearButton.addEventListener("click", function () {
      const wasOpen = instance.isOpen();
      $(select).select2("close");
      $(select).val(null).trigger("change");
      if (wasOpen) {
        $(select).select2("open");
      } else {
        instance.$selection.trigger("focus");
      }
    });
  });

  function closeModal() {
    closeDropdowns();
    if (fancyboxInstance) {
      fancyboxInstance.close();
    }
  }

  openButton.addEventListener("click", function () {
    if (fancyboxInstance) {
      return;
    }

    const menuToggle = document.querySelector("[data-menu-toggle]");
    if (menuToggle && menuToggle.getAttribute("aria-expanded") === "true") {
      menuToggle.click();
    }

    Object.values(selects).forEach(function (select) {
      const value = confirmedSelection && confirmedSelection.mode === select.dataset.addressSelect ? confirmedSelection.value : null;
      $(select).val(value).trigger("change");
    });

    setActiveMode(confirmedSelection ? confirmedSelection.mode : "delivery", false);
    Fancybox.show([{ src: "#address-modal", type: "inline" }], {
      mainClass: "address-fancybox",
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
      l10n: { MODAL: "Выбор адреса и способа получения", CLOSE: "Закрыть" },
      on: {
        initLayout: function (instance) {
          const dialog = instance.getContainer().closest("dialog");
          dialog.classList.add("address-fancybox__dialog");
          dialog.setAttribute("aria-labelledby", "address-modal-title");
          dialog.setAttribute("aria-describedby", "address-modal-description");
        },
        ready: function (instance) {
          fancyboxInstance = instance;
          modal.querySelector("[data-address-modal-close]").focus({ preventScroll: true });
        },
        keydown: function (instance, event) {
          // Первый Escape закрывает Select2, следующий — Fancybox.
          if (event.key === "Escape" && $(selects[activeMode]).data("select2").isOpen()) {
            event.preventDefault();
            closeDropdowns();
            $(selects[activeMode]).data("select2").$selection.trigger("focus");
          }
        },
        close: closeDropdowns,
        destroy: function () {
          fancyboxInstance = null;
        }
      }
    });
  });

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      setActiveMode(tab.dataset.addressTab, false);
    });

    tab.addEventListener("keydown", function (event) {
      let nextIndex;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") nextIndex = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;
      if (nextIndex !== undefined) {
        event.preventDefault();
        setActiveMode(tabs[nextIndex].dataset.addressTab, true);
      }
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const select = selects[activeMode];
    if (!select.value) {
      return;
    }
    const address = select.options[select.selectedIndex].textContent.trim();
    const modeLabel = activeMode === "delivery" ? "Доставка" : "Самовывоз";
    confirmedSelection = { mode: activeMode, value: select.value };
    openButton.querySelector(".address-button__text").textContent = address;
    openButton.setAttribute("aria-label", modeLabel + ": " + address + ". Изменить адрес и способ получения");
    openButton.title = modeLabel + ": " + address;
    openButton.dataset.receivingMode = activeMode;
    openButton.dataset.addressId = select.value;
    // Событие для будущей интеграции; запросы к бэкенду не выполняются.
    openButton.dispatchEvent(new CustomEvent("address:change", {
      bubbles: true,
      detail: { mode: activeMode, id: select.value, address: address }
    }));
    closeModal();
  });
}
