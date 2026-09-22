import { isTelMaskComplete } from "./tel-mask.js";

function isRequiredFieldEmpty(field, form) {
  if (field.type === "checkbox") {
    return !field.checked;
  }

  if (field.type === "radio") {
    return !Array.from(form.elements).some(function (element) {
      return element.type === "radio" && element.name === field.name && element.checked;
    });
  }

  return field.value.trim() === "";
}

function getErrorMessage(field, form) {
  if (field.required && isRequiredFieldEmpty(field, form)) {
    return field.dataset.errorRequired || "Заполните обязательное поле.";
  }

  if (field.matches("[data-js-tel-mask]") && field.value.trim() !== "" && !isTelMaskComplete(field)) {
    return field.dataset.errorIncomplete || "Введите номер полностью.";
  }

  return "";
}

function renderFieldState(field, errorMessage) {
  const fieldContainer = field.closest("[data-js-field]");
  const errorElement = fieldContainer && fieldContainer.querySelector("[data-js-error]");
  const isValid = errorMessage === "";

  field.setAttribute("aria-invalid", String(!isValid));

  if (fieldContainer) {
    fieldContainer.toggleAttribute("data-validation-invalid", !isValid);
  }

  if (errorElement) {
    errorElement.textContent = errorMessage;
  }

  return isValid;
}

export function initFormValidation() {
  document.querySelectorAll("form[data-js-validate]").forEach(function (form) {
    const fields = Array.from(form.querySelectorAll("[required]"));
    const touchedFields = new Set();
    let submitAttempted = false;

    form.noValidate = true;

    function validateField(field) {
      return renderFieldState(field, getErrorMessage(field, form));
    }

    fields.forEach(function (field) {
      field.addEventListener("blur", function () {
        touchedFields.add(field);
        validateField(field);
      });

      const updateEvent = field.type === "checkbox" || field.type === "radio" ? "change" : "input";
      field.addEventListener(updateEvent, function () {
        if (submitAttempted || touchedFields.has(field)) {
          validateField(field);
        }
      });
    });

    form.addEventListener("submit", function (event) {
      submitAttempted = true;

      const invalidFields = fields.filter(function (field) {
        return !validateField(field);
      });

      if (invalidFields.length > 0) {
        event.preventDefault();
        invalidFields[0].focus();
        return;
      }

      fields.forEach(function (field) {
        if (field.type !== "checkbox" && field.type !== "radio") {
          field.value = field.value.trim();
        }
      });
    });
  });
}
