import {
    getJSON,
    $,
    defaultImage,
    safeText,
    safePrice,
    formatPrice
} from "./utils.js";

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

// LOAD RECENTLY VIEWED PRODUCTS
const recentlyViewed =
    getJSON("recentlyViewed") || [];

// ELEMENTS
const elements = {
    recentContainer:
        $("#recently-viewed-container"),

    recentCount:
        $("#recently-viewed-count")
};

// EMPTY STATE HELPER
const renderEmptyState = (
    container,
    message
) => {
    if(container){
        container.innerHTML =
            `<p>${message}</p>`;
    }
};

// DISPLAY COUNT
if (elements.recentCount) {
    elements.recentCount.innerText =
        recentlyViewed.length;
}

// DISPLAY PRODUCTS WITH STOCK BADGES
if (elements.recentContainer) {
    elements.recentContainer.innerHTML = "";
    if (recentlyViewed.length === 0) {
        renderEmptyState(
            elements.recentContainer, 
            "No recently viewed products."
        );
    } else {
        recentlyViewed.forEach((product) => {
            const stock = Number(product.stock) || 0;
            const outOfStock = isOutOfStock(stock);
            const outOfStockClass = outOfStock ? 'out-of-stock' : '';
            
            const div =
                document.createElement("div");
            div.classList.add(
                "recent-product-item",
                outOfStockClass
            );
            
            div.innerHTML = `
                <div class="product-image-wrapper" style="position:relative;">
                    <img
                        src="${defaultImage(product.image)}"
                        alt="${product.name || "Product"}"
                    >
                    ${getStockBadgeHTML(stock)}
                    ${getOutOfStockOverlayHTML(stock)}
                </div>
                <h4>
                    ${product.name || "Product"}
                </h4>
                <p>
                    ${formatPrice(safePrice(product.price))}
                </p>
                ${getLowStockTextHTML(stock)}
            `;
            
            elements.recentContainer.appendChild(div);
        });
    }
}