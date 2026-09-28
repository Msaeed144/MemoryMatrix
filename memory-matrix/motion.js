(function () {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const svg = (path) =>
        `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;

    const ICONS = {
        "fa-bars": svg("M4 7h16M4 12h16M4 17h16"),
        "fa-home": svg("M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5z"),
        "fa-user": svg("M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 8a7 7 0 0 1 14 0"),
        "fa-user-friends": svg("M8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8 1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 16 12zM2.5 19a5.5 5.5 0 0 1 11 0M13 19a4.5 4.5 0 0 1 8.2-2.5"),
        "fa-smile": svg("M8 10h.01M16 10h.01M8.5 15a4.5 4.5 0 0 0 7 0M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9z"),
        "fa-meh": svg("M8 10h.01M16 10h.01M8 15h8M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9z"),
        "fa-fire": svg("M12 3s1 3 1 5a3 3 0 0 1-2 2c2 0 4 2 4 5a5 5 0 1 1-8-4c1 2 2 2 2 2 0-3 3-6 3-10z"),
        "fa-skull": svg("M8 10h.01M16 10h.01M9 16v2M12 16v2M15 16v2M12 3a7 7 0 0 0-7 7c0 3 2 5 3 6v3h8v-3c1-1 3-3 3-6a7 7 0 0 0-7-7z"),
        "fa-forward": svg("M4 6v12l8-6-8-6zm9 0v12l8-6-8-6z"),
        "fa-bolt": svg("M13 2 4 14h7l-1 8 9-12h-7l1-8z"),
        "fa-clock": svg("M12 7v5l3 2M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9z"),
        "fa-history": svg("M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2"),
        "fa-chart-bar": svg("M4 20V10M10 20V4M16 20v-7M22 20H2"),
        "fa-pause": svg("M8 5h3v14H8zM13 5h3v14h-3z"),
        "fa-play": svg("M8 5v14l11-7-11-7z"),
        "fa-redo": svg("M20 12a8 8 0 1 1-2.3-5.7L20 8M20 3v5h-5"),
        "fa-cog": svg("M12 15.5A3.5 3.5 0 1 0 8.5 12 3.5 3.5 0 0 0 12 15.5zM19.4 13a7.7 7.7 0 0 0 .1-2l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15 3h-6l-.4 2.5a8 8 0 0 0-1.7 1l-2.4-1-2 3.5L4.5 11a7.7 7.7 0 0 0 .1 2l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1L9 21h6l.4-2.5a8 8 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5z"),
        "fa-share": svg("M16 8a3 3 0 1 0-2.8-4L8.5 7.2a3 3 0 1 0 0 4.6l4.7 2.7a3 3 0 1 0 .9-1.8l-4.3-2.5a3 3 0 0 0 0-1.4l4.3-2.5A3 3 0 0 0 16 8z"),
        "fa-download": svg("M12 4v10m0 0 4-4m-4 4-4-4M5 20h14"),
        "fa-terminal": svg("M5 7l5 5-5 5M12 17h7")
    };

    const CLEAR = "opacity,visibility,transform";

    function mountIcons(root) {
        (root || document).querySelectorAll("i.fas").forEach((icon) => {
            if (icon.dataset.iconReady === "1") return;
            const name = Array.from(icon.classList).find((cls) => ICONS[cls]);
            if (!name) return;
            icon.innerHTML = ICONS[name];
            icon.dataset.iconReady = "1";
        });
    }

    function enterScreen(id) {
        const screen = document.getElementById(id);
        if (!screen || reduceMotion || typeof gsap === "undefined") return;
        gsap.fromTo(screen, { autoAlpha: 0, y: 12 }, {
            autoAlpha: 1,
            y: 0,
            duration: 0.4,
            ease: "power3.out",
            clearProps: CLEAR
        });
    }

    function enterMenu() {
        const menu = document.querySelector("#mainMenu .menu-container");
        if (!menu || reduceMotion || typeof gsap === "undefined") return;
        gsap.fromTo(menu, { autoAlpha: 0, y: 10 }, {
            autoAlpha: 1,
            y: 0,
            duration: 0.35,
            ease: "power3.out",
            clearProps: CLEAR
        });
    }

    function playIntro() {
        mountIcons(document);
        if (reduceMotion || typeof gsap === "undefined") return;

        const targets = "#mainMenu .logo-wrapper, #mainMenu .game-title, #mainMenu .play-button-container, #mainMenu .main-page-btn, #mainMenu .player-mode-container, #mainMenu .difficulty-selection, #mainMenu .game-mode-selection, #mainMenu .score-history-btn, #mainMenu .stats-btn";

        gsap.from(targets, {
            y: 14,
            autoAlpha: 0,
            duration: 0.45,
            stagger: 0.04,
            ease: "power3.out",
            clearProps: CLEAR
        });

        const play = document.querySelector("#mainMenu .play-btn");
        if (!play) return;
        play.addEventListener("pointerenter", (event) => {
            if (event.pointerType !== "mouse") return;
            gsap.to(play, { scale: 1.04, duration: 0.3, ease: "power3.out" });
        });
        play.addEventListener("pointerleave", () => {
            gsap.to(play, { scale: 1, duration: 0.35, ease: "power3.out" });
        });
        play.addEventListener("pointerdown", () => {
            gsap.to(play, { scale: 0.97, duration: 0.1, ease: "power2.out" });
        });
    }

    window.HamkarMotion = { enterScreen, enterMenu, mountIcons };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", playIntro);
    } else {
        playIntro();
    }
})();
