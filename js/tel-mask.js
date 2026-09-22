const telMasks = new WeakMap();

function normalizeRussianPhone(value) {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("8")) {
    digits = "7" + digits.slice(1);
  } else if (digits.length > 0 && digits.length <= 10) {
    digits = "7" + digits;
  }

  return digits.slice(0, 11);
}

function isWholeValueSelected(input) {
  return input.selectionStart === 0 && input.selectionEnd === input.value.length;
}

export function isTelMaskComplete(input) {
  const mask = telMasks.get(input);

  if (mask) {
    return mask.masked.isComplete;
  }

  return /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(input.value);
}

export function initTelMasks() {
  const IMask = window.IMask;

  if (typeof IMask !== "function") {
    return;
  }

  document.querySelectorAll("[data-js-tel-mask]").forEach(function (input) {
    if (telMasks.has(input)) {
      return;
    }

    const initialValue = input.value;
    let leadingEightConverted = false;
    let mask = null;

    input.addEventListener("beforeinput", function (event) {
      if (event.inputType !== "insertText") {
        return;
      }

      if (leadingEightConverted) {
        leadingEightConverted = false;
        return;
      }

      if (event.data !== "8" || input.value !== "") {
        return;
      }

      event.preventDefault();
      leadingEightConverted = true;
      mask.unmaskedValue = "7";
    });

    input.addEventListener("input", function (event) {
      if (event.inputType && event.inputType.startsWith("delete") && input.value === "") {
        leadingEightConverted = false;
      }
    });

    input.addEventListener("blur", function () {
      if (input.value === "") {
        leadingEightConverted = false;
      }
    });

    input.addEventListener("paste", function (event) {
      const pastedValue = event.clipboardData && event.clipboardData.getData("text");

      if (!pastedValue || (input.value !== "" && !isWholeValueSelected(input))) {
        return;
      }

      const normalizedValue = normalizeRussianPhone(pastedValue);

      if (!normalizedValue) {
        return;
      }

      event.preventDefault();
      leadingEightConverted = false;
      mask.unmaskedValue = normalizedValue;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    mask = IMask(input, {
      mask: "+{7} (000) 000-00-00",
      lazy: true
    });

    if (initialValue) {
      mask.unmaskedValue = normalizeRussianPhone(initialValue);
    }

    telMasks.set(input, mask);
  });
}
