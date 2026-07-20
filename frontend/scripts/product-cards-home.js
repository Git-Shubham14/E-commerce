// featured products container
const homeFeaturedContainer =
    document.getElementById(
        "featured-products"
    );

// new arrivals container
const homeArrivalsContainer =
    document.getElementById(
        "new-arrivals-container"
    );

// safe helpers
function safeText(
    value,
    fallback = ""
) {
    return String(
        value ?? fallback
    );
}

function safePrice(
    value
) {
    const parsed =
        parseFloat(value);

    return isNaN(parsed)
        ? 0
        : parsed;
}

// ========================================
// STOCK STATUS HELPERS (Issue #1123)
// ========================================

function getStockBadgeHTML(stock) {
    const stockNum = Number(stock) || 0;
    
    if (stockNum === 0) {
        return `<span class="stock-badge out-of-stock">Out of Stock</span>`;
    } else if (stockNum <= 5) {
        return `<span class="stock-badge low-stock">Only ${stockNum} left</span>`;
    } else {
        return `<span class="stock-badge in-stock">In Stock</span>`;
    }
}

function getOutOfStockOverlayHTML(stock) {
    const stockNum = Number(stock) || 0;
    if (stockNum === 0) {
        return `<div class="out-of-stock-overlay">Sold Out</div>`;
    }
    return '';
}

function getLowStockTextHTML(stock) {
    const stockNum = Number(stock) || 0;
    if (stockNum > 0 && stockNum <= 5) {
        return `<span class="low-stock-text">⚡ Hurry! Only ${stockNum} left</span>`;
    }
    return '';
}

function isOutOfStock(stock) {
    return Number(stock) === 0;
}

// render product card with stock badge
function createProductCard(
    product
) {
    const rating =
        Math.min(
            5,
            Math.max(
                0,
                Number(
                    product.rating || 4
                )
            )
        );

    const stars =
        Array.from(
            {
                length: 5
            },
            (_, index) => {
                return `
                    <i class="fas fa-star${
                        index < rating
                            ? ""
                            : "-o"
                    }"></i>
                `;
            }
        ).join("");

    // Stock status
    const stock = Number(product.stock) || 0;
    const outOfStock = isOutOfStock(stock);
    const outOfStockClass = outOfStock ? 'out-of-stock' : '';

    return `
        <div class="pro ${outOfStockClass} fade-in">
            ${
                product.featured
                    ? `
                        <span class="product-badge">
                            Featured
                        </span>
                    `
                    : ""
            }

            <div class="product-image-wrapper">
                <img
    src="${defaultImage(product.image)}"
    alt="${escapeHTML(product.name || 'Product image')}"
    loading="lazy"
>
                ${getStockBadgeHTML(stock)}
                ${getOutOfStockOverlayHTML(stock)}
            </div>

            <div class="des">
                <span>
                    ${
                        safeText(
                            product.category,
                            "Fashion"
                        )
                    }
                </span>

                <h5>
                    ${
                        safeText(
                            product.name,
                            "Product"
                        )
                    }
                </h5>

                <div class="star">
                    ${stars}
                </div>

                <h4>
                    ${
                        formatPrice(
                            safePrice(
                                product.price
                            )
                        )
                    }
                </h4>

                ${getLowStockTextHTML(stock)}

                <div class="product-actions">
                    <button
                        type="button"
                        class="view-product-btn"
                        data-id="${
                            product.id
                        }"
                        ${outOfStock ? 'disabled' : ''}
                    >
                        View
                    </button>

                    <button
                        type="button"
                        class="add-cart-btn"
                        data-id="${
                            product.id
                        }"
                        ${outOfStock ? 'disabled' : ''}
                    >
                        Add Cart
                    </button>

                    <button
                        type="button"
                        class="compare-btn"
                        data-id="${
                            product.id
                        }"
                        ${outOfStock ? 'disabled' : ''}
                    >
                        Compare
                    </button>

                    <button
                        type="button"
                        class="wishlist-btn"
                        data-id="${product.id}"
                        aria-label="Add to Wishlist"
                    >
                        <i class="${ AppUtils.getWishlist().some(item => String(item.id) === String(product.id)) ? 'fas' : 'far' } fa-heart"></i>
                    </button>

                </div>
            </div>
        </div>
    `;
}

// render featured products
function renderFeaturedProducts(
    products = []
) {
    if (
        !homeFeaturedContainer
    ) {
        return;
    }

    const featured =
        products.filter(
            (product) =>
                product.featured
        );

    homeFeaturedContainer.innerHTML =
        featured.length
            ? featured
                .slice(0, 8)
                .map(
                    createProductCard
                )
                .join("")
            : `
                <p class="empty-products">
                    No featured products found
                </p>
            `;

    requestAnimationFrame(() => {
        const cards = homeFeaturedContainer.querySelectorAll('.pro');
        cards.forEach((card, i) => {
            card.setAttribute('data-anim-index', String(i));
        });

        if (typeof initializeScrollAnimations === "function") {
            initializeScrollAnimations();
        }

        if (typeof addProductCardAnimations === "function") {
            addProductCardAnimations('#featured-products');
        }

        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduce) {
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const inView = rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
                if (inView) {
                    card.classList.add('in-view');
                }
            });
        }
    });
}

// render new arrivals
function renderNewArrivals(
    products = []
) {
    if (
        !homeArrivalsContainer
    ) {
        return;
    }

    const arrivals =
        products.filter(
            (product) =>
                Number(product.featured) !== 1
        ).slice(0, 8);

    homeArrivalsContainer.innerHTML =
        arrivals.length
            ? arrivals
                .map(
                    createProductCard
                )
                .join("")
            : `
                <p class="empty-products">
                    No new arrivals found
                </p>
            `;

    requestAnimationFrame(() => {
        if (typeof initializeScrollAnimations === "function") {
            initializeScrollAnimations();
        }
        const cards = homeArrivalsContainer.querySelectorAll('.pro');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const inView = rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
            if (inView) {
                card.classList.add('in-view');
            }
        });
    });
}

function refreshHomeCardAnimations() {
    if (typeof addProductCardAnimations === "function") {
        if (homeFeaturedContainer) {
            addProductCardAnimations("#featured-products");
        }
        if (homeArrivalsContainer) {
            addProductCardAnimations("#new-arrivals-container");
        }
        return;
    }

    if (typeof initializeScrollAnimations === "function") {
        initializeScrollAnimations();
    }
}

function renderFeaturedProductsWithAnim(products = []) {
    renderFeaturedProducts(products);
    refreshHomeCardAnimations();
}

function renderNewArrivalsWithAnim(products = []) {
    renderNewArrivals(products);
    refreshHomeCardAnimations();
}

window.renderFeaturedProducts =
    renderFeaturedProductsWithAnim;

window.renderNewArrivals =
    renderNewArrivalsWithAnim;

window.createProductCard =
    createProductCard;