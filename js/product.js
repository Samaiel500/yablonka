export function initProductGallery() {
  const gallery = document.querySelector("[data-product-gallery]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (gallery && typeof Swiper !== "undefined") {
    const buttons = Array.from(gallery.querySelectorAll("[data-product-thumbnail]"));
    const thumbnails = new Swiper(gallery.querySelector("[data-product-thumbnails]"), {
      slidesPerView: 4,
      spaceBetween: 10,
      watchSlidesProgress: true,
      watchOverflow: true,
      breakpoints: {
        768: { spaceBetween: 14 }
      },
      a11y: { enabled: false }
    });

    function updateThumbnails(slider) {
      buttons.forEach(function (button, index) {
        if (index === slider.activeIndex) {
          button.setAttribute("aria-current", "true");
        } else {
          button.removeAttribute("aria-current");
        }
      });
    }

    const slider = new Swiper(gallery.querySelector("[data-product-slider]"), {
      slidesPerView: 1,
      speed: reducedMotion.matches ? 0 : 400,
      grabCursor: true,
      thumbs: { swiper: thumbnails },
      a11y: {
        containerMessage: "Фотографии торта Яблонька",
        containerRoleDescriptionMessage: "Слайдер",
        itemRoleDescriptionMessage: "Слайд",
        slideLabelMessage: "Фотография {{index}} из {{slidesLength}}"
      },
      on: {
        init: updateThumbnails,
        slideChange: updateThumbnails
      }
    });

    buttons.forEach(function (button, index) {
      button.addEventListener("click", function () {
        slider.slideTo(index);
      });
    });

    gallery.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const thumbnail = event.target.closest("[data-product-thumbnail]");
      const currentIndex = thumbnail ? buttons.indexOf(thumbnail) : slider.activeIndex;
      const index = Math.max(0, Math.min(buttons.length - 1, currentIndex + direction));
      slider.slideTo(index);
      if (thumbnail) {
        buttons[index].focus();
      }
    });

    reducedMotion.addEventListener("change", function (event) {
      slider.params.speed = event.matches ? 0 : 400;
    });
  }
}

export function initProductQuantity() {
  const quantity = document.querySelector("[data-product-quantity]");
  if (!quantity) {
    return;
  }

  const input = quantity.querySelector("[data-quantity-input]");
  const minus = quantity.querySelector("[data-quantity-minus]");
  const plus = quantity.querySelector("[data-quantity-plus]");
  let value = 1n;

  function setValue(nextValue) {
    value = nextValue < 1n ? 1n : nextValue;
    input.value = String(value);
    input.setAttribute("aria-valuenow", input.value);
    input.style.width = Math.min(140, Math.max(57, input.value.length * 20 + 18)) + "px";
    minus.disabled = value === 1n;
  }

  function readValue() {
    const text = input.value.trim();
    return /^\d+$/.test(text) ? BigInt(text) : value;
  }

  input.addEventListener("input", function () {
    if (input.value === "") {
      return;
    }
    const text = input.value.trim();
    if (!/^\d+$/.test(text) || BigInt(text) < 1n) {
      setValue(/^\d+$/.test(text) ? 1n : value);
      return;
    }
    value = BigInt(text);
    input.setAttribute("aria-valuenow", String(value));
    input.style.width = Math.min(140, Math.max(57, text.length * 20 + 18)) + "px";
    minus.disabled = value === 1n;
  });

  input.addEventListener("change", function () {
    setValue(readValue());
  });

  input.addEventListener("blur", function () {
    setValue(readValue());
  });

  input.addEventListener("keydown", function (event) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      setValue(readValue() + (event.key === "ArrowUp" ? 1n : -1n));
    }
  });

  minus.addEventListener("click", function () {
    setValue(readValue() - 1n);
  });

  plus.addEventListener("click", function () {
    setValue(readValue() + 1n);
  });

  setValue(value);
}
