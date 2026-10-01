export var SHOPS = [
  {
    store_name: "магазин в ТЦ Невский центр",
    address: "Санкт-Петербург, Невский проспект, 114-116, метро «Площадь Восстания»",
    working_hours: "Ежедневно с 10:00 до 22:00",
    phone: "8 (812) 244-55-10 доб. 9401",
    coordinates: [59.932059, 30.359273],
    descr: "2 этаж"
  },
  {
    store_name: "магазин в ТЦ Outlet Village Pulkovo",
    address: "п. Шушары, Пулковское шоссе, 60, корпус 1",
    working_hours: "Ежедневно с 10:00 до 22:00",
    phone: "8 (812) 244-55-10 доб. 9408",
    coordinates: [59.793129, 30.332284],
    descr: "Секция 8в03"
  },
  {
    store_name: "корнер в универмаге Au Pont Rouge",
    address: "Санкт-петербург, набережная реки Мойки, д. 73",
    working_hours: "Ежедневно с 10:00 до 22:00",
    phone: "+79213724790",
    coordinates: [59.933352, 30.314146],
    descr: "2 этаж"
  }
];

export function initAddressModal() {
  const API_KEY_YANDEX_MAP = 'a02dbd17-1592-482f-9355-d3824a629892';
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
  const houseInput = modal.querySelector("[data-address-house]");
  const mapModal = document.querySelector("#pickup-map");
  const mapButton = modal.querySelector("[data-pickup-map-open]");
  if (!form || !confirmButton || !houseInput) {
    return;
  }

  const selects = {};
  let activeMode = "delivery";
  let confirmedSelection = null;
  let selectedDeliveryStreet = null;
  let fancyboxInstance = null;
  let mapFancyboxInstance = null;
  let yandexMap = null;
  let yandexMapsPromise = null;
  let activeShopIndex = null;
  let focusConfirmAfterMap = false;
  const mapMarkerUrl = new URL("../images/pickup-map-marker.svg", import.meta.url).href;
  const mapShopIndexes = SHOPS.reduce(function (indexes, shop, index) {
    if (Array.isArray(shop.coordinates) && shop.coordinates.length === 2 &&
      shop.coordinates.every(Number.isFinite)) {
      indexes.push(index);
    }
    return indexes;
  }, []);

  const pickupSelect = modal.querySelector('[data-address-select="pickup"]');
  if (pickupSelect) {
    pickupSelect.replaceChildren(new Option("", ""));
    SHOPS.forEach(function (shop, index) {
      pickupSelect.add(new Option(shop.address, String(index)));
    });
  }

  function isDeliveryValid() {
    return selectedDeliveryStreet &&
      selects.delivery.value === selectedDeliveryStreet.id &&
      /^[0-9]+$/.test(houseInput.value);
  }

  function isPickupValid() {
    const value = selects.pickup.value;
    return value !== "" && Number.isInteger(Number(value)) && Boolean(SHOPS[Number(value)]);
  }

  function updateConfirmButton() {
    confirmButton.disabled = activeMode === "delivery"
      ? !isDeliveryValid()
      : !isPickupValid();
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

  function loadYandexMaps() {
    if (window.ymaps) {
      return Promise.resolve(window.ymaps);
    }
    if (yandexMapsPromise) {
      return yandexMapsPromise;
    }

    const script = document.createElement("script");
    yandexMapsPromise = new Promise(function (resolve, reject) {
      script.src = "https://api-maps.yandex.ru/2.1/?apikey=" + encodeURIComponent(API_KEY_YANDEX_MAP) + "&lang=ru_RU";
      script.async = true;
      script.onload = function () {
        if (!window.ymaps) {
          reject(new Error("Яндекс Карты не загрузились"));
          return;
        }
        window.ymaps.ready(function () { resolve(window.ymaps); });
      };
      script.onerror = function () { reject(new Error("Яндекс Карты не загрузились")); };
      document.head.append(script);
    }).catch(function (error) {
      script.remove();
      yandexMapsPromise = null;
      throw error;
    });
    return yandexMapsPromise;
  }

  function showShop(index) {
    const shop = SHOPS[index];
    if (!mapModal || !shop) {
      return;
    }
    activeShopIndex = index;
    const card = mapModal.querySelector("[data-pickup-map-card]");
    card.querySelector("[data-pickup-shop-name]").textContent = shop.store_name;
    card.querySelector("[data-pickup-shop-address]").textContent = shop.address;
    card.querySelector("[data-pickup-shop-hours]").textContent = shop.working_hours;
    card.querySelector("[data-pickup-shop-phone]").textContent = shop.phone;
    card.querySelector("[data-pickup-shop-descr]").textContent = shop.descr;
    card.hidden = false;
    if (yandexMap && Array.isArray(shop.coordinates)) {
      yandexMap.panTo(shop.coordinates, { flying: true });
    }
  }

  function renderPickupMap(ymaps) {
    const canvas = mapModal.querySelector("[data-pickup-map-canvas]");
    if (!mapShopIndexes.length) {
      throw new Error("Нет координат пунктов самовывоза");
    }

    yandexMap = new ymaps.Map(canvas, {
      center: SHOPS[mapShopIndexes[0]].coordinates,
      zoom: 11,
      controls: ["zoomControl"]
    });
    mapShopIndexes.forEach(function (index) {
      const placemark = new ymaps.Placemark(SHOPS[index].coordinates, {}, {
        iconLayout: "default#image",
        iconImageHref: mapMarkerUrl,
        iconImageSize: [40, 52],
        iconImageOffset: [-20, -52],
        openBalloonOnClick: false
      });
      placemark.events.add("click", function () { showShop(index); });
      yandexMap.geoObjects.add(placemark);
    });
    if (mapShopIndexes.length > 1) {
      yandexMap.setBounds(yandexMap.geoObjects.getBounds(), {
        checkZoomRange: true,
        zoomMargin: 72
      });
    }
  }

  if (mapModal && mapButton && mapModal.querySelector("[data-pickup-map-shell]")) {
    const mapShell = mapModal.querySelector("[data-pickup-map-shell]");
    mapShell.addEventListener("keydown", function (event) {
      if (event.target !== mapShell || !mapShopIndexes.length) {
        return;
      }
      if (event.key === "Enter" && activeShopIndex !== null) {
        event.preventDefault();
        mapModal.querySelector("[data-pickup-map-select]").focus();
        return;
      }
      if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) {
        return;
      }
      event.preventDefault();
      const current = mapShopIndexes.indexOf(activeShopIndex);
      let next = current;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = mapShopIndexes.length - 1;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (current + 1) % mapShopIndexes.length;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        next = current === -1 ? mapShopIndexes.length - 1 : (current + mapShopIndexes.length - 1) % mapShopIndexes.length;
      }
      showShop(mapShopIndexes[next]);
    });

    mapModal.querySelector("[data-pickup-map-select]").addEventListener("click", function () {
      if (activeShopIndex === null || !SHOPS[activeShopIndex]) {
        return;
      }
      $(selects.pickup).val(String(activeShopIndex)).trigger("change");
      focusConfirmAfterMap = true;
      mapFancyboxInstance.close();
    });

    mapButton.addEventListener("click", function () {
      if (activeMode !== "pickup" || mapFancyboxInstance) {
        return;
      }
      closeDropdowns();
      activeShopIndex = null;
      focusConfirmAfterMap = false;
      mapModal.querySelector("[data-pickup-map-card]").hidden = true;

      Fancybox.show([{ src: "#pickup-map", type: "inline" }], {
        mainClass: "pickup-map-fancybox",
        triggerEl: mapButton,
        placeFocusBack: false,
        closeButton: false,
        dragToClose: false,
        zoomEffect: false,
        fadeEffect: false,
        showClass: false,
        hideClass: false,
        keyboard: { Escape: "close" },
        Carousel: { Toolbar: false, Thumbs: false, Arrows: false },
        l10n: { MODAL: "Карта пунктов самовывоза", CLOSE: "Закрыть" },
        on: {
          initLayout: function (instance) {
            const dialog = instance.getContainer().closest("dialog");
            dialog.setAttribute("aria-labelledby", "pickup-map-title");
          },
          ready: function (instance) {
            mapFancyboxInstance = instance;
            mapModal.querySelector("[data-pickup-map-close]").focus({ preventScroll: true });
            const status = mapModal.querySelector("[data-pickup-map-status]");
            status.textContent = "Загружаем карту…";
            status.hidden = false;
            loadYandexMaps().then(function (ymaps) {
              if (mapFancyboxInstance !== instance) {
                return;
              }
              renderPickupMap(ymaps);
              status.hidden = true;
            }).catch(function () {
              if (mapFancyboxInstance === instance) {
                status.textContent = "Не удалось загрузить карту. Закройте ее и выберите адрес в выпадающем списке.";
              }
            });
          },
          close: function () {
            mapFancyboxInstance = null;
          },
          destroy: function () {
            if (yandexMap) {
              yandexMap.destroy();
              yandexMap = null;
            }
            if (fancyboxInstance) {
              const focusTarget = focusConfirmAfterMap ? confirmButton : mapButton;
              window.setTimeout(function () {
                if (fancyboxInstance && !mapFancyboxInstance) {
                  focusTarget.focus({ preventScroll: true });
                }
              }, 0);
            }
            focusConfirmAfterMap = false;
          }
        }
      });
    });
  }

  function setActiveMode(mode, moveFocus) {
    closeDropdowns();
    activeMode = mode;
    selects.delivery.required = mode === "delivery";
    houseInput.required = mode === "delivery";

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
      ...(mode === "delivery" ? {
        minimumInputLength: 1,
        ajax: {
          url: "https://palich.ru/local/ajax/streets.php",
          dataType: "json",
          delay: 250,
          data: function (params) {
            return { type: "search", query: params.term };
          },
          processResults: function (response) {
            return {
              results: (Array.isArray(response) ? response : [])
                .filter(function (street) {
                  return street && typeof street.full === "string" && street.full.trim();
                })
                .map(function (street) {
                  return {
                    id: street.full,
                    text: street.full,
                    prefix: street.prefix,
                    main: street.main,
                    gps: street.gps
                  };
                })
            };
          }
        }
      } : {}),
      language: {
        noResults: function () { return "Адреса не найдены"; },
        searching: function () { return "Поиск адресов…"; },
        inputTooShort: function () { return "Начните вводить улицу"; },
        errorLoading: function () { return "Не удалось загрузить адреса. Повторите поиск"; }
      }
    });

    const instance = $(select).data("select2");
    instance.$selection.attr("aria-labelledby", field.querySelector("label").getAttribute("for") + "-label");
    field.querySelector("label").id = select.id + "-label";

    $(select).on("change", function () {
      updateConfirmButton();
      updateClearButton(select);
    });

    if (mode === "delivery") {
      $(select).on("select2:select", function (event) {
        selectedDeliveryStreet = event.params.data;
        updateConfirmButton();
      });
    }

    $(select).on("select2:open", function () {
      instance.$container.closest(".fancybox__slide").off("scroll.select2." + instance.id);
      const search = instance.$dropdown.find(".select2-search__field");
      search.attr({
        "aria-label": mode === "delivery" ? "Поиск адреса доставки" : "Поиск кондитерской для самовывоза",
        "placeholder": "Начните вводить адрес"
      });
      search.off("input.addressModal").on("input.addressModal", function () {
        if (mode === "delivery" && selectedDeliveryStreet) {
          selectedDeliveryStreet = null;
          $(select).val(null).trigger("change");
        }
        updateClearButton(select);
      });
      updateClearButton(select);
      search.trigger("focus");
    });

    $(select).on("select2:close", function () {
      updateClearButton(select);
    });

    clearButton.addEventListener("mousedown", function (event) {
      event.preventDefault();
      event.stopPropagation();
    });

    clearButton.addEventListener("click", function () {
      const wasOpen = instance.isOpen();
      $(select).select2("close");
      if (mode === "delivery") {
        selectedDeliveryStreet = null;
      }
      $(select).val(null).trigger("change");
      if (wasOpen) {
        $(select).select2("open");
      } else {
        instance.$selection.trigger("focus");
      }
    });
  });

  houseInput.addEventListener("input", function () {
    houseInput.value = houseInput.value.replace(/\D/g, "");
    updateConfirmButton();
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
    selectedDeliveryStreet = confirmedSelection && confirmedSelection.mode === "delivery"
      ? confirmedSelection.street
      : null;
    houseInput.value = selectedDeliveryStreet ? confirmedSelection.house : "";

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
    if (activeMode === "delivery" ? !isDeliveryValid() : !isPickupValid()) {
      return;
    }
    const streetAddress = select.options[select.selectedIndex].textContent.trim();
    const house = activeMode === "delivery" ? houseInput.value : null;
    const address = house ? streetAddress + ", д. " + house : streetAddress;
    const modeLabel = activeMode === "delivery" ? "Доставка" : "Самовывоз";
    confirmedSelection = {
      mode: activeMode,
      value: select.value,
      street: activeMode === "delivery" ? selectedDeliveryStreet : null,
      house: house
    };
    openButton.querySelector(".address-button__text").textContent = address;
    openButton.setAttribute("aria-label", modeLabel + ": " + address + ". Изменить адрес и способ получения");
    openButton.title = modeLabel + ": " + address;
    openButton.dataset.receivingMode = activeMode;
    openButton.dataset.addressId = select.value;
    
    openButton.dispatchEvent(new CustomEvent("address:change", {
      bubbles: true,
      detail: { mode: activeMode, id: select.value, address: address, house: house }
    }));
    closeModal();
  });
}
