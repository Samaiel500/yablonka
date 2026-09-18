const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function paginationOptions(element, bulletClass, activeClass, lockClass) {
  return {
    el: element,
    clickable: true,
    bulletClass: bulletClass,
    bulletActiveClass: activeClass,
    lockClass: lockClass,
    renderBullet: function (index, className) {
      return '<button class="' + className + '" type="button" aria-label="Перейти к слайду ' + (index + 1) + '"></button>';
    }
  };
}

function initHeroSlider() {
  const element = document.querySelector("[data-hero-slider]");
  if (!element || typeof Swiper === "undefined") {
    return null;
  }

  const hero = new Swiper(element, {
    loop: true,
    speed: reducedMotion.matches ? 0 : 500,
    slidesPerView: 1,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true
    },
    pagination: paginationOptions(
      document.querySelector("[data-hero-pagination]"),
      "home-hero__bullet",
      "home-hero__bullet--active",
      "home-hero__pagination--locked"
    ),
    a11y: {
      containerMessage: "Акции кондитерских Яблонька",
      containerRoleDescriptionMessage: "Слайдер",
      itemRoleDescriptionMessage: "Слайд",
      slideLabelMessage: "{{index}} из {{slidesLength}}",
      paginationBulletMessage: "Перейти к слайду {{index}}"
    }
  });

  if (reducedMotion.matches) {
    hero.autoplay.stop();
  }

  reducedMotion.addEventListener("change", function (event) {
    hero.params.speed = event.matches ? 0 : 500;
    if (event.matches) {
      hero.autoplay.stop();
    } else {
      hero.autoplay.start();
    }
  });

  return hero;
}

function initNewsSlider() {
  const element = document.querySelector("[data-news-slider]");
  if (!element || typeof Swiper === "undefined") {
    return null;
  }

  return new Swiper(element, {
    slidesPerView: 1.15,
    spaceBetween: 16,
    speed: reducedMotion.matches ? 0 : 400,
    watchOverflow: true,
    breakpoints: {
      768: { slidesPerView: 2.2, spaceBetween: 20 },
      1024: { slidesPerView: 2.5, spaceBetween: 20 },
      1200: { slidesPerView: 4, spaceBetween: 20 }
    },
    pagination: paginationOptions(
      document.querySelector("[data-news-pagination]"),
      "home-carousel-pagination__bullet",
      "home-carousel-pagination__bullet--active",
      "home-carousel-pagination--locked"
    ),
    a11y: {
      containerMessage: "Новости и акции",
      containerRoleDescriptionMessage: "Слайдер",
      itemRoleDescriptionMessage: "Слайд",
      slideLabelMessage: "{{index}} из {{slidesLength}}",
      paginationBulletMessage: "Перейти к новости {{index}}"
    }
  });
}

function initProductsSlider() {
  const element = document.querySelector("[data-products-slider]");
  if (!element || typeof Swiper === "undefined") {
    return null;
  }

  return new Swiper(element, {
    slidesPerView: "auto",
    spaceBetween: 16,
    speed: reducedMotion.matches ? 0 : 400,
    watchOverflow: true,
    breakpoints: {
      768: { spaceBetween: 18 }
    },
    pagination: paginationOptions(
      document.querySelector("[data-products-pagination]"),
      "home-carousel-pagination__bullet",
      "home-carousel-pagination__bullet--active",
      "home-carousel-pagination--locked"
    ),
    a11y: {
      containerMessage: "Популярные товары",
      containerRoleDescriptionMessage: "Слайдер",
      itemRoleDescriptionMessage: "Слайд",
      slideLabelMessage: "{{index}} из {{slidesLength}}",
      paginationBulletMessage: "Перейти к товару {{index}}"
    }
  });
}

function initSliderKeyboard(slider) {
  if (!slider) {
    return;
  }

  slider.el.addEventListener("keydown", function (event) {
    if (event.target.matches("input, select, textarea")) {
      return;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      slider[event.key === "ArrowRight" ? "slideNext" : "slidePrev"]();
    }
  });
}

export function initHomeSliders() {
  [initHeroSlider(), initNewsSlider(), initProductsSlider()].forEach(initSliderKeyboard);
}
