const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox?.querySelector("img");
const lightboxTitle = lightbox?.querySelector("p");
const closeLightbox = document.querySelector(".close-lightbox");
const gallery = document.querySelector("#portfolio-gallery");
const heroMedia = document.querySelector(".hero-media");
const topbar = document.querySelector(".topbar");

const portfolioImages = window.PORTFOLIO_IMAGES || [];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function createWorkButton(src, index) {
  const button = document.createElement("button");
  const image = document.createElement("img");
  const label = document.createElement("span");
  const title = `Реален проект ${String(index + 1).padStart(3, "0")}`;

  button.className = "work reveal-item";
  button.type = "button";
  button.dataset.image = src;
  button.dataset.title = title;
  button.style.setProperty("--reveal-delay", `${Math.min(index % 12, 11) * 38}ms`);

  image.src = src;
  image.alt = title;
  image.loading = index < 8 ? "eager" : "lazy";

  label.textContent = title;
  button.append(image, label);

  return button;
}

portfolioImages.forEach((src, index) => {
  gallery?.append(createWorkButton(src, index));
});

const revealItems = [
  ".intro-section",
  ".section-heading",
  ".portfolio-count",
  ".service-grid article",
  ".process-copy",
  ".steps li",
  ".contact-section > div",
  ".contact-line",
]
  .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
  .filter(Boolean);

revealItems.forEach((item, index) => {
  item.classList.add("reveal-item");
  item.style.setProperty("--reveal-delay", `${Math.min(index % 5, 4) * 70}ms`);
});

function revealNow(items) {
  items.forEach((item) => item.classList.add("is-visible"));
}

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealNow(Array.from(document.querySelectorAll(".reveal-item")));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.12,
    },
  );

  document.querySelectorAll(".reveal-item").forEach((item) => revealObserver.observe(item));
}

function syncScrollEffects() {
  const scrollY = window.scrollY || 0;
  topbar?.classList.toggle("is-scrolled", scrollY > 24);

  if (!reduceMotion && heroMedia) {
    heroMedia.style.setProperty("--hero-parallax", `${Math.min(scrollY * 0.16, 90)}px`);
  }
}

syncScrollEffects();
window.addEventListener("scroll", syncScrollEffects, { passive: true });

document.querySelectorAll(".work").forEach((button) => {
  button.addEventListener("click", () => {
    if (!lightbox || !lightboxImage || !lightboxTitle) return;

    lightboxImage.src = button.dataset.image || "";
    lightboxImage.alt = button.dataset.title || "";
    lightboxTitle.textContent = button.dataset.title || "";
    lightbox.showModal();
  });
});

closeLightbox?.addEventListener("click", () => lightbox?.close());

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    lightbox.close();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox?.open) {
    lightbox.close();
  }
});
