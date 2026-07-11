// ===== THEME - Apply INSTANTLY before anything loads =====
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
}

// load component
const loadComponent = async (id, file) => {
    const element = document.getElementById(id);

    if (!element) {
        return false;
    }

    element.innerHTML = `<div class="component-loading">Loading...</div>`;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => { controller.abort(); }, 8000);

        const response = await fetch(file, { signal: controller.signal });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`Failed to load ${file}`);
        }

        const data = await response.text();
        element.innerHTML = data;

        if (
            id === "navbar" &&
            element.dataset.hideGlobalSearch === "true"
        ) {
            element.querySelector(".search-container")?.remove();
        }

        return true;

    } catch (error) {
        console.error(`Error loading component: ${file}`, error);
        element.innerHTML = `<div class="component-error">Failed to load component.</div>`;
        return false;
    }
};

const loadScript = (
    src
) => {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            if (
                document.querySelector(
                    `script[src="${src}"]`
                )
            ) {
                resolve();
                return;
            }

            const script =
                document.createElement(
                    "script"
                );

            script.src = src;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;

            document.body.appendChild(
                script
            );
        }
    );
};

const loadStylesheet = (
    href
) => {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            if (
                document.querySelector(
                    `link[href="${href}"]`
                )
            ) {
                resolve();
                return;
            }

            const stylesheet =
                document.createElement(
                    "link"
                );

            stylesheet.rel =
                "stylesheet";

            stylesheet.href =
                href;

            stylesheet.onload =
                resolve;

            stylesheet.onerror =
                reject;

            document.head.appendChild(
                stylesheet
            );
        }
    );
};

const initializeCustomCursor = async () => {
    await loadStylesheet(
        "styles/custom-cursor.css"
    );

    await loadScript(
        "scripts/custom-cursor.js"
    );
};

// initialize components
async function initializeComponents() {
    try {
        await initializeCustomCursor();
    } catch (error) {
        console.error(
            "Failed to load custom cursor:",
            error
        );
    }

    const loadTasks = [
        loadComponent(
            "navbar",
            "./components/navbar.html"
        ),

        loadComponent(
            "footer",
            "./components/footer.html"
        )
    ];

    if (
        !document.getElementById(
            "cart-drawer"
        )
    ) {
        let drawerHost =
            document.getElementById(
                "cart-drawer-host"
            );

        if (
            !drawerHost
        ) {
            drawerHost =
                document.createElement(
                    "div"
                );

            drawerHost.id =
                "cart-drawer-host";

            document.body.appendChild(
                drawerHost
            );
        }

        loadTasks.push(
            loadComponent(
                "cart-drawer-host",
                "./components/cart-drawer.html"
            )
        );
    }

    await Promise.all(
        loadTasks
    );

    try {
        await loadScript(
            "scripts/cart-drawer.js"
        );
    } catch (error) {
        console.error(
            "Failed to load cart drawer script:",
            error
        );
    }

    // ===== THEME TOGGLE - runs AFTER navbar is loaded =====
    const themeToggle = document.getElementById('theme-toggle');

    if (themeToggle) {
        // Set correct icon on load
        themeToggle.innerHTML = localStorage.getItem('theme') === 'dark' ? '☀️' : '🌙';

        themeToggle.addEventListener('click', function () {
            document.body.classList.toggle('dark-theme');

            if (document.body.classList.contains('dark-theme')) {
                localStorage.setItem('theme', 'dark');
                themeToggle.innerHTML = '☀️';
            } else {
                localStorage.setItem('theme', 'light');
                themeToggle.innerHTML = '🌙';
            }
        });
    }
    // Set active nav link based on current page
const navLinks = document.querySelectorAll('#navbar-links a');
navLinks.forEach(link => {
    if (link.href === window.location.href) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
    }
});
// ===== NAVBAR SEARCH =====
    const navSearchInput = document.getElementById("searchInput");
    if (navSearchInput) {
        navSearchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const query = navSearchInput.value.trim();
                if (query) {
                    window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
                }
            }
        });

        navSearchInput.addEventListener("input", () => {
            const query = navSearchInput.value.trim();
            const dropdown = document.getElementById("suggestionsDropdown");
            if (!dropdown) return;

            if (!query) {
                dropdown.style.display = "none";
                dropdown.innerHTML = "";
                return;
            }

            const allProducts = window.allProducts || [];
            const matches = allProducts
                .filter(p => p.name?.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 5);

            if (!matches.length) {
                dropdown.style.display = "none";
                return;
            }

            dropdown.innerHTML = matches.map(p => `
                <div class="suggestion-item" style="padding:8px;cursor:pointer;border-bottom:1px solid #eee;">
                    ${p.name}
                </div>
            `).join("");

            dropdown.style.display = "block";

            dropdown.querySelectorAll(".suggestion-item").forEach((item, i) => {
                item.addEventListener("click", () => {
                    window.location.href = `shop.html?search=${encodeURIComponent(matches[i].name)}`;
                });
            });
        });

        document.addEventListener("click", (e) => {
            if (!e.target.closest(".search-container")) {
                const dropdown = document.getElementById("suggestionsDropdown");
                if (dropdown) dropdown.style.display = "none";
            }
        });
    }
    // notify components ready
    document.dispatchEvent(new CustomEvent("componentsLoaded"));
}

const user = JSON.parse(localStorage.getItem("user"));

const profileDropdown = document.getElementById("profile-dropdown");

if (user && profileDropdown) {
    profileDropdown.setAttribute("data-loggedin", "true");
}


// init
document.addEventListener("DOMContentLoaded", () => {
    initializeComponents();
});
