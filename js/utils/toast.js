// ========================================
// TOAST TYPES
// ========================================

const TOAST_TYPES = {

    SUCCESS:
        "success",

    ERROR:
        "error",

    WARNING:
        "warning",

    INFO:
        "info"

};

function showToast(message, type) {
    removeExistingToast();

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        `toast-notification ${type}`;

    toast.innerHTML =
        `
                <span class="toast-icon">
                    ${getIcon(type)}
                </span>

                <span class="toast-message"></span>

                <button
                    class="toast-close"
                    aria-label="Close"
                    style="background: none; border: none; color: #fff; cursor: pointer; font-size: 1.2rem; margin-left: auto; padding: 0 0 0 10px; font-weight: bold; line-height: 1;"
                >
                    ×
                </button>
            `;

    const messageSpan = toast.querySelector(".toast-message");
    if (messageSpan) {
        messageSpan.textContent = message;
    }

    document.body.appendChild(
        toast
    );

    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    const closeBtn = toast.querySelector(".toast-close");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            removeToast(toast);
        });
    }

    setTimeout(() => {
        removeToast(toast);
    }, 4000);
}

// ========================================
// REMOVE TOAST
// ========================================

function removeToast(
    toast
) {
    if (
        !toast
    ) {
        return;
    }

    toast.classList.remove(
        "show"
    );

    setTimeout(

        () => {

            if (
                toast.parentNode
            ) {
                toast.remove();
            }

        },

        300

    );
}

// ========================================
// REMOVE EXISTING
// ========================================

function removeExistingToast() {
    const existing =
        document.querySelector(
            ".toast-notification"
        );

    if (
        existing
    ) {
        existing.remove();
    }
}

// ========================================
// ICONS
// ========================================

function getIcon(
    type
) {
    switch (type) {

        case TOAST_TYPES.SUCCESS:
            return "✓";

        case TOAST_TYPES.ERROR:
            return "✕";

        case TOAST_TYPES.WARNING:
            return "⚠";

        default:
            return "ℹ";

    }
}

// ========================================
// HELPERS
// ========================================

export function showSuccess(
    message
) {
    showToast(

        message,

        TOAST_TYPES.SUCCESS

    );
}

export function showError(
    message
) {
    showToast(

        message,

        TOAST_TYPES.ERROR

    );
}

export function showWarning(
    message
) {
    showToast(

        message,

        TOAST_TYPES.WARNING

    );
}

export function showInfo(
    message
) {
    showToast(

        message,

        TOAST_TYPES.INFO

    );
}