import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBQqBi4aKGjrbVjIzSvmscmAYSVGeUbfzg",
    authDomain: "sprent-cffc6.firebaseapp.com",
    databaseURL: "https://sprent-cffc6-default-rtdb.firebaseio.com",
    projectId: "sprent-cffc6",
    storageBucket: "sprent-cffc6.firebasestorage.app",
    messagingSenderId: "858069126936",
    appId: "1:858069126936:web:cab9d421a7ac4de14ed86d",
    measurementId: "G-TEWN0253WH"
};

let db = null;
try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log("🔥 Firebase Connected Successfully!");
} catch (e) {
    console.error("Firebase Init Error:", e);
}

let currentLang = localStorage.getItem("sprint_lang") || "ar";
let productsData = []; 
let userCart = [];
let selectedColor = "";
let selectedSize = "";
let currentActiveFilter = "all";

let currentPurchaseMode = "retail";
let currentQty = 1;
let currentActiveProduct = null;

// متغيرات سلايدر الصور في المودال
let modalImages = [];
let currentImageIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    applyLanguage(currentLang);

    if (db) {
        listenToCloudProducts();
        listenToCloudSettings();
    } else {
        renderCatalog("all");
    }

    const globalMask = document.getElementById("global-mask");
    const cartDrawer = document.getElementById("cart-drawer");
    const mobileMenu = document.getElementById("mobile-menu");

    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    if(themeToggleBtn) themeToggleBtn.addEventListener("click", toggleDarkMode);
    
    const langBtn = document.getElementById("lang-toggle-btn");
    if (langBtn) langBtn.addEventListener("click", toggleLanguage);

    const cartOpenBtn = document.getElementById("cart-open-btn");
    if(cartOpenBtn) cartOpenBtn.addEventListener("click", () => openDrawer(cartDrawer));

    const cartCloseBtn = document.getElementById("cart-close-btn");
    if(cartCloseBtn) cartCloseBtn.addEventListener("click", () => closeDrawers());

    const menuOpenBtn = document.getElementById("menu-open-btn");
    if(menuOpenBtn) menuOpenBtn.addEventListener("click", () => openDrawer(mobileMenu));

    const menuCloseBtn = document.getElementById("menu-close-btn");
    if(menuCloseBtn) menuCloseBtn.addEventListener("click", () => closeDrawers());

    if(globalMask) globalMask.addEventListener("click", () => closeDrawers());

    const modalCloseBtn = document.getElementById("modal-close-btn");
    if(modalCloseBtn) {
        modalCloseBtn.addEventListener("click", () => {
            closeDrawers();
        });
    }

    const contactForm = document.getElementById("contact-submit-form");
    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            alert(currentLang === 'ar' ? "تم إرسال رسالتك بنجاح!" : "Your message has been sent successfully!");
            contactForm.reset();
        });
    }
});

function listenToCloudProducts() {
    const productsRef = ref(db, 'products');
    onValue(productsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            if (Array.isArray(data)) {
                productsData = data.filter(Boolean);
            } else {
                productsData = Object.keys(data).map(key => ({ id: key, ...data[key] }));
            }
        } else {
            productsData = [];
        }
        renderCatalog(currentActiveFilter);
    }, (error) => {
        console.error("Products fetch error:", error);
        renderCatalog(currentActiveFilter);
    });
}

