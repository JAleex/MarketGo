import Swal from "sweetalert2";
import type { SweetAlertIcon } from "sweetalert2";
import "../../styles/Alerts/Alerts.css";

type AlertType = "success" | "error" | "warning" | "info" | "question" | "pending";

interface AlertOptions {
  title?: string;
  text: string;
  icon?: SweetAlertIcon;
  timer?: number;
  confirmText?: string;
}

interface DetailRow {
  label: string;
  value?: string | number | null;
  type?: "text" | "badge" | "long";
  variant?: "ok" | "bad" | "neutral";
}

interface DetailOptions {
  title: string;
  rows: DetailRow[];
  confirmText?: string;
  cancelText?: string;
  onCancel?: () => void;
}

interface InputOptions {
  title?: string;
  text?: string;
  inputPlaceholder?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  inputValidator?: (value: string) => string | undefined;
}

const baseConfig = {
  confirmButtonColor: "#000000",
  background: "#ffffff",
};

export const Alerts = {
  success(text: string, title = "Éxito") {
    return Swal.fire({
      ...baseConfig,
      icon: "success",
      title,
      text,
      timer: 2200,
      showConfirmButton: false,
    });
  },

  error(text: string, title = "Error") {
    return Swal.fire({
      ...baseConfig,
      icon: "error",
      title,
      text,
      confirmButtonText: "Cerrar",
    });
  },

  warning(text: string, title = "Advertencia") {
    return Swal.fire({
      ...baseConfig,
      icon: "warning",
      title,
      text,
      confirmButtonText: "Entendido",
    });
  },

  info(text: string, title = "Información") {
    return Swal.fire({
      ...baseConfig,
      icon: "info",
      title,
      text,
      timer: 2500,
      showConfirmButton: false,
    });
  },

  pending(text = "Procesando, por favor espere...") {
    return Swal.fire({
      ...baseConfig,
      title: "Espere",
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  },

  confirm(
    text: string,
    options?: {
      title?: string;
      confirmText?: string;
      cancelText?: string;
      showCancelButton?: boolean;
    }
  ) {
    return Swal.fire({
      ...baseConfig,
      icon: "question",
      title: options?.title ?? "¿Está seguro?",
      text,
      showCancelButton: options?.showCancelButton,
      confirmButtonText: options?.confirmText ?? "Sí, continuar",
      cancelButtonText: options?.cancelText ?? "Cancelar",
    });
  },

  detail(options: DetailOptions) {
    const html = `
      <div class="ev-clean-body">
        ${options.rows
          .map((row, index) => {
            const value = row.value ?? "No disponible";
            const isLongText = row.type === "long";

            const valueHtml =
              row.type === "badge"
                ? `<strong class="ev-clean-stateText ${row.variant ?? "neutral"}">${value}</strong>`
                : `<strong>${value}</strong>`;

            return `
              <div class="ev-clean-row ${isLongText ? "ev-clean-row--column" : ""} ${
              index === 0 ? "ev-clean-row--head" : ""
            }">
                <span>${row.label}</span>
                ${valueHtml}
              </div>
            `;
          })
          .join("")}
      </div>
    `;

    return Swal.fire({
      ...baseConfig,
      title: options.title,
      html,
      showCloseButton: true,
      showConfirmButton: true,
      confirmButtonText: options.confirmText ?? "Cerrar",
      showCancelButton: !!options.onCancel,
      cancelButtonText: options.cancelText ?? "Editar",
      reverseButtons: true,
      focusConfirm: false,
      width: 520,
      padding: "1.5rem",
      backdrop: "rgba(0,0,0,.45)",
      customClass: {
        popup: "ev-clean-popup",
        actions: "ev-clean-actions",
        confirmButton: "btn btn-secundario",
        cancelButton: "btn btn-principal",
      },
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
        options.onCancel?.();
      }
    });
  },

  input(options: InputOptions) {
    return Swal.fire({
      ...baseConfig,
      title: options.title ?? "Información requerida",
      text: options.text,
      input: "textarea",
      inputPlaceholder: options.inputPlaceholder ?? "",
      inputAttributes: {
        rows: "4",
        style: "font-size: 13px; resize: vertical;",
      },
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText ?? "Confirmar",
      cancelButtonText: options.cancelButtonText ?? "Cancelar",
      inputValidator: options.inputValidator,
      customClass: {
        confirmButton: "btn btn-principal custom-button",
        cancelButton: "btn btn-secondary custom-button",
      },
    });
  },
};