import Swal from "sweetalert2";

export const modernToast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
  showClass: {
    popup: "animate__animated animate__fadeInDown animate__faster",
  },
  hideClass: {
    popup: "animate__animated animate__fadeOutUp animate__faster",
  },
  didOpen: (toastEl) => {
    toastEl.addEventListener("mouseenter", Swal.stopTimer);
    toastEl.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

export const showToast = {
  success: (title) =>
    modernToast.fire({
      icon: "success",
      title: title || "Success",
    }),
  error: (title) =>
    modernToast.fire({
      icon: "error",
      title: title || "Something went wrong",
    }),
  info: (title) =>
    modernToast.fire({
      icon: "info",
      title: title || "Notice",
    }),
  warning: (title) =>
    modernToast.fire({
      icon: "warning",
      title: title || "Warning",
    }),
};

export default modernToast;