function listenToCloudSettings() {
    const settingsRef = ref(db, 'settings');
    onValue(settingsRef, (snapshot) => {
        const settings = snapshot.val();
        if (settings) {
            if (settings.title && document.getElementById('hero-title')) document.getElementById('hero-title').innerText = settings.title;
            if (settings.desc && document.getElementById('hero-desc')) document.getElementById('hero-desc').innerText = settings.desc;
            if (settings.bannerImg && document.getElementById('hero-banner')) document.getElementById('hero-banner').src = settings.bannerImg;
            
            if (settings.catImg1 && document.getElementById('cat-img-display-1')) document.getElementById('cat-img-display-1').src = settings.catImg1;
            if (settings.catImg2 && document.getElementById('cat-img-display-2')) document.getElementById('cat-img-display-2').src = settings.catImg2;
            if (settings.catImg3 && document.getElementById('cat-img-display-3')) document.getElementById('cat-img-display-3').src = settings.catImg3;
            if (settings.catImg4 && document.getElementById('cat-img-display-4')) document.getElementById('cat-img-display-4').src = settings.catImg4;

            if (settings.facebookLink && document.getElementById('link-facebook')) document.getElementById('link-facebook').href = settings.facebookLink;
            if (settings.instagramLink && document.getElementById('link-instagram')) document.getElementById('link-instagram').href = settings.instagramLink;
            if (settings.tiktokLink && document.getElementById('link-tiktok')) document.getElementById('link-tiktok').href = settings.tiktokLink;
        }
    });
}

function initTheme() {
    const savedTheme = localStorage.getItem("sprint_theme");
    const themeIcon = document.getElementById("theme-icon");
    if (savedTheme === "light") {
        document.body.classList.remove("dark-theme");
        if (themeIcon) themeIcon.className = "fa-solid fa-moon";
    } else {
        document.body.classList.add("dark-theme");
        if (themeIcon) themeIcon.className = "fa-solid fa-sun";
    }
}

function toggleDarkMode() {
    const body = document.body;
    const themeIcon = document.getElementById("theme-icon");
    body.classList.toggle("dark-theme");
    if (body.classList.contains("dark-theme")) {
        localStorage.setItem("sprint_theme", "dark");
        if(themeIcon) themeIcon.className = "fa-solid fa-sun";
    } else {
        localStorage.setItem("sprint_theme", "light");
        if(themeIcon) themeIcon.className = "fa-solid fa-moon";
    }
}

function toggleLanguage() {
    currentLang = currentLang === "ar" ? "en" : "ar";
    localStorage.setItem("sprint_lang", currentLang);
    applyLanguage(currentLang);
    renderCatalog(currentActiveFilter);
    updateCartUI();
}

function applyLanguage(lang) {
    const htmlTag = document.documentElement;
    htmlTag.setAttribute("lang", lang);
    htmlTag.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
}

function openDrawer(drawerElement) {
    const mask = document.getElementById("global-mask");
    if(mask && drawerElement) {
        mask.style.display = "block";
        setTimeout(() => {
            mask.classList.add("show");
            if (drawerElement.id === "cart-drawer") drawerElement.classList.add("drawer-open");
            if (drawerElement.id === "mobile-menu") drawerElement.classList.add("menu-open");
        }, 10);
    }
}

function closeDrawers() {
    const mask = document.getElementById("global-mask");
    const cartDrawer = document.getElementById("cart-drawer");
    const mobileMenu = document.getElementById("mobile-menu");
    const modal = document.getElementById("product-modal");

    if(cartDrawer) cartDrawer.classList.remove("drawer-open");
    if(mobileMenu) mobileMenu.classList.remove("menu-open");
    if(modal) modal.classList.remove("popup-open");
    if(mask) mask.classList.remove("show");
    setTimeout(() => {
        if(mask) mask.style.display = "none";
        if(modal) modal.style.display = "none";
    }, 400);
}

window.navigateTo = function(pageId) {
    const allPages = document.querySelectorAll(".page");
    allPages.forEach(page => page.classList.remove("active-page"));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add("active-page");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
    closeDrawers();
};

window.openCategoryTab = function(catId) {
    navigateTo('shop-page');
    window.filterShop(catId);
};

window.filterShop = function(catId) {
    currentActiveFilter = catId;
    const tabs = document.querySelectorAll(".filter-tabs .tab");
    tabs.forEach(tab => tab.classList.remove("active"));
    const activeTab = document.getElementById(`tab-${catId}`);
    if (activeTab) activeTab.classList.add("active");
    renderCatalog(catId);
};

