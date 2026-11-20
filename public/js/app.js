(() => {
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#main-nav");
  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    }));
  }

  const cards = [...document.querySelectorAll(".product-card")];
  const search = document.querySelector("#product-search");
  const filters = [...document.querySelectorAll(".filter-button")];
  const empty = document.querySelector("#empty-products");
  let category = "all";

  function filterProducts() {
    const query = (search?.value || "").trim().toLocaleLowerCase("vi");
    let visible = 0;
    cards.forEach(card => {
      const matchesCategory = category === "all" || card.dataset.category === category;
      const matchesText = (card.dataset.name || "").toLocaleLowerCase("vi").includes(query);
      const show = matchesCategory && matchesText;
      card.hidden = !show;
      if (show) visible++;
    });
    if (empty) empty.hidden = visible !== 0;
  }
  filters.forEach(button => button.addEventListener("click", () => {
    category = button.dataset.filter || "all";
    filters.forEach(item => item.classList.toggle("is-active", item === button));
    filterProducts();
  }));
  search?.addEventListener("input", filterProducts);

  let count = 0;
  const countNode = document.querySelector("#cart-count");
  const toast = document.querySelector("#toast");
  document.querySelectorAll(".add-cart").forEach(button => button.addEventListener("click", () => {
    count++;
    if (countNode) countNode.textContent = String(count);
    if (toast) {
      toast.textContent = `Đã ghi nhận quan tâm: ${button.dataset.product}. Đây chưa phải đơn hàng.`;
      toast.classList.add("show");
      window.clearTimeout(window.__dcdToastTimer);
      window.__dcdToastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
    }
  }));
  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
