import { initFooterOnPage } from "./utils/footer-renderer.js";

function setupNavigation() {
  initFooterOnPage();

  const menuToggleBtn = document.querySelector(".menu-toggle-btn");
  const mainNav = document.querySelector(".main-nav");
  let backdrop = null;

  if (menuToggleBtn && mainNav) {
    menuToggleBtn.addEventListener("click", () => {
      const isOpen = mainNav.classList.contains("open");
      if (isOpen) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  function openSidebar() {
    mainNav.classList.add("open");
    menuToggleBtn.classList.add("open");
    document.body.classList.add("nav-open");

    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "nav-backdrop";
      document.body.appendChild(backdrop);
      
      backdrop.offsetHeight;
      backdrop.classList.add("active");

      backdrop.addEventListener("click", closeSidebar);
    }
  }

  function closeSidebar() {
    if (mainNav) mainNav.classList.remove("open");
    if (menuToggleBtn) menuToggleBtn.classList.remove("open");
    document.body.classList.remove("nav-open");

    if (backdrop) {
      backdrop.classList.remove("active");
      backdrop.addEventListener("transitionend", function handler() {
        if (backdrop && !backdrop.classList.contains("active")) {
          backdrop.remove();
          backdrop = null;
        }
        backdrop?.removeEventListener("transitionend", handler);
      });
    }
  }

  const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const parentLi = toggle.closest(".has-dropdown");
      if (parentLi) {
        const isOpen = parentLi.classList.contains("open");
        
        document.querySelectorAll(".has-dropdown").forEach(li => {
          if (li !== parentLi) {
            li.classList.remove("open");
          }
        });

        if (isOpen) {
          parentLi.classList.remove("open");
        } else {
          parentLi.classList.add("open");
        }
      }
    });
  });

  const navLinks = document.querySelectorAll(".main-nav a");
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      const href = link.getAttribute("href");
      if (href && (href.startsWith("#") || href.includes("#") || window.innerWidth < 1024)) {
        closeSidebar();
      }
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupNavigation);
} else {
  setupNavigation();
}