// عرض الكتالوج مع التوافق مع الصور المتعددة والأقسام المتعددة
function renderCatalog(filter) {
    currentActiveFilter = filter;
    const wrapper = document.getElementById("shop-products-wrap");
    if (!wrapper) return;
    wrapper.innerHTML = "";

    const filteredProducts = filter === "all" 
        ? productsData 
        : productsData.filter(p => {
            if (Array.isArray(p.categories)) {
                return p.categories.map(String).includes(String(filter));
            }
            return String(p.category) === String(filter);
        });

    if (filteredProducts.length === 0) {
        wrapper.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding: 50px; color: var(--text-muted);">${currentLang === 'ar' ? 'لا توجد منتجات متاحة في هذا القسم حالياً ✨' : 'No products available in this section yet ✨'}</p>`;
        return;
    }

    filteredProducts.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        
        let badgeHtml = product.tag ? `<span class="p-badge ${product.tagClass || 'hot'}">${product.tag}</span>` : "";
        
        const retailPrice = product.oldPrice || product.price || 0;
        const wholesalePrice = product.price || 0;

        // تجميع جميع الصور المتاحة للمنتج
        let imagesList = [];
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            imagesList = product.images.filter(Boolean);
        } else {
            if(product.img) imagesList.push(product.img);
            if(product.img2) imagesList.push(product.img2);
            if(product.img3) imagesList.push(product.img3);
        }
        if (imagesList.length === 0) imagesList.push('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=500');

        let carouselSlidesHtml = imagesList.map(imgUrl => `
            <div class="card-carousel-slide">
                <img src="${imgUrl}" alt="${product.title || ''}" loading="lazy">
            </div>
        `).join('');

        let carouselNavHtml = imagesList.length > 1 ? `
            <button class="card-carousel-btn prev" onclick="event.stopPropagation(); changeCardSlide(this, -1)">&#10094;</button>
            <button class="card-carousel-btn next" onclick="event.stopPropagation(); changeCardSlide(this, 1)">&#10095;</button>
        ` : '';

        card.innerHTML = `
            ${badgeHtml}
            <div class="p-img-box" onclick="openQuickView('${product.id}')">
                <div class="card-carousel">
                    <div class="card-carousel-inner" data-index="0" data-total="${imagesList.length}">
                        ${carouselSlidesHtml}
                    </div>
                    ${carouselNavHtml}
                </div>
            </div>
            <div class="p-info" onclick="openQuickView('${product.id}')">
                <span class="p-cat">${product.type || 'ملابس'}</span>
                <h3 class="p-title">${product.title || 'منتج بدون اسم'}</h3>
                <div class="p-price-row">
                    <span class="p-price">${retailPrice} ${currentLang === 'ar' ? 'ج.م (قطاعي)' : 'EGP'}</span>
                    <span class="p-old-price" style="text-decoration: none; font-size: 0.85rem; color: var(--primary-accent); margin-right: 6px;">${wholesalePrice} ج.م (جملة)</span>
                </div>
            </div>
        `;
        wrapper.appendChild(card);
    });
}

// التنقل بين صور المنتج من داخل الكارت في الصفحة الرئيسية
window.changeCardSlide = function(btnElement, direction) {
    const carouselInner = btnElement.parentElement.querySelector('.card-carousel-inner');
    let currentIndex = parseInt(carouselInner.getAttribute('data-index')) || 0;
    const totalSlides = parseInt(carouselInner.getAttribute('data-total')) || 1;

    currentIndex += direction;
    if (currentIndex >= totalSlides) currentIndex = 0;
    if (currentIndex < 0) currentIndex = totalSlides - 1;

    carouselInner.setAttribute('data-index', currentIndex);
    carouselInner.style.transform = `translateX(${currentIndex * 100}%)`;
};

