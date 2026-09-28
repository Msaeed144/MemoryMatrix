/**
 * Shared auth modal — sign in with phone; sign up with name + phone if needed.
 */
(function (global) {
    const STATE = {
        mode: "login", // login | signup
        initialized: false,
        onSuccess: null,
        onCancel: null,
    };

    function ensureStyles() {
        if (document.getElementById("hamkar-auth-styles")) return;
        const link = document.createElement("link");
        link.id = "hamkar-auth-styles";
        link.rel = "stylesheet";
        const depth = (global.HAMKAR_ASSET_PREFIX || "").replace(/\/?$/, "/");
        // Prefer absolute path from site root when served by nginx
        link.href = "/js/auth.css";
        // Fallback for file:// or nested pages if /js fails — duplicate via inline minimal styles below
        document.head.appendChild(link);

        // Always inject critical styles so games work even if CSS path fails
        const style = document.createElement("style");
        style.id = "hamkar-auth-inline";
        style.textContent = `
#hamkar-auth-overlay{position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;padding:1.25rem;background:rgba(3,7,30,.72);backdrop-filter:blur(6px)}
#hamkar-auth-overlay.open{display:flex}
.hamkar-auth-card{width:min(420px,100%);background:linear-gradient(165deg,#fff8f0 0%,#ffe8c8 100%);color:#03071E;border-radius:20px;padding:1.75rem 1.5rem 1.5rem;box-shadow:0 24px 60px rgba(0,0,0,.35);text-align:left}
.hamkar-auth-card h2{font-size:1.45rem;margin:0 0 .35rem;font-weight:700}
.hamkar-auth-card .auth-sub{margin:0 0 1.25rem;opacity:.75;font-size:.95rem;line-height:1.4}
.hamkar-auth-card label{display:block;font-size:.82rem;font-weight:600;margin:0 0 .35rem;letter-spacing:.02em}
.hamkar-auth-card input{width:100%;padding:.75rem .9rem;border:1.5px solid rgba(106,4,15,.25);border-radius:12px;font-size:1rem;margin-bottom:1rem;background:#fff;color:#03071E}
.hamkar-auth-card input:focus{outline:2px solid #E85D04;border-color:#E85D04}
.hamkar-auth-actions{display:flex;flex-direction:column;gap:.65rem;margin-top:.25rem}
.hamkar-auth-actions button{border:none;border-radius:12px;padding:.85rem 1rem;font-size:1rem;font-weight:700;cursor:pointer}
.hamkar-auth-primary{background:linear-gradient(135deg,#DC2F02,#FAA307);color:#fff}
.hamkar-auth-primary:disabled{opacity:.55;cursor:wait}
.hamkar-auth-secondary{background:transparent;color:#6A040F;text-decoration:underline;font-weight:600;padding:.4rem}
.hamkar-auth-error{min-height:1.25rem;color:#9D0208;font-size:.88rem;margin:0 0 .5rem}
.hamkar-auth-close{position:absolute;top:.75rem;right:.85rem;background:transparent;border:none;font-size:1.4rem;cursor:pointer;color:#6A040F;line-height:1}
.hamkar-auth-card{position:relative}
.hamkar-toast{position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%) translateY(20px);background:#03071E;color:#fff;padding:.75rem 1.25rem;border-radius:12px;z-index:11000;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;max-width:min(90vw,420px);text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.3)}
.hamkar-toast.visible{opacity:1;transform:translateX(-50%) translateY(0)}
.hamkar-toast-error{background:#9D0208}
.hamkar-name-field.hidden{display:none}
`;
        document.head.appendChild(style);
        void depth;
    }

    function ensureDom() {
        if (document.getElementById("hamkar-auth-overlay")) return;

        const overlay = document.createElement("div");
        overlay.id = "hamkar-auth-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "hamkar-auth-title");
        overlay.innerHTML = `
            <div class="hamkar-auth-card">
                <button type="button" class="hamkar-auth-close" id="hamkar-auth-close" aria-label="Close">&times;</button>
                <h2 id="hamkar-auth-title">Sign in</h2>
                <p class="auth-sub" id="hamkar-auth-sub">Enter your phone number to continue.</p>
                <p class="hamkar-auth-error" id="hamkar-auth-error" aria-live="polite"></p>
                <form id="hamkar-auth-form" novalidate>
                    <div class="hamkar-name-field hidden" id="hamkar-name-wrap">
                        <label for="hamkar-auth-name">Your name</label>
                        <input id="hamkar-auth-name" name="name" type="text" autocomplete="name" maxlength="100" placeholder="e.g. Sara">
                    </div>
                    <label for="hamkar-auth-phone">Phone number</label>
                    <input id="hamkar-auth-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="09xxxxxxxxx">
                    <div class="hamkar-auth-actions">
                        <button type="submit" class="hamkar-auth-primary" id="hamkar-auth-submit">Sign in</button>
                        <button type="button" class="hamkar-auth-secondary" id="hamkar-auth-toggle">New here? Create an account</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeModal();
        });
        document.getElementById("hamkar-auth-close").addEventListener("click", closeModal);
        document.getElementById("hamkar-auth-toggle").addEventListener("click", () => {
            setMode(STATE.mode === "login" ? "signup" : "login");
        });
        document.getElementById("hamkar-auth-form").addEventListener("submit", onSubmit);
    }

    function setMode(mode) {
        STATE.mode = mode;
        const isSignup = mode === "signup";
        document.getElementById("hamkar-auth-title").textContent = isSignup ? "Create account" : "Sign in";
        document.getElementById("hamkar-auth-sub").textContent = isSignup
            ? "Enter your name and phone number to create your account."
            : "Enter your phone number to continue.";
        document.getElementById("hamkar-auth-submit").textContent = isSignup ? "Sign up" : "Sign in";
        document.getElementById("hamkar-auth-toggle").textContent = isSignup
            ? "Already have an account? Sign in"
            : "New here? Create an account";
        document.getElementById("hamkar-name-wrap").classList.toggle("hidden", !isSignup);
        document.getElementById("hamkar-auth-error").textContent = "";
        document.getElementById(isSignup ? "hamkar-auth-name" : "hamkar-auth-phone").focus();
    }

    function showNameField() {
        document.getElementById("hamkar-name-wrap").classList.remove("hidden");
    }

    function openModal(options) {
        ensureInit();
        STATE.onSuccess = (options && options.onSuccess) || null;
        STATE.onCancel = (options && options.onCancel) || null;
        setMode((options && options.mode) || "login");
        document.getElementById("hamkar-auth-overlay").classList.add("open");
        document.getElementById("hamkar-auth-phone").value = (options && options.phone) || "";
        if (options && options.name) {
            document.getElementById("hamkar-auth-name").value = options.name;
        }
    }

    function closeModal() {
        const overlay = document.getElementById("hamkar-auth-overlay");
        if (overlay) overlay.classList.remove("open");
        if (typeof STATE.onCancel === "function") {
            const cancel = STATE.onCancel;
            STATE.onCancel = null;
            STATE.onSuccess = null;
            cancel();
        }
    }

    async function onSubmit(event) {
        event.preventDefault();
        const api = global.HamkarAPI;
        if (!api) return;

        const phone = document.getElementById("hamkar-auth-phone").value.trim();
        const name = document.getElementById("hamkar-auth-name").value.trim();
        const errEl = document.getElementById("hamkar-auth-error");
        const submitBtn = document.getElementById("hamkar-auth-submit");
        errEl.textContent = "";

        if (!phone) {
            errEl.textContent = "Please enter your phone number.";
            return;
        }

        if (STATE.mode === "signup" && !name) {
            showNameField();
            errEl.textContent = "Please enter your name.";
            document.getElementById("hamkar-auth-name").focus();
            return;
        }

        submitBtn.disabled = true;
        try {
            let data;
            if (STATE.mode === "signup") {
                data = await api.signup(name, phone);
            } else {
                try {
                    data = await api.login(phone, name);
                } catch (err) {
                    if (err.status === 404) {
                        setMode("signup");
                        errEl.textContent = "No account yet — enter your name to create your account.";
                        submitBtn.disabled = false;
                        return;
                    }
                    if (err.status === 400 && /name/i.test(err.message || "")) {
                        showNameField();
                        errEl.textContent = err.message;
                        document.getElementById("hamkar-auth-name").focus();
                        submitBtn.disabled = false;
                        return;
                    }
                    throw err;
                }
            }
            const success = STATE.onSuccess;
            STATE.onSuccess = null;
            STATE.onCancel = null;
            const overlay = document.getElementById("hamkar-auth-overlay");
            if (overlay) overlay.classList.remove("open");
            renderUserBar();
            const u = data.user;
            const displayName = u
                ? ((u.name && u.name !== "Player" && u.name !== u.phone) ? u.name : (u.phone || u.name || "Player"))
                : "Player";
            api.showToast(`Welcome, ${displayName}!`);
            if (typeof success === "function") {
                success(data.user);
            }
            global.dispatchEvent(new CustomEvent("hamkar:auth", { detail: data.user }));
        } catch (err) {
            if (err.status === 409) {
                setMode("login");
                errEl.textContent = "This phone is already registered. Sign in instead.";
            } else {
                errEl.textContent = err.message || "Something went wrong.";
            }
        } finally {
            submitBtn.disabled = false;
        }
    }

    function renderUserBar() {
        ensureInit();
        const api = global.HamkarAPI;
        const floating = document.getElementById("hamkar-user-bar");
        if (floating) floating.remove();

        const account = document.getElementById("landing-account");
        const labelEl = document.getElementById("landing-account-label");
        const signOutBtn = document.getElementById("landing-signout-btn");

        if (!account) return;

        if (!api || !api.isLoggedIn()) {
            account.hidden = true;
            if (labelEl) labelEl.textContent = "";
            return;
        }

        const user = api.getCachedUser();
        const label = user
            ? ((user.name && user.name !== "Player" && user.name !== user.phone)
                ? user.name
                : (user.phone || user.name || "Player"))
            : "Player";
        if (labelEl) labelEl.textContent = `Signed in as ${label}`;
        account.hidden = false;

        if (signOutBtn && !signOutBtn._hamkarBound) {
            signOutBtn._hamkarBound = true;
            signOutBtn.addEventListener("click", () => {
                api.logout();
                renderUserBar();
                api.showToast("Signed out");
                global.dispatchEvent(new CustomEvent("hamkar:logout"));
            });
        }
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    async function requireAuth(onSuccess) {
        ensureInit();
        const api = global.HamkarAPI;
        if (!api) {
            alert("Auth is not available.");
            return false;
        }
        if (api.isLoggedIn()) {
            try {
                const user = await api.me();
                renderUserBar();
                if (typeof onSuccess === "function") onSuccess(user);
                return true;
            } catch {
                api.logout();
                renderUserBar();
            }
        }
        return new Promise((resolve) => {
            openModal({
                onSuccess: (user) => {
                    if (typeof onSuccess === "function") onSuccess(user);
                    resolve(true);
                },
                onCancel: () => resolve(false),
            });
        });
    }

    function ensureInit() {
        if (STATE.initialized) return;
        ensureStyles();
        ensureDom();
        STATE.initialized = true;
    }

    function init() {
        ensureInit();
        renderUserBar();
        if (global.HamkarAPI && global.HamkarAPI.isLoggedIn()) {
            global.HamkarAPI.me().then(renderUserBar).catch(() => {
                global.HamkarAPI.logout();
                renderUserBar();
            });
        }
    }

    global.HamkarAuth = {
        openModal,
        closeModal,
        requireAuth,
        renderUserBar,
        init,
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})(window);
