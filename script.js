(() => {
  "use strict";

  const store = window.MathWearStorage;
  const byId = (id) => document.getElementById(id);
  let analyticsUpdate = null;
  const numberFormat = new Intl.NumberFormat("ar-SA", {
    maximumFractionDigits: 1,
  });
  const moneyFormat = new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  });

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatNumber(value) {
    return numberFormat.format(number(value));
  }

  function formatMoney(value) {
    return moneyFormat.format(number(value));
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );
  }

  function calculate(values) {
    const meters = Math.max(0, number(values.meters));
    const fabricPrice = Math.max(0, number(values.fabricPrice));
    const labor = Math.max(0, number(values.labor));
    const trims = Math.max(0, number(values.trims));
    const packaging = Math.max(0, number(values.packaging));
    const overhead = Math.max(0, number(values.overhead));
    const designCost = Math.max(0, number(values.designCost));
    const quantity = Math.max(1, Math.floor(number(values.quantity) || 1));
    const sales = Math.min(
      quantity,
      Math.max(0, Math.floor(number(values.sales))),
    );
    const targetMargin = Math.min(85, Math.max(1, number(values.margin) || 40));
    const fabricCost = meters * fabricPrice;
    const productionUnitCost =
      fabricCost + labor + trims + packaging + overhead;
    const fullUnitCost = productionUnitCost + designCost / quantity;
    const marginRate = targetMargin / 100;
    const suggestedPrice = fullUnitCost / (1 - marginRate);
    const expectedRevenue = suggestedPrice * sales;
    const expectedProfit =
      expectedRevenue - productionUnitCost * sales - designCost;
    const contribution = suggestedPrice - productionUnitCost;
    const breakEven =
      contribution > 0 ? Math.ceil(designCost / contribution) : null;
    const realizedMargin =
      expectedRevenue > 0 ? (expectedProfit / expectedRevenue) * 100 : 0;

    return {
      fabricCost,
      productionUnitCost,
      fullUnitCost,
      designCost,
      totalProductionCost: productionUnitCost * quantity,
      fullBatchCost: productionUnitCost * quantity + designCost,
      suggestedPrice,
      expectedRevenue,
      expectedProfit,
      expectedSales: sales,
      productionQuantity: quantity,
      targetMargin,
      realizedMargin,
      breakEven,
      components: {
        الخامة: fabricCost,
        "الخياطة والتنفيذ": labor,
        الإكسسوارات: trims,
        التغليف: packaging,
        "مصاريف أخرى": overhead,
        "التصميم للوحدة": designCost / quantity,
      },
    };
  }

  function calculationForProduct(product) {
    return calculate(product);
  }

  function setActiveNavigation() {
    const page = document.body.dataset.page;
    document.querySelectorAll("[data-nav]").forEach((link) => {
      if (link.dataset.nav === page) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function setUpMobileNavigation() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = byId("main-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
      const icon = toggle.querySelector(".material-symbols-outlined");
      if (icon) icon.textContent = open ? "close" : "menu";
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function setUpReveal() {
    const elements = document.querySelectorAll(".reveal");
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    document.body.classList.add("has-reveal-js");
    const observer = new IntersectionObserver(
      (entries, activeObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            activeObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -25px 0px" },
    );
    elements.forEach((element) => observer.observe(element));
  }

  function productCard(product, index, allowDelete = false) {
    const result = calculationForProduct(product);
    const category = product.isCustom ? "custom" : product.type;
    const tag = product.isCustom ? "تصميمك" : product.type;
    return `
      <article class="product-card reveal" data-product-type="${escapeHtml(category)}">
        <a class="product-image-wrap" href="products-details.html?id=${encodeURIComponent(product.id)}" aria-label="تفاصيل ${escapeHtml(product.name)}: ${escapeHtml(product.description || product.fabric)}">
          <img
            class="product-image"
            src="${escapeHtml(product.image)}"
            data-fallback="${escapeHtml(product.fallbackImage || "reference-dress.jpg")}"
            alt="${escapeHtml(product.name)} من ${escapeHtml(product.fabric)}"
            decoding="async"
          />
          <span class="product-image-shade"></span>
          <span class="product-hover-info" aria-hidden="true">
            <span class="product-hover-kicker">تفاصيل القطعة</span>
            <strong class="product-hover-title">${escapeHtml(product.name)}</strong>
            <span class="product-hover-copy">${escapeHtml(product.description || `${product.fabric} · ${product.type}`)}</span>
            <span class="product-hover-action">اكتشفي التصميم <span class="material-symbols-outlined" aria-hidden="true">arrow_outward</span></span>
          </span>
          <span class="product-number">${String(index + 1).padStart(2, "0")}</span>
          <span class="product-type-pill">${escapeHtml(tag)}</span>
        </a>
        <div class="product-card-body">
          <div class="product-card-top">
            <div>
              <h3>${escapeHtml(product.name)}</h3>
              <p class="product-fabric">${escapeHtml(product.fabric)}</p>
            </div>
            <span class="product-card-price">${formatMoney(result.suggestedPrice)}</span>
          </div>
          <div class="product-card-meta">
            <span>تكلفة الوحدة ${formatMoney(result.fullUnitCost)}</span>
            <strong>ربح متوقع ${formatMoney(result.expectedProfit)}</strong>
          </div>
          <div class="product-card-actions">
            <a class="product-card-link" href="products-details.html?id=${encodeURIComponent(product.id)}">
              عرض الحساب
              <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            </a>
            ${allowDelete && product.isCustom ? `
              <button
                class="product-delete-button"
                type="button"
                data-delete-product="${escapeHtml(product.id)}"
                aria-label="حذف ${escapeHtml(product.name)}"
              >
                <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                <span>حذف التصميم</span>
              </button>` : ""}
          </div>
        </div>
      </article>`;
  }

  function renderHomeProducts() {
    const target = byId("home-products");
    if (!target) return;
    const limit = Math.max(1, Number(target.dataset.productLimit) || 3);
    const products = store.getProducts();
    const featured = ["فستان", "جاكيت", "تيشيرت"]
      .map((type) => products.find((product) => product.type === type && !product.isCustom))
      .filter(Boolean);
    products.filter((product) => product.isCustom).forEach((product) => {
      if (featured.length < limit) featured.push(product);
    });
    target.innerHTML = featured.slice(0, limit).map(productCard).join("");
  }

  function renderProductGrid(filter = "all") {
    const grid = byId("product-grid");
    if (!grid) return;
    const products = store.getProducts();
    const filtered =
        filter === "all"
          ? products
          : products.filter((product) =>
            filter === "custom" ? product.isCustom : product.type === filter,
          );
    grid.innerHTML = filtered
      .map((product, index) => productCard(product, index, true))
      .join("");
    const empty = byId("product-empty");
    if (empty) empty.hidden = filtered.length > 0;
    const count = byId("catalog-count");
    if (count) count.textContent = `${formatNumber(filtered.length)} تصميم`;
    setUpReveal();
  }

  function setUpProductDeletion() {
    const grid = byId("product-grid");
    if (!grid) return;
    grid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-delete-product]");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      const product = store.getProduct(button.dataset.deleteProduct);
      if (!product?.isCustom) return;
      const confirmed = window.confirm(`هل تريدين حذف تصميم «${product.name}» من هذا الجهاز؟`);
      if (!confirmed) return;
      if (store.removeProduct(product.id)) {
        const activeFilter = document.querySelector("[data-filter].is-active")?.dataset.filter || "all";
        renderProductGrid(activeFilter);
        window.dispatchEvent(new CustomEvent("mathwear:data-changed"));
      }
    });
  }

  function setUpProductFilters() {
    const filters = document.querySelectorAll("[data-filter]");
    if (!filters.length) return;
    filters.forEach((button) => {
      button.addEventListener("click", () => {
        filters.forEach((item) =>
          item.classList.toggle("is-active", item === button),
        );
        renderProductGrid(button.dataset.filter || "all");
      });
    });
  }

  function breakdownRows(result) {
    return Object.entries(result.components)
      .map(
        ([label, amount]) => `
      <div class="breakdown-row"><span>${escapeHtml(label)}</span><strong>${formatMoney(amount)}</strong></div>`,
      )
      .join("");
  }

  function renderProductDetail() {
    const target = byId("product-detail-view");
    if (!target) return;
    const params = new URLSearchParams(window.location.search);
    const product =
      store.getProduct(params.get("id")) || store.getProducts()[0];
    if (!product) return;
    const result = calculationForProduct(product);
    target.innerHTML = `
      <section class="detail-layout reveal">
        <div class="detail-image-wrap">
          <img
            src="${escapeHtml(product.image)}"
            data-fallback="${escapeHtml(product.fallbackImage || "reference-dress.jpg")}"
            alt="${escapeHtml(product.name)} من ${escapeHtml(product.fabric)}"
          />
          <span class="detail-image-label">${escapeHtml(product.type)} · نموذج تعليمي</span>
        </div>
        <div class="detail-copy">
          <p class="eyebrow"><span class="eyebrow-line"></span> ${product.isCustom ? "تصميم مضاف" : "من المجموعة"}</p>
          <h1>${escapeHtml(product.name)}</h1>
          <p class="detail-intro">${escapeHtml(product.description || "تصميم أزياء بتكلفة وسعر محسوبين بطريقة واضحة.")}</p>
          <div class="detail-specs">
            <div class="detail-spec"><span>نوع القطعة</span><strong>${escapeHtml(product.type)}</strong></div>
            <div class="detail-spec"><span>الخامة</span><strong>${escapeHtml(product.fabric)}</strong></div>
            <div class="detail-spec"><span>كمية القماش</span><strong>${formatNumber(product.meters)} متر</strong></div>
            <div class="detail-spec"><span>خطة الإنتاج</span><strong>${formatNumber(product.quantity)} قطعة</strong></div>
          </div>
          <div class="detail-price"><span>سعر البيع المقترح</span><strong>${formatMoney(result.suggestedPrice)}</strong></div>
          <div class="breakdown-title"><h2>تفاصيل الحساب للوحدة</h2><span class="eyebrow">هامش مستهدف ${formatNumber(result.targetMargin)}٪</span></div>
          <div class="breakdown-list">${breakdownRows(result)}<div class="breakdown-row total"><span>التكلفة الكاملة للوحدة</span><strong>${formatMoney(result.fullUnitCost)}</strong></div></div>
          <div class="detail-actions">
            <a class="button button-dark" href="calculator.html?product=${encodeURIComponent(product.id)}">
              عدّلي الحساب
              <span class="material-symbols-outlined" aria-hidden="true">calculate</span>
            </a>
            <a class="button button-outline" href="report.html?product=${encodeURIComponent(product.id)}">
              عرض التقرير
            </a>
          </div>
        </div>
      </section>`;
    setUpReveal();
  }

  function setUpAddProductForm() {
    const form = byId("add-product-form");
    if (!form) return;
    const feedback = byId("add-feedback");
    const imageInput = byId("design-image");
    const imagePreview = byId("design-image-preview");
    if (imageInput && imagePreview) {
      imageInput.addEventListener("change", () => {
        const file = imageInput.files?.[0];
        if (!file) {
          imagePreview.removeAttribute("src");
          imagePreview.hidden = true;
          return;
        }
        if (!file.type.startsWith("image/")) {
          imageInput.value = "";
          feedback.textContent = "اختاري ملف صورة صالحاً.";
          feedback.classList.add("is-error");
          return;
        }
        imagePreview.src = URL.createObjectURL(file);
        imagePreview.hidden = false;
        feedback.textContent = "ستُحفظ الصورة على هذا الجهاز مع التصميم.";
        feedback.classList.remove("is-error");
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) {
        feedback.textContent = "راجعي الحقول المطلوبة وأدخلي قيماً صحيحة.";
        feedback.classList.add("is-error");
        return;
      }
      const data = new FormData(form);
      const quantity = Math.max(1, Math.floor(number(data.get("quantity"))));
      const submit = form.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      try {
        const image = await compressImageFile(imageInput?.files?.[0]);
        const product = store.addProduct({
          name: String(data.get("name")).trim(),
          type: String(data.get("type")),
          fabric: String(data.get("fabric")).trim(),
          description: String(data.get("description") || "تصميم أُضيف محلياً إلى المجموعة.").trim(),
          meters: number(data.get("meters")),
          fabricPrice: number(data.get("fabricPrice")),
          labor: number(data.get("labor")),
          trims: number(data.get("trims")),
          packaging: number(data.get("packaging")),
          overhead: number(data.get("overhead")),
          designCost: number(data.get("designCost")),
          quantity,
          sales: Math.min(quantity, number(data.get("sales")) || quantity),
          margin: number(data.get("margin")),
          image,
        });
        feedback.classList.remove("is-error");
        feedback.innerHTML = `تم حفظ «${escapeHtml(product.name)}» على هذا الجهاز. <a href="products-details.html?id=${encodeURIComponent(product.id)}">شاهدي تفاصيله</a>`;
        form.reset();
        if (imagePreview) {
          imagePreview.removeAttribute("src");
          imagePreview.hidden = true;
        }
        window.dispatchEvent(new CustomEvent("mathwear:data-changed"));
      } catch (error) {
        feedback.textContent = error.message || "تعذر حفظ التصميم. جرّبي صورة أصغر.";
        feedback.classList.add("is-error");
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  }

  async function compressImageFile(file) {
    if (!file) return "";
    if (!file.type.startsWith("image/")) throw new Error("اختاري ملف صورة صالحاً.");
    if (file.size > 12 * 1024 * 1024) throw new Error("حجم الصورة يجب ألا يتجاوز ١٢ ميغابايت.");
    const source = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = source;
      await image.decode();
      const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      let encoded = canvas.toDataURL("image/jpeg", 0.78);
      if (encoded.length > 900_000) encoded = canvas.toDataURL("image/jpeg", 0.58);
      if (encoded.length > 1_200_000) throw new Error("الصورة كبيرة بعد الضغط؛ اختاري صورة أصغر.");
      return encoded;
    } catch (error) {
      if (error instanceof Error && error.message.includes("الصورة")) throw error;
      throw new Error("تعذر قراءة الصورة. اختاري صورة بصيغة أخرى.");
    } finally {
      URL.revokeObjectURL(source);
    }
  }

  function formValuesFromCalculator() {
    const productSelect = byId("calc-product-select");
    const selectedProduct = productSelect
      ? store.getProduct(productSelect.value)
      : null;
    return {
      id: selectedProduct?.id || "manual-calculation",
      name: selectedProduct?.name || "حساب يدوي",
      type: selectedProduct?.type || "قطعة أزياء",
      fabric: byId("calc-fabric")?.value || "خامة غير محددة",
      meters: byId("calc-meters")?.value,
      fabricPrice: byId("calc-fabric-price")?.value,
      labor: byId("calc-labor")?.value,
      trims: byId("calc-trims")?.value,
      packaging: byId("calc-packaging")?.value,
      overhead: byId("calc-overhead")?.value,
      designCost: byId("calc-design-cost")?.value,
      quantity: byId("calc-quantity")?.value,
      sales: byId("calc-sales")?.value,
      margin: byId("calc-margin")?.value,
      image: selectedProduct?.image || store.getProducts()[0]?.image,
      fallbackImage:
        selectedProduct?.fallbackImage || store.getProducts()[0]?.fallbackImage,
    };
  }

  function fillCalculatorFromProduct(product) {
    if (!product) return;
    const mapping = {
      "calc-fabric": product.fabric,
      "calc-meters": product.meters,
      "calc-fabric-price": product.fabricPrice,
      "calc-labor": product.labor,
      "calc-trims": product.trims,
      "calc-packaging": product.packaging,
      "calc-overhead": product.overhead,
      "calc-design-cost": product.designCost,
      "calc-quantity": product.quantity,
      "calc-sales": product.sales,
      "calc-margin": product.margin,
    };
    Object.entries(mapping).forEach(([id, value]) => {
      const input = byId(id);
      if (input && value !== undefined) input.value = value;
    });
    const output = byId("margin-output");
    if (output) output.textContent = `${formatNumber(product.margin)}٪`;
  }

  function displayCalculation(values, result) {
    const nodes = {
      "result-price": formatMoney(result.suggestedPrice),
      "result-unit-cost": formatMoney(result.fullUnitCost),
      "result-profit": formatMoney(result.expectedProfit),
      "result-margin": `${formatNumber(result.realizedMargin)}٪`,
      "result-breakeven":
        result.breakEven === null
          ? "غير متاحة"
          : `${formatNumber(result.breakEven)} قطعة`,
    };
    Object.entries(nodes).forEach(([id, text]) => {
      const node = byId(id);
      if (node) node.textContent = text;
    });
  }

  function setUpCalculator() {
    const form = byId("calculator-form");
    if (!form) return;
    const select = byId("calc-product-select");
    const products = store.getProducts();
    if (select) {
      select.innerHTML = products
        .map(
          (product) =>
            `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)} — ${escapeHtml(product.type)}</option>`,
        )
        .join("");
      const requestedId = new URLSearchParams(window.location.search).get(
        "product",
      );
      if (requestedId && store.getProduct(requestedId))
        select.value = requestedId;
      fillCalculatorFromProduct(store.getProduct(select.value));
      select.addEventListener("change", () => {
        fillCalculatorFromProduct(store.getProduct(select.value));
        update(false);
      });
    }

    function update(save) {
      const values = formValuesFromCalculator();
      const result = calculate(values);
      displayCalculation(values, result);
      if (save)
        store.saveLastCalculation({
          ...values,
          result,
          savedAt: new Date().toISOString(),
        });
      return { values, result };
    }

    form.addEventListener("input", (event) => {
      if (event.target.name === "margin") {
        const output = byId("margin-output");
        if (output) output.textContent = `${formatNumber(event.target.value)}٪`;
      }
      update(false);
    });
    form.addEventListener("change", () => update(false));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      update(true);
      const submit = form.querySelector('button[type="submit"]');
      if (submit) {
        const original = submit.innerHTML;
        submit.innerHTML =
          'حُفظ الحساب <span class="material-symbols-outlined" aria-hidden="true">check</span>';
        window.setTimeout(() => {
          submit.innerHTML = original;
        }, 1700);
      }
    });
    update(false);
  }

  function canvasFont(size, weight = 400) {
    const family =
      getComputedStyle(document.body).fontFamily ||
      '"Tajawal", Arial, sans-serif';
    const prefix = weight === 400 ? "" : `${weight} `;
    return `${prefix}${size}px ${family}`;
  }

  function canvasContext(canvas) {
    const box = canvas.getBoundingClientRect();
    const width = Math.max(260, box.width);
    const height = Math.max(190, box.height);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const context = canvas.getContext("2d");
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.direction = "rtl";
    context.font = canvasFont(12);
    return { context, width, height };
  }

  function drawGroupedBars(canvas, products) {
    if (!canvas) return;
    const { context: ctx, width, height } = canvasContext(canvas);
    if (!products.length) return;
    const values = products.map((product) => ({
      product,
      result: calculationForProduct(product),
    }));
    const max =
      Math.max(
        1,
        ...values.flatMap(({ result }) => [
          result.fullUnitCost,
          result.suggestedPrice,
        ]),
      ) * 1.17;
    const padding = { top: 22, right: 28, bottom: 42, left: 28 };
    const chartHeight = height - padding.top - padding.bottom;
    const chartWidth = width - padding.left - padding.right;
    const groupWidth = chartWidth / values.length;
    const barWidth = Math.min(35, groupWidth * 0.22);
    ctx.strokeStyle = "rgba(36,29,41,.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const y = padding.top + (chartHeight * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }
    values.forEach(({ product, result }, index) => {
      const center = padding.right + groupWidth * index + groupWidth / 2;
      const costHeight = (result.fullUnitCost / max) * chartHeight;
      const priceHeight = (result.suggestedPrice / max) * chartHeight;
      ctx.fillStyle = "#452d4b";
      ctx.fillRect(
        center - barWidth - 3,
        padding.top + chartHeight - costHeight,
        barWidth,
        costHeight,
      );
      ctx.fillStyle = "#b89966";
      ctx.fillRect(
        center + 3,
        padding.top + chartHeight - priceHeight,
        barWidth,
        priceHeight,
      );
      ctx.fillStyle = "#625b64";
      ctx.textAlign = "center";
      ctx.font = canvasFont(11);
      ctx.fillText(product.name.slice(0, 11), center, height - 14);
    });
  }

  function drawProfitBars(canvas, products) {
    if (!canvas) return;
    const { context: ctx, width, height } = canvasContext(canvas);
    if (!products.length) return;
    const values = products.map((product) => ({
      product,
      result: calculationForProduct(product),
    }));
    const max =
      Math.max(
        1,
        ...values.map(({ result }) => Math.abs(result.expectedProfit)),
      ) * 1.18;
    const rowHeight = (height - 30) / values.length;
    const labelWidth = Math.min(130, width * 0.3);
    const barStart = width - labelWidth - 22;
    const usable = Math.max(100, barStart - 28);
    values.forEach(({ product, result }, index) => {
      const y = 17 + index * rowHeight;
      const barY = y + rowHeight * 0.26;
      const barHeight = Math.min(23, rowHeight * 0.42);
      const barWidth = Math.max(
        2,
        (Math.abs(result.expectedProfit) / max) * usable,
      );
      ctx.fillStyle =
        result.expectedProfit < 0
          ? "#b85f78"
          : index % 2
            ? "#b89966"
            : "#5c4262";
      ctx.beginPath();
      ctx.roundRect(16, barY, barWidth, barHeight, 6);
      ctx.fill();
      ctx.fillStyle = "#625b64";
      ctx.textAlign = "right";
      ctx.font = canvasFont(12);
      ctx.fillText(product.name.slice(0, 15), width - 12, y + rowHeight * 0.58);
      ctx.textAlign = "left";
      ctx.fillStyle = "#241d29";
      ctx.font = canvasFont(11);
      const textX = Math.min(usable + 20, 25 + barWidth);
      ctx.fillText(
        formatNumber(Math.round(result.expectedProfit)),
        textX,
        y + rowHeight * 0.58,
      );
    });
  }

  function drawDonut(canvas, product) {
    if (!canvas || !product) return [];
    const { context: ctx, width, height } = canvasContext(canvas);
    const result = calculationForProduct(product);
    const entries = Object.entries(result.components).filter(
      ([, amount]) => amount > 0,
    );
    const total = entries.reduce((sum, [, amount]) => sum + amount, 0) || 1;
    const colors = [
      "#452d4b",
      "#b89966",
      "#b85f78",
      "#8c728e",
      "#d6bd91",
      "#6c596f",
    ];
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width * 0.3, height * 0.39);
    const thickness = Math.max(20, radius * 0.28);
    let start = -Math.PI / 2;
    entries.forEach(([, amount], index) => {
      const angle = (amount / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, start, start + angle);
      ctx.strokeStyle = colors[index % colors.length];
      ctx.lineWidth = thickness;
      ctx.lineCap = "butt";
      ctx.stroke();
      start += angle;
    });
    ctx.textAlign = "center";
    ctx.fillStyle = "#625b64";
    ctx.font = canvasFont(11);
    ctx.fillText("تكلفة الوحدة", centerX, centerY - 2);
    ctx.fillStyle = "#241d29";
    ctx.font = canvasFont(14, 700);
    ctx.fillText(
      formatNumber(Math.round(result.fullUnitCost)),
      centerX,
      centerY + 20,
    );
    return entries.map(([label, amount], index) => ({
      label,
      amount,
      color: colors[index % colors.length],
    }));
  }

  function renderAnalytics() {
    const summary = byId("analytics-summary");
    if (!summary) return;
    const typeFilter = byId("analytics-type-filter");
    const sortSelect = byId("analytics-sort");
    const mixSelect = byId("analytics-mix-product");
    const legend = byId("cost-mix-legend");
    const tableBody = byId("analytics-table-body");
    let allProducts = store.getProducts();

    function update() {
      allProducts = store.getProducts();
      const filter = typeFilter?.value || "all";
      const mode = sortSelect?.value || "profit";
      let products = allProducts.filter((product) => {
        if (filter === "all") return true;
        return filter === "custom" ? product.isCustom : product.type === filter;
      });
      const key = {
        profit: (product) => calculationForProduct(product).expectedProfit,
        price: (product) => calculationForProduct(product).suggestedPrice,
        cost: (product) => calculationForProduct(product).fullUnitCost,
        name: (product) => product.name,
      }[mode];
      products = [...products].sort((a, b) => {
        const left = key(a);
        const right = key(b);
        return mode === "name" ? left.localeCompare(right, "ar") : right - left;
      });

      const results = products.map(calculationForProduct);
      const averageCost = results.reduce((sum, result) => sum + result.fullUnitCost, 0) / Math.max(1, results.length);
      const averagePrice = results.reduce((sum, result) => sum + result.suggestedPrice, 0) / Math.max(1, results.length);
      const totalProfit = results.reduce((sum, result) => sum + result.expectedProfit, 0);
      const tiles = [
        ["عدد التصاميم", formatNumber(products.length), "styler"],
        ["متوسط تكلفة الوحدة", formatMoney(averageCost), "payments"],
        ["متوسط سعر البيع", formatMoney(averagePrice), "sell"],
        ["إجمالي الربح المتوقع", formatMoney(totalProfit), "trending_up"],
      ];
      summary.innerHTML = tiles.map(([label, value, icon]) =>
        `<div class="summary-tile"><span class="material-symbols-outlined" aria-hidden="true">${icon}</span><span>${label}</span><strong>${value}</strong></div>`,
      ).join("");

      if (mixSelect) {
        const prior = mixSelect.value;
        mixSelect.innerHTML = products.map((product) =>
          `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)} · ${escapeHtml(product.type)}</option>`,
        ).join("");
        if (products.some((product) => product.id === prior)) mixSelect.value = prior;
        mixSelect.disabled = products.length === 0;
      }
      const mixProduct = products.find((product) => product.id === mixSelect?.value) || products[0];
      drawGroupedBars(byId("chart-price-cost"), products);
      drawProfitBars(byId("chart-profit"), products);
      const mix = drawDonut(byId("chart-cost-mix"), mixProduct);
      if (legend) legend.innerHTML = mix.map((item) =>
        `<span><i style="background:${item.color}"></i>${escapeHtml(item.label)} · ${formatMoney(item.amount)}</span>`,
      ).join("");
      const count = byId("analytics-filter-count");
      if (count) count.textContent = `يعرض ${formatNumber(products.length)} من ${formatNumber(allProducts.length)} تصميم.`;
      if (tableBody) tableBody.innerHTML = products.map((product) => {
        const result = calculationForProduct(product);
        const breakEven = result.breakEven === null ? "غير متاحة" : `${formatNumber(result.breakEven)} قطعة`;
        return `
          <tr>
            <td><a href="products-details.html?id=${encodeURIComponent(product.id)}">${escapeHtml(product.name)}</a></td>
            <td>${escapeHtml(product.type)} · ${escapeHtml(product.fabric)}</td>
            <td>${formatMoney(result.fullUnitCost)}</td>
            <td>${formatMoney(result.suggestedPrice)}</td>
            <td>${formatMoney(result.expectedProfit)}</td>
            <td>${breakEven}</td>
          </tr>`;
      }).join("");
      const empty = byId("analytics-empty");
      if (empty) empty.hidden = products.length > 0;
    }

    analyticsUpdate = update;
    typeFilter?.addEventListener("change", update);
    sortSelect?.addEventListener("change", update);
    mixSelect?.addEventListener("change", update);
    window.addEventListener("mathwear:data-changed", update);
    window.addEventListener("resize", debounce(update, 140));
    update();
  }

  function debounce(callback, delay) {
    let timer;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => callback(...args), delay);
    };
  }

  function renderReport() {
    const target = byId("report-content");
    if (!target) return;
    const products = store.getProducts();
    const saved = store.getLastCalculation();
    const params = new URLSearchParams(window.location.search);
    const scope = byId("report-scope");
    const select = byId("report-product-select");
    const requestedId = params.get("product");
    if (scope && params.get("scope") === "all") scope.value = "all";
    if (select) {
      const prior = select.value;
      select.innerHTML = products.map((product) =>
        `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)} · ${escapeHtml(product.type)}</option>`,
      ).join("");
      const candidate = requestedId || (products.some((product) => product.id === saved?.id) ? saved.id : prior);
      if (products.some((product) => product.id === candidate)) select.value = candidate;
    }
    const allMode = scope?.value === "all";
    const selectedId = select?.value || requestedId || products[0]?.id;
    const selectedProduct = products.find((product) => product.id === selectedId) || products[0];
    const selectionNote = byId("report-selection-note");
    const productField = byId("report-product-field");
    if (productField) productField.hidden = allMode;
    if (selectionNote) selectionNote.textContent = allMode
      ? `يشمل التقرير ${formatNumber(products.length)} تصميماً محفوظاً في هذا المتصفح.`
      : `يُعرض التقرير وفق بيانات «${selectedProduct?.name || "التصميم"}» والأرقام المحفوظة له.`;

    const date = new Intl.DateTimeFormat("ar-SA", { dateStyle: "long" }).format(new Date());
    if (!products.length) {
      target.innerHTML = `
        <div class="report-empty">
          <span class="material-symbols-outlined" aria-hidden="true">description</span>
          <h2>لا توجد تصاميم لإعداد التقرير</h2>
          <p>أضيفي تصميماً أو اختاري أحد النماذج لتكوين تقريرك.</p>
          <a class="button button-dark" href="add-product.html">إضافة تصميم</a>
        </div>`;
      return;
    }

    if (allMode) {
      const rows = products.map((product) => {
        const calculation = saved?.id === product.id ? saved : null;
        const result = calculation?.result || calculate(product);
        return { product, result };
      });
      const totals = rows.reduce((sum, row) => ({
        batch: sum.batch + row.result.fullBatchCost,
        revenue: sum.revenue + row.result.expectedRevenue,
        profit: sum.profit + row.result.expectedProfit,
        units: sum.units + row.result.productionQuantity,
        sales: sum.sales + row.result.expectedSales,
      }), { batch: 0, revenue: 0, profit: 0, units: 0, sales: 0 });
      target.innerHTML = `
        <div class="report-head">
          <div>
            <p class="eyebrow"><span class="eyebrow-line"></span> ملخص مشروع الأزياء</p>
            <h2>تقرير شامل للتصاميم</h2>
            <p>تاريخ إعداد التقرير: ${escapeHtml(date)}</p>
          </div>
          <span class="report-id">مِيزان · شامل</span>
        </div>
        <div class="report-overview">
          <p>يشمل هذا التقرير النماذج الأساسية والتصاميم المضافة المحفوظة محلياً.</p>
          <strong>
            ${formatNumber(rows.length)} تصميماً · ${formatNumber(totals.units)} قطعة مخططة ·
            ${formatNumber(totals.sales)} قطعة متوقعة البيع
          </strong>
        </div>
        <div class="report-kpis">
          <div class="report-kpi"><span>تكلفة الدفعات</span><strong>${formatMoney(totals.batch)}</strong></div>
          <div class="report-kpi is-highlight"><span>الإيراد المتوقع</span><strong>${formatMoney(totals.revenue)}</strong></div>
          <div class="report-kpi"><span>إجمالي الربح المتوقع</span><strong>${formatMoney(totals.profit)}</strong></div>
        </div>
        <div class="table-scroll">
          <table class="report-table report-all-table">
            <thead>
              <tr>
                <th>التصميم</th><th>الفئة والخامة</th><th>تكلفة الوحدة</th>
                <th>سعر البيع</th><th>الكمية المخططة</th><th>الربح المتوقع</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(({ product, result }) => `
                <tr>
                  <td>${escapeHtml(product.name)}</td>
                  <td>${escapeHtml(product.type)} · ${escapeHtml(product.fabric)}</td>
                  <td>${formatMoney(result.fullUnitCost)}</td>
                  <td>${formatMoney(result.suggestedPrice)}</td>
                  <td>${formatNumber(result.productionQuantity)}</td>
                  <td>${formatMoney(result.expectedProfit)}</td>
                </tr>`).join("")}
            </tbody>
            <tfoot>
              <tr><td colspan="5">إجمالي الربح المتوقع</td><td>${formatMoney(totals.profit)}</td></tr>
            </tfoot>
          </table>
        </div>
        <div class="report-formulas">
          <div><strong>تكلفة الخامة</strong>كمية القماش × سعر المتر</div>
          <div><strong>تكلفة الوحدة</strong>التصنيع + حصة الوحدة من التصميم</div>
          <div><strong>نطاق البيانات</strong>جميع المنتجات والتصاميم المحفوظة محلياً</div>
        </div>
        <p class="report-note">الأرقام تقديرية تعليمية تعتمد على مدخلات كل تصميم، وقد تختلف عن النتائج الفعلية.</p>`;
      return;
    }

    const product = selectedProduct;
    const calculation = saved?.id === product.id ? saved : null;
    const values = calculation || product;
    const result = calculation?.result || calculate(product);
    const rows = [
      ["نوع القطعة", product.type], ["الخامة", product.fabric],
      ["كمية القماش", `${formatNumber(values.meters)} متر`],
      ["سعر المتر", formatMoney(number(values.fabricPrice))],
      ["تكلفة الخامة", result.fabricCost],
      ["الخياطة والتنفيذ", number(values.labor)],
      ["الإكسسوارات والتشطيب", number(values.trims)],
      ["التغليف", number(values.packaging)],
      ["مصاريف أخرى للوحدة", number(values.overhead)],
      ["تكلفة التصميم الثابتة", result.designCost],
      ["الكمية المخطط إنتاجها", `${formatNumber(result.productionQuantity)} قطعة`],
      ["الكمية المتوقع بيعها", `${formatNumber(result.expectedSales)} قطعة`],
      ["نقطة التعادل", result.breakEven === null ? "غير متاحة" : `${formatNumber(result.breakEven)} قطعة`],
    ];
    target.innerHTML = `
      <div class="report-head">
        <div>
          <p class="eyebrow"><span class="eyebrow-line"></span> ملخص مشروع الأزياء</p>
          <h2>تقرير التكلفة والربحية</h2>
          <p>تاريخ إعداد التقرير: ${escapeHtml(date)}</p>
        </div>
        <span class="report-id">مِيزان · ${escapeHtml(product.id.slice(-2))}</span>
      </div>
      <div class="report-product">
        <img
          src="${escapeHtml(values.image || product.image)}"
          data-fallback="${escapeHtml(values.fallbackImage || product.fallbackImage || "reference-dress.jpg")}" alt="${escapeHtml(product.name)}"
        />
        <div>
          <p class="eyebrow">التصميم محل الدراسة</p>
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.type)} · ${escapeHtml(product.fabric)}</p>
          <p>${escapeHtml(product.description || "")}</p>
        </div>
      </div>
      <div class="report-kpis">
        <div class="report-kpi"><span>تكلفة الوحدة الكاملة</span><strong>${formatMoney(result.fullUnitCost)}</strong></div>
        <div class="report-kpi is-highlight"><span>سعر البيع المقترح</span><strong>${formatMoney(result.suggestedPrice)}</strong></div>
        <div class="report-kpi"><span>الربح المتوقع</span><strong>${formatMoney(result.expectedProfit)}</strong></div>
      </div>
      <div class="table-scroll">
        <table class="report-table">
          <thead><tr><th>عنصر التكلفة أو الكمية</th><th>القيمة</th></tr></thead>
          <tbody>
            ${rows.map(([label, value]) => `
              <tr>
                <td>${escapeHtml(label)}</td>
                <td>${typeof value === "number" ? formatMoney(value) : escapeHtml(value)}</td>
              </tr>`).join("")}
          </tbody>
          <tfoot><tr><td>تكلفة الدفعة كاملة</td><td>${formatMoney(result.fullBatchCost)}</td></tr></tfoot>
        </table>
      </div>
      <div class="report-formulas">
        <div><strong>الخامة</strong>كمية القماش × سعر المتر</div>
        <div><strong>تكلفة الوحدة</strong>التصنيع + حصة الوحدة من التصميم</div>
        <div><strong>هامش الربح المستهدف</strong>${formatNumber(result.targetMargin)}٪ من سعر البيع</div>
      </div>
      <p class="report-note">
        الربح المتوقع = (سعر البيع المقترح − تكلفة التصنيع للوحدة) × الكمية المتوقع بيعها −
        تكلفة إعداد التصميم. هذه أرقام تعليمية تقديرية وليست عرضاً تجارياً.
      </p>`;
  }

  function setUpReportControls() {
    const scope = byId("report-scope");
    const select = byId("report-product-select");
    if (!scope || !select) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("scope") === "all") scope.value = "all";
    const requestedId = params.get("product");
    if (requestedId) select.dataset.requestedProduct = requestedId;
    scope.addEventListener("change", () => {
      const params = new URLSearchParams();
      if (scope.value === "all") params.set("scope", "all");
      else if (select.value) params.set("product", select.value);
      window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
      renderReport();
    });
    select.addEventListener("change", () => {
      const params = new URLSearchParams(window.location.search);
      params.delete("scope");
      params.set("product", select.value);
      window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
      renderReport();
    });
    window.addEventListener("mathwear:data-changed", renderReport);
  }

  function setUpPrintButtons() {
    document
      .querySelectorAll("[data-print-report]")
      .forEach((button) =>
        button.addEventListener("click", () => window.print()),
      );
  }

  function setUpYear() {
    document.querySelectorAll("[data-year]").forEach((node) => {
      node.textContent = new Intl.DateTimeFormat("ar-SA", {
        year: "numeric",
      }).format(new Date());
    });
  }

  function setUpImageFallback() {
    document.addEventListener(
      "error",
      (event) => {
        const image = event.target;
        if (
          !(image instanceof HTMLImageElement) ||
          image.dataset.failed === "true"
        )
          return;
        if (image.dataset.fallback && image.dataset.fallbackUsed !== "true") {
          image.dataset.fallbackUsed = "true";
          image.src = image.dataset.fallback;
          return;
        }
        image.dataset.failed = "true";
        image.style.display = "none";
        image.setAttribute("aria-hidden", "true");
        const parent = image.closest(
          ".product-image-wrap, .detail-image-wrap, .report-product",
        );
        if (parent) parent.classList.add("image-unavailable");
      },
      true,
    );
  }

  function initialize() {
    setActiveNavigation();
    setUpMobileNavigation();
    setUpReveal();
    setUpYear();
    setUpImageFallback();
    renderHomeProducts();
    setUpReveal();
    renderProductGrid();
    setUpProductFilters();
    setUpProductDeletion();
    renderProductDetail();
    setUpAddProductForm();
    setUpCalculator();
    renderAnalytics();
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (document.fonts.check("12px Tajawal")) analyticsUpdate?.();
      });
    }
    setUpReportControls();
    renderReport();
    setUpPrintButtons();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