// فتح نافذة العرض السريع وتجهيز معرض الصور المتقدم
window.openQuickView = function(productId) {
    const product = productsData.find(p => String(p.id) === String(productId));
    if (!product) return;

    currentActiveProduct = product;
    selectedColor = "";
    selectedSize = "";

    document.getElementById("m-title-val").innerText = product.title || "";
    document.getElementById("m-type-val").innerText = product.type || "ملابس قطنية";
    document.getElementById("m-fabric-val").innerText = product.fabric || "خامة عالية الجودة";

    // تجهيز الصور للسلايدر بداخل المودال
    modalImages = [];
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        modalImages = product.images.filter(Boolean);
    } else {
        if(product.img) modalImages.push(product.img);
        if(product.img2) modalImages.push(product.img2);
        if(product.img3) modalImages.push(product.img3);
    }
    if (modalImages.length === 0) modalImages.push('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=500');

    currentImageIndex = 0;
    renderModalCarousel();

    window.setPurchaseMode('retail');

    // تجهيز خيارات الألوان
    const colorsWrap = document.getElementById("m-colors-options");
    colorsWrap.innerHTML = "";
    let productColors = product.colors;
    if (typeof productColors === 'string') productColors = productColors.split(',').map(c => c.trim());
    productColors = productColors || ["أسود", "أبيض"];

    productColors.forEach(color => {
        const box = document.createElement("button");
        box.className = "option-box";
        box.innerText = color;
        box.onclick = () => {
            document.querySelectorAll("#m-colors-options .option-box").forEach(b => b.classList.remove("selected"));
            box.classList.add("selected");
            selectedColor = color;
        };
        colorsWrap.appendChild(box);
    });

    // تجهيز خيارات المقاسات
    const sizesWrap = document.getElementById("m-sizes-options");
    sizesWrap.innerHTML = "";
    let activeSizes = product.sizes;
    if (typeof activeSizes === 'string') activeSizes = activeSizes.split(',').map(s => s.trim());
    activeSizes = activeSizes || ["M", "L", "XL"];

    activeSizes.forEach(size => {
        const box = document.createElement("button");
        box.className = "option-box";
        box.innerText = size;
        box.onclick = () => {
            document.querySelectorAll("#m-sizes-options .option-box").forEach(b => b.classList.remove("selected"));
            box.classList.add("selected");
            selectedSize = size;
        };
        sizesWrap.appendChild(box);
    });

    const addBtn = document.getElementById("m-add-btn");
    addBtn.onclick = () => {
        if (!selectedColor) { alert(currentLang === 'ar' ? "من فضلك اختر اللون أولاً!" : "Please choose a color first!"); return; }
        if (!selectedSize) { alert(currentLang === 'ar' ? "من فضلك اختر المقاس المناسب أولاً!" : "Please choose a suitable size first!"); return; }
        
        executeAddToCart(product, selectedColor, selectedSize, currentPurchaseMode, currentQty);
        closeDrawers();
    };

    const mask = document.getElementById("global-mask");
    const modal = document.getElementById("product-modal");
    if(mask) mask.style.display = "block";
    if(modal) modal.style.display = "block";
    setTimeout(() => {
        if(mask) mask.classList.add("show");
        if(modal) modal.classList.add("popup-open");
    }, 10);
};

// إنشاء وتحديث معرض الصور داخل نافذة المودال
// إنشاء وتحديث معرض الصور داخل نافذة المودال
// إنشاء وتحديث معرض الصور داخل نافذة المودال
function renderModalCarousel() {
    const track = document.getElementById("modal-carousel-track");
    const dotsWrap = document.getElementById("modal-carousel-dots");
    if (!track) return;

    // رص الصور داخل السلايدر
    track.innerHTML = modalImages.map(img => `
        <div class="modal-slide">
            <img src="${img}" alt="صورة المنتج">
        </div>
    `).join('');
    
    if (dotsWrap) {
        dotsWrap.innerHTML = modalImages.length > 1 ? modalImages.map((_, idx) => `
            <span class="carousel-dot ${idx === 0 ? 'active' : ''}" onclick="window.goToCarouselSlide(${idx})"></span>
        `).join('') : '';
    }
    updateCarouselPosition();
}

