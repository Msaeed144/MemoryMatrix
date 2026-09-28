/**
 * Hamkar Games API client — talks to FastAPI via same-origin /api
 */
(function (global) {
    const TOKEN_KEY = "hamkar_token";
    const USER_KEY = "hamkar_user";

    function apiBase() {
        if (typeof global.HAMKAR_API_BASE === "string" && global.HAMKAR_API_BASE) {
            return global.HAMKAR_API_BASE.replace(/\/$/, "");
        }
        return "/api";
    }

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function setSession(token, user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    function clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    function getCachedUser() {
        try {
            const raw = localStorage.getItem(USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    async function request(path, options = {}) {
        const headers = Object.assign(
            { "Content-Type": "application/json", Accept: "application/json" },
            options.headers || {}
        );
        const token = getToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        let response;
        try {
            response = await fetch(`${apiBase()}${path}`, {
                ...options,
                headers,
            });
        } catch (err) {
            const error = new Error("Cannot reach the server. Check your connection and try again.");
            error.cause = err;
            error.status = 0;
            throw error;
        }

        let data = null;
        const text = await response.text();
        if (text) {
            try {
                data = JSON.parse(text);
            } catch {
                data = { detail: text };
            }
        }

        if (!response.ok) {
            let message = "Request failed";
            if (data && data.detail) {
                if (typeof data.detail === "string") {
                    message = data.detail;
                } else if (Array.isArray(data.detail)) {
                    message = data.detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
                }
            }
            const error = new Error(message);
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    }

    async function signup(name, phone) {
        const body = { name: String(name || "").trim(), phone };
        const data = await request("/auth/signup", {
            method: "POST",
            body: JSON.stringify(body),
        });
        setSession(data.access_token, data.user);
        return data;
    }

    function formatPlayerLabel(rowOrName, phone) {
        let name = "";
        let phoneVal = "";
        if (rowOrName && typeof rowOrName === "object") {
            name = (rowOrName.player_name || rowOrName.name || "").trim();
            phoneVal = (rowOrName.player_phone || rowOrName.phone || "").trim();
            // player_name may be a combined "name · phone" label from the API
            if (name.includes(" · ")) {
                name = name.split(" · ")[0].trim();
            }
            if (name === phoneVal) {
                name = "";
            }
        } else {
            name = String(rowOrName || "").trim();
            phoneVal = String(phone || "").trim();
        }
        return name || phoneVal || "Player";
    }

    async function login(phone, name) {
        const body = { phone };
        const cleanName = String(name || "").trim();
        if (cleanName) {
            body.name = cleanName;
        }
        const data = await request("/auth/login", {
            method: "POST",
            body: JSON.stringify(body),
        });
        setSession(data.access_token, data.user);
        return data;
    }

    async function me() {
        const user = await request("/auth/me");
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
    }

    async function saveScore(payload) {
        // Trailing slash matches FastAPI route and avoids auth-losing redirects
        return request("/scores/", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    }

    async function myScores(game, limit = 50) {
        const params = new URLSearchParams();
        if (game) params.set("game", game);
        params.set("limit", String(limit));
        return request(`/scores/me?${params.toString()}`);
    }

    async function leaderboard(game, limit = 20) {
        const params = new URLSearchParams({ game, limit: String(limit) });
        return request(`/scores/leaderboard?${params.toString()}`);
    }

    function isLoggedIn() {
        return Boolean(getToken());
    }

    function logout() {
        clearSession();
    }

    function showToast(message, isError) {
        let el = document.getElementById("hamkar-toast");
        if (!el) {
            el = document.createElement("div");
            el.id = "hamkar-toast";
            el.setAttribute("role", "status");
            document.body.appendChild(el);
        }
        el.textContent = message;
        el.className = "hamkar-toast" + (isError ? " hamkar-toast-error" : "");
        el.classList.add("visible");
        clearTimeout(el._hideTimer);
        el._hideTimer = setTimeout(() => el.classList.remove("visible"), 3500);
    }

    global.HamkarAPI = {
        TOKEN_KEY,
        USER_KEY,
        getToken,
        getCachedUser,
        isLoggedIn,
        logout,
        signup,
        login,
        me,
        saveScore,
        myScores,
        leaderboard,
        formatPlayerLabel,
        showToast,
        request,
    };
})(window);
