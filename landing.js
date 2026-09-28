(function () {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let leaving = false;
    let currentBoard = "match";

    gsap.defaults({ ease: "power3.out", overwrite: "auto" });

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function playIntro() {
        if (reduceMotion) return;

        const tl = gsap.timeline();
        tl.from(".logo-wrapper", {
            y: 26,
            autoAlpha: 0,
            scale: 0.94,
            stagger: 0.1,
            duration: 0.7
        })
            .from(".main-title", { y: 16, autoAlpha: 0, duration: 0.55 }, "-=0.42")
            .from(".subtitle", { y: 12, autoAlpha: 0, duration: 0.45 }, "-=0.34")
            .from(".auth-hint", { y: 10, autoAlpha: 0, duration: 0.4 }, "-=0.3")
            .from(".game-btn", { y: 32, autoAlpha: 0, stagger: 0.1, duration: 0.65 }, "-=0.28")
            .from(".leaderboard-section", { y: 20, autoAlpha: 0, duration: 0.5 }, "-=0.25")
            .from(".footer-text", { autoAlpha: 0, duration: 0.4 }, "-=0.3");

        gsap.to(".orb-a", { x: 36, y: -28, duration: 7.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
        gsap.to(".orb-b", { x: -32, y: 22, duration: 9, ease: "sine.inOut", yoyo: true, repeat: -1 });
        gsap.to(".orb-c", { x: 18, y: 16, duration: 8, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }

    function updateAuthHint() {
        const hint = document.getElementById("auth-hint");
        if (!hint || !window.HamkarAPI) return;
        // Signed-in status is shown in the bottom account block; keep hint short
        if (window.HamkarAPI.isLoggedIn()) {
            hint.textContent = "Pick a game to play. Scores save automatically.";
        } else {
            hint.textContent = "Sign in with your phone to save scores across devices.";
        }
    }

    async function loadLandingLeaderboard(game) {
        const panel = document.getElementById("landing-leaderboard");
        if (!panel || !window.HamkarAPI) return;
        currentBoard = game || currentBoard;
        panel.innerHTML = '<p class="leaderboard-empty">Loading…</p>';

        try {
            const scores = await window.HamkarAPI.leaderboard(currentBoard, 10);
            if (!scores.length) {
                panel.innerHTML = '<p class="leaderboard-empty">No scores yet. Be the first!</p>';
                return;
            }
            panel.innerHTML = scores
                .map((row, index) => {
                    const name = escapeHtml(
                        (window.HamkarAPI && window.HamkarAPI.formatPlayerLabel
                            ? window.HamkarAPI.formatPlayerLabel(row)
                            : row.player_name) || "Player"
                    );
                    const extra =
                        currentBoard === "matrix" && row.level != null
                            ? ` · Lv ${row.level}`
                            : "";
                    return `
                        <div class="lb-row${index === 0 ? " lb-top" : ""}">
                            <span class="lb-rank">#${index + 1}</span>
                            <span class="lb-name">${name}${extra}</span>
                            <span class="lb-score">${row.score}</span>
                        </div>
                    `;
                })
                .join("");
        } catch (err) {
            panel.innerHTML = `<p class="leaderboard-empty">${escapeHtml(err.message || "Could not load leaderboard")}</p>`;
        }
    }

    function setupLeaderboardTabs() {
        document.querySelectorAll(".leaderboard-tab").forEach((tab) => {
            tab.addEventListener("click", () => {
                document.querySelectorAll(".leaderboard-tab").forEach((t) => {
                    t.classList.remove("active");
                    t.setAttribute("aria-selected", "false");
                });
                tab.classList.add("active");
                tab.setAttribute("aria-selected", "true");
                loadLandingLeaderboard(tab.getAttribute("data-game"));
            });
        });
    }

    document.querySelectorAll(".game-btn").forEach((btn) => {
        const icon = btn.querySelector(".game-icon");

        btn.addEventListener("pointerenter", (event) => {
            if (reduceMotion || event.pointerType !== "mouse") return;
            gsap.to(btn, { y: -8, scale: 1.02, duration: 0.45, ease: "power3.out" });
            if (icon) gsap.to(icon, { y: -3, rotation: -6, scale: 1.06, duration: 0.45, ease: "power3.out" });
        });

        btn.addEventListener("pointerleave", (event) => {
            if (reduceMotion || event.pointerType !== "mouse") return;
            gsap.to(btn, { y: 0, scale: 1, duration: 0.55, ease: "power3.out" });
            if (icon) gsap.to(icon, { y: 0, rotation: 0, scale: 1, duration: 0.55, ease: "power3.out" });
        });

        btn.addEventListener("pointerdown", () => {
            if (reduceMotion) return;
            gsap.to(btn, { scale: 0.98, duration: 0.12, ease: "power2.out" });
        });

        btn.addEventListener("pointerup", (event) => {
            if (reduceMotion || event.pointerType !== "mouse") return;
            gsap.to(btn, { scale: 1.02, duration: 0.22, ease: "power2.out" });
        });

        btn.addEventListener("pointercancel", () => {
            if (reduceMotion) return;
            gsap.to(btn, { y: 0, scale: 1, duration: 0.3, ease: "power2.out" });
        });

        btn.addEventListener("click", () => {
            const game = btn.getAttribute("data-game");
            if (game) selectGame(game);
        });
    });

    window.selectGame = function (game) {
        if (leaving) return;

        const routes = {
            "memory-matrix": "memory-matrix/index.html",
            "on-click": "on-click/index.html"
        };
        const href = routes[game];
        if (!href) return;

        const go = () => {
            if (reduceMotion) {
                window.location.href = href;
                return;
            }

            leaving = true;
            gsap.timeline({
                onComplete: () => {
                    window.location.href = href;
                }
            })
                .to(".game-btn", { y: 14, autoAlpha: 0, stagger: 0.04, duration: 0.26, ease: "power2.in" })
                .to(".landing-container", { y: -18, autoAlpha: 0, duration: 0.3, ease: "power2.in" }, "<0.06");
        };

        if (!window.HamkarAuth || !window.HamkarAPI) {
            go();
            return;
        }

        window.HamkarAuth.requireAuth(() => {
            updateAuthHint();
            go();
        });
    };

    window.addEventListener("hamkar:auth", updateAuthHint);
    window.addEventListener("hamkar:logout", updateAuthHint);

    function boot() {
        updateAuthHint();
        setupLeaderboardTabs();
        loadLandingLeaderboard("match");
        playIntro();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