// ربط الدوال بـ window لتسجيلها عالمياً للموديول (حل مشكلة Uncaught ReferenceError)
window.moveCarousel = function(direction) {
    if (!modalImages || modalImages.length <= 1) return;
    currentImageIndex += direction;
    if (currentImageIndex >= modalImages.length) currentImageIndex = 0;
    if (currentImageIndex < 0) currentImageIndex = modalImages.length - 1;
    updateCarouselPosition();
};

window.goToCarouselSlide = function(index) {
    currentImageIndex = index;
    updateCarouselPosition();
};

function updateCarouselPosition() {
    const track = document.getElementById("modal-carousel-track");
    if (track) {
        // التحريك بنسبة 100% لكل صورة
        track.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    }

    const dots = document.querySelectorAll("#modal-carousel-dots .carousel-dot");
    dots.forEach((dot, idx) => {
        if (idx === currentImageIndex) dot.classList.add("active");
        else dot.classList.remove("active");
    });
}

window.setPurchaseMode = function(mode) {
    currentPurchaseMode = mode;
    const btnRetail = document.getElementById("mode-retail-btn");
    const btnWholesale = document.getElementById("mode-wholesale-btn");
    const minBadge = document.getElementById("min-qty-badge");
    
    if(!currentActiveProduct) return;

    const retailPrice = currentActiveProduct.oldPrice || currentActiveProduct.price || 0;
    const wholesalePrice = currentActiveProduct.price || 0;
    const minWholesale = Number(currentActiveProduct.minWholesale) || 8;

    if (mode === "wholesale") {
        btnWholesale.classList.add("active");
        btnRetail.classList.remove("active");
        currentQty = minWholesale;
        document.getElementById("m-price-val").innerText = `${wholesalePrice} ج.م / للقطعة`;
        if(minBadge) {
            minBadge.style.display = "inline-block";
            minBadge.innerText = `الحد الأدنى للجملة: ${minWholesale} قطعة`;
        }
    } else {
        btnRetail.classList.add("active");
        btnWholesale.classList.remove("active");
        currentQty = 1;
        document.getElementById("m-price-val").innerText = `${retailPrice} ج.م / قطاعي`;
        if(minBadge) {
            minBadge.style.display = "none";
        }
    }
    
    const qtyVal = document.getElementById("m-qty-val");
    if(qtyVal) qtyVal.innerText = currentQty;
};

window.updateModalQty = function(change) {
    if(!currentActiveProduct) return;
    const minWholesale = Number(currentActiveProduct.minWholesale) || 8;

    if (currentPurchaseMode === "wholesale") {
        if (change < 0 && currentQty <= minWholesale) {
            alert(`عفواً، الحد الأدنى لطلب الجملة لهذا المنتج هو ${minWholesale} قطع.`);
            return;
        }
    } else {
        if (change < 0 && currentQty <= 1) return;
    }

    currentQty += change;
    document.getElementById("m-qty-val").innerText = currentQty;
};

function executeAddToCart(product, color, size, mode, quantity) {
    const unitPrice = (mode === "wholesale") ? Number(product.price || 0) : Number(product.oldPrice || product.price || 0);
    const modeLabel = (mode === "wholesale") ? "جملة" : "قطاعي";
    
    const cartItemId = `${product.id}-${color}-${size}-${mode}`;
    const existingItem = userCart.find(item => item.cartItemId === cartItemId);

    const mainImg = (product.images && product.images[0]) || product.img;

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        userCart.push({
            cartItemId: cartItemId,
            id: product.id,
            title: product.title,
            price: unitPrice,
            mode: modeLabel,
            img: mainImg,
            color: color,
            size: size,
            quantity: quantity
        });
    }
    updateCartUI();
}

