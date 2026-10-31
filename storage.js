(() => {
  const KEYS = {
    products: "mizan-fashion-products-v1",
    calculation: "mizan-fashion-last-calculation-v1",
  };

  const IMAGES = {
    فستان: "/manus-storage/async-images/ZgWC9bTTkM09wPp9zTDCOy/image-2.webp",
    جاكيت: "/manus-storage/async-images/ZgWC9bTTkM09wPp9zTDCOy/image-3.webp",
    تيشيرت: "/manus-storage/async-images/ZgWC9bTTkM09wPp9zTDCOy/image-4.webp",
  };

  const FALLBACK_IMAGES = {
    فستان: "reference-dress.jpg",
    جاكيت: "reference-jacket.jpg",
    تيشيرت: "reference-tshirt.jpg",
  };

  const PRODUCT_IMAGES = {
    "dress-plum-01": "01-lilac-matte-crepe-dress.jpg",
    "dress-satin-02": "02-satin-silk-dress.jpg",
    "dress-linen-03": "03-cotton-blend-dress.jpg",
    "jacket-ivory-02": "04-cotton-twill-jacket.jpg",
    "jacket-wool-03": "05-light-wool-jacket.jpg",
    "jacket-denim-04": "06-midweight-denim-jacket.jpg",
    "tee-ivory-03": "07-organic-cotton-heavyweight-tee.jpg",
    "tee-rib-04": "08-ribbed-jersey-tee.jpg",
    "tee-linen-05": "09-cotton-linen-tee.jpg",
  };

  const DEFAULT_PRODUCTS = [
    {
      id: "dress-plum-01",
      name: "فستان ليلك",
      type: "فستان",
      fabric: "كريب مطفي",
      description: "قصة انسيابية بخامة ناعمة وتفاصيل هادئة.",
      meters: 3.1, fabricPrice: 42, labor: 90, trims: 18, packaging: 12,
      overhead: 20, designCost: 120, quantity: 15, sales: 12, margin: 40,
    },
    {
      id: "dress-satin-02",
      name: "فستان سُرى",
      type: "فستان",
      fabric: "ساتان حريري",
      description: "تصميم سهرة ناعم بخطوط أنثوية ولمعة هادئة.",
      meters: 3.6, fabricPrice: 58, labor: 115, trims: 24, packaging: 16,
      overhead: 22, designCost: 180, quantity: 18, sales: 14, margin: 42,
    },
    {
      id: "dress-linen-03",
      name: "فستان مِداد",
      type: "فستان",
      fabric: "كتان ممزوج",
      description: "قصة يومية خفيفة تجمع الراحة وبساطة التفاصيل.",
      meters: 2.8, fabricPrice: 36, labor: 78, trims: 14, packaging: 11,
      overhead: 17, designCost: 95, quantity: 24, sales: 19, margin: 38,
    },
    {
      id: "jacket-ivory-02",
      name: "جاكيت أثر",
      type: "جاكيت",
      fabric: "تويل قطني فاخر",
      description: "جاكيت مفصّل بخطوط واضحة وبطانة خفيفة.",
      meters: 2.2, fabricPrice: 62, labor: 110, trims: 24, packaging: 14,
      overhead: 25, designCost: 160, quantity: 12, sales: 9, margin: 42,
    },
    {
      id: "jacket-wool-03",
      name: "جاكيت رِواق",
      type: "جاكيت",
      fabric: "صوف خفيف",
      description: "طبقة أنيقة بخامة دافئة وتفصيل عملي للموسم.",
      meters: 2.5, fabricPrice: 74, labor: 135, trims: 29, packaging: 18,
      overhead: 28, designCost: 210, quantity: 14, sales: 11, margin: 40,
    },
    {
      id: "jacket-denim-04",
      name: "جاكيت نَسق",
      type: "جاكيت",
      fabric: "دنيم متوسط الوزن",
      description: "تصميم يومي ببنية متينة ولمسات معدنية بسيطة.",
      meters: 2.1, fabricPrice: 48, labor: 98, trims: 32, packaging: 15,
      overhead: 21, designCost: 130, quantity: 20, sales: 16, margin: 39,
    },
    {
      id: "tee-ivory-03",
      name: "تيشيرت أساس",
      type: "تيشيرت",
      fabric: "قطن عضوي ثقيل",
      description: "قطعة يومية أساسية بقماش مريح وقصّة مستقيمة.",
      meters: 1.6, fabricPrice: 32, labor: 45, trims: 12, packaging: 8,
      overhead: 12, designCost: 80, quantity: 25, sales: 21, margin: 38,
    },
    {
      id: "tee-rib-04",
      name: "تيشيرت مَلمس",
      type: "تيشيرت",
      fabric: "جيرسي مضلّع",
      description: "قصة ناعمة بتفصيل مضلّع ولمسة بسيطة متقنة.",
      meters: 1.4, fabricPrice: 38, labor: 48, trims: 10, packaging: 8,
      overhead: 13, designCost: 90, quantity: 30, sales: 25, margin: 37,
    },
    {
      id: "tee-linen-05",
      name: "تيشيرت ندى",
      type: "تيشيرت",
      fabric: "قطن وكتان",
      description: "قماش تنفّسي بقصة مريحة وتفاصيل منسّقة.",
      meters: 1.7, fabricPrice: 35, labor: 52, trims: 13, packaging: 9,
      overhead: 14, designCost: 105, quantity: 28, sales: 22, margin: 36,
    },
  ].map((product) => ({
    ...product,
    image: PRODUCT_IMAGES[product.id] || IMAGES[product.type],
    fallbackImage: FALLBACK_IMAGES[product.type],
    isCustom: false,
  }));

  const memory = new Map();

  function readValue(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return memory.has(key) ? memory.get(key) : fallback;
    }
  }

  function writeValue(key, value) {
    memory.set(key, value);
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
    }
  }

  function getCustomProducts() {
    const stored = readValue(KEYS.products, []);
    return Array.isArray(stored) ? stored : [];
  }

  function normalizeProduct(product) {
    return {
      ...product,
      image: product.image || IMAGES[product.type] || IMAGES["فستان"],
      fallbackImage:
        product.fallbackImage ||
        FALLBACK_IMAGES[product.type] ||
        FALLBACK_IMAGES["فستان"],
    };
  }

  function getProducts() {
    return [
      ...DEFAULT_PRODUCTS.map((product) => ({ ...product })),
      ...getCustomProducts().map(normalizeProduct),
    ];
  }

  function addProduct(product) {
    const customProducts = getCustomProducts();
    const savedProduct = {
      ...product,
      id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      image: product.image || IMAGES[product.type] || IMAGES["فستان"],
      fallbackImage: FALLBACK_IMAGES[product.type] || FALLBACK_IMAGES["فستان"],
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    customProducts.unshift(savedProduct);
    writeValue(KEYS.products, customProducts);
    return savedProduct;
  }

  function removeProduct(id) {
    const customProducts = getCustomProducts();
    const next = customProducts.filter((product) => product.id !== id);
    if (next.length === customProducts.length) return false;
    writeValue(KEYS.products, next);
    const lastCalculation = getLastCalculation();
    if (lastCalculation?.id === id) writeValue(KEYS.calculation, null);
    return true;
  }

  function getProduct(id) {
    return getProducts().find((product) => product.id === id) || null;
  }

  function saveLastCalculation(calculation) {
    writeValue(KEYS.calculation, calculation);
  }

  function getLastCalculation() {
    return readValue(KEYS.calculation, null);
  }

  window.MathWearStorage = {
    getProducts,
    getProduct,
    addProduct,
    removeProduct,
    getLastCalculation,
    saveLastCalculation,
    getDefaultProducts: () => DEFAULT_PRODUCTS.map((product) => ({ ...product })),
  };
})();