window.changeQty = function(cartItemId, change) {
    const item = userCart.find(item => item.cartItemId === cartItemId);
    if (!item) return;
    item.quantity += change;
    if (item.quantity <= 0) {
        userCart = userCart.filter(item => item.cartItemId !== cartItemId);
    }
    updateCartUI();
};

window.removeCartItem = function(cartItemId) {
    userCart = userCart.filter(item => item.cartItemId !== cartItemId);
    updateCartUI();
};

function updateCartUI() {
    const container = document.getElementById("cart-items-container");
    const badgeCount = document.getElementById("cart-badge-count");
    const totalValue = document.getElementById("cart-total-value");
    
    if (!container) return;
    container.innerHTML = "";

    let totalItems = 0;
    let totalPrice = 0;

    if (userCart.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted);"><p>${currentLang === 'ar' ? 'حقيبة التسوق فارغة حالياً' : 'Your shopping cart is currently empty'}</p></div>`;
    } else {
        userCart.forEach(item => {
            totalItems += item.quantity;
            totalPrice += (item.price * item.quantity);

            const row = document.createElement("div");
            row.className = "d-item";
            row.innerHTML = `
                <img class="d-img" src="${item.img}" alt="${item.title}">
                <div class="d-details">
                    <h4 class="d-title">${item.title} <span style="font-size:0.75rem; color:var(--primary-accent);">(${item.mode})</span></h4>
                    <span style="font-size:0.75rem; color:var(--text-muted);">لون: ${item.color} | مقاس: ${item.size}</span>
                    <div class="d-price">${item.price} EGP</div>
                    <div class="d-qty-ctrl">
                        <button class="d-qty-btn" onclick="changeQty('${item.cartItemId}', 1)">+</button>
                        <span>${item.quantity}</span>
                        <button class="d-qty-btn" onclick="changeQty('${item.cartItemId}', -1)">-</button>
                    </div>
                    <span class="d-remove" onclick="removeCartItem('${item.cartItemId}')"><i class="fa-solid fa-trash-can"></i> حذف</span>
                </div>
            `;
            container.appendChild(row);
        });
    }

    if(badgeCount) badgeCount.innerText = totalItems;
    if(totalValue) totalValue.innerText = `${totalPrice} ${currentLang === 'ar' ? 'ج.م' : 'EGP'}`;
}

window.triggerCheckout = function() {
    if (userCart.length === 0) {
        alert(currentLang === 'ar' ? "سلة المشتريات فارغة!" : "Cart is empty!");
        return;
    }
    const customerName = document.getElementById("customer-name").value.trim();
    const customerAddress = document.getElementById("customer-address").value.trim();
    const customerPhone = document.getElementById("customer-phone").value.trim();

    if (!customerName || !customerAddress || !customerPhone) {
        alert(currentLang === 'ar' ? "من فضلك أدخل (الاسم، العنوان، ورقم الهاتف) لإتمام الطلب." : "Please enter Name, Address, and Phone.");
        return;
    }

    const storeWhatsAppNumber = "201207878777"; 
    let messageText = `🛍️ *Order from Sprint Egypt*\n👤 Name: ${customerName}\n📍 Address: ${customerAddress}\n📞 Phone: ${customerPhone}\n\n🛒 *Items:*\n`;

    userCart.forEach((item, index) => {
        messageText += `${index + 1}. ${item.title} (${item.mode}) - [${item.color} / ${item.size}] x${item.quantity} - ${item.price * item.quantity} EGP\n`;
    });

    const finalTotal = userCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    messageText += `\n💰 *Total:* ${finalTotal} EGP`;

    window.open(`https://api.whatsapp.com/send?phone=${storeWhatsAppNumber}&text=${encodeURIComponent(messageText)}`, "_blank");
};
