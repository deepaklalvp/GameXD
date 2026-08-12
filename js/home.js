/* =========================================================
   GAMEXD — MODERN GAMING DASHBOARD
   ========================================================= */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');


/* =========================================================
   RESET
   ========================================================= */

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
}

html {
    scroll-behavior: smooth;
}

html,
body {
    width: 100%;
    min-height: 100%;
    overflow-x: hidden;
}

body {
    min-height: 100vh;
    background: #070b16;
    color: #f8fafc;
}


/* =========================================================
   BACKGROUND
   ========================================================= */

.background {
    position: fixed;
    inset: 0;
    overflow: hidden;
    z-index: -10;

    background:
        radial-gradient(
            circle at 10% 10%,
            rgba(99, 102, 241, .18),
            transparent 35%
        ),
        radial-gradient(
            circle at 90% 20%,
            rgba(6, 182, 212, .13),
            transparent 35%
        ),
        radial-gradient(
            circle at 50% 100%,
            rgba(168, 85, 247, .14),
            transparent 40%
        ),
        #070b16;
}

.background::before,
.background::after {
    content: "";

    position: absolute;

    width: 280px;
    height: 280px;

    border-radius: 50%;

    filter: blur(90px);

    opacity: .25;

    animation:
        backgroundFloat
        12s
        ease-in-out
        infinite
        alternate;
}

.background::before {
    background: #6366f1;

    top: -100px;
    left: -100px;
}

.background::after {
    background: #06b6d4;

    right: -120px;
    bottom: -100px;

    animation-delay: 3s;
}

@keyframes backgroundFloat {

    from {
        transform:
            translate(0, 0)
            scale(1);
    }

    to {
        transform:
            translate(60px, -40px)
            scale(1.25);
    }
}


/* =========================================================
   BACKGROUND PARTICLES
   ========================================================= */

.background span {
    position: absolute;

    display: block;

    width: 5px;
    height: 5px;

    border-radius: 50%;

    background: #60a5fa;

    box-shadow:
        0 0 10px #60a5fa,
        0 0 20px rgba(96, 165, 250, .5);

    opacity: .65;

    animation:
        particleFloat
        10s
        infinite
        ease-in-out;
}

.background span:nth-child(1) {
    top: 18%;
    left: 12%;
    animation-duration: 9s;
}

.background span:nth-child(2) {
    top: 35%;
    right: 15%;
    animation-duration: 12s;
}

.background span:nth-child(3) {
    bottom: 20%;
    left: 25%;
    animation-duration: 15s;
}

.background span:nth-child(4) {
    bottom: 30%;
    right: 30%;
    animation-duration: 11s;
}

.background span:nth-child(5) {
    top: 60%;
    left: 60%;
    animation-duration: 14s;
}

@keyframes particleFloat {

    0% {
        transform:
            translateY(0)
            scale(1);

        opacity: .35;
    }

    50% {
        transform:
            translateY(-35px)
            scale(1.4);

        opacity: .8;
    }

    100% {
        transform:
            translateY(0)
            scale(1);

        opacity: .35;
    }
}


/* =========================================================
   NAVBAR
   ========================================================= */

.navbar {
    position: sticky;
    top: 0;

    z-index: 1000;

    width: 100%;

    display: flex;

    justify-content: space-between;
    align-items: center;

    min-height: 64px;

    padding: 10px 24px;

    background:
        rgba(7, 11, 22, .72);

    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);

    border-bottom:
        1px solid rgba(255, 255, 255, .07);
}


/* Logo */

.navbar h2 {
    font-size: 20px;

    font-weight: 800;

    letter-spacing: -.4px;

    cursor: pointer;

    background:
        linear-gradient(
            90deg,
            #ffffff,
            #93c5fd
        );

    -webkit-background-clip: text;
    background-clip: text;

    color: transparent;
}


/* Right side */

.navbar .right {
    display: flex;

    align-items: center;
    justify-content: flex-end;

    gap: 8px;

    flex-wrap: wrap;
}


/* User pills */

#userName,
#userPoints {
    display: inline-flex;

    align-items: center;

    min-height: 32px;

    padding: 6px 11px;

    border-radius: 999px;

    background:
        rgba(255, 255, 255, .055);

    border:
        1px solid rgba(255, 255, 255, .07);

    color: #e2e8f0;

    font-size: 12px;

    font-weight: 500;

    white-space: nowrap;
}

#userPoints {
    color: #facc15;
    font-weight: 700;
}


/* Navbar button */

.navbar .right button {
    border:
        1px solid rgba(255, 255, 255, .08);

    border-radius: 999px;

    padding: 8px 13px;

    background:
        rgba(255, 255, 255, .06);

    color: #fff;

    cursor: pointer;

    font-size: 12px;

    font-weight: 600;

    transition:
        transform .2s ease,
        background .2s ease,
        border-color .2s ease;
}

.navbar .right button:hover {
    transform: translateY(-2px);

    background:
        rgba(255, 255, 255, .12);

    border-color:
        rgba(255, 255, 255, .16);
}


/* =========================================================
   PROFILE BUTTON
   ========================================================= */

.profile-btn {
    width: 40px;
    height: 40px;

    display: flex;

    align-items: center;
    justify-content: center;

    border-radius: 50%;

    background:
        linear-gradient(
            135deg,
            #6366f1,
            #06b6d4
        );

    color: white;

    font-size: 22px;

    cursor: pointer;

    border:
        2px solid rgba(255,255,255,.15);

    box-shadow:
        0 5px 20px rgba(99,102,241,.25);

    transition:
        transform .25s ease,
        box-shadow .25s ease;
}

.profile-btn:hover {
    transform: scale(1.08);

    box-shadow:
        0 8px 28px rgba(99,102,241,.4);
}

.profile-btn:focus-visible {
    outline: 2px solid #60a5fa;
    outline-offset: 3px;
}


/* =========================================================
   DRAWER BACKDROP
   ========================================================= */

.drawer-backdrop {
    position: fixed;

    inset: 0;

    background:
        rgba(0, 0, 0, .55);

    backdrop-filter:
        blur(3px);

    -webkit-backdrop-filter:
        blur(3px);

    opacity: 0;

    visibility: hidden;

    pointer-events: none;

    transition:
        opacity .3s ease,
        visibility .3s ease;

    z-index: 1500;
}


/* Backdrop becomes active */

.drawer-backdrop.show {
    opacity: 1;

    visibility: visible;

    pointer-events: auto;
}


/* =========================================================
   MAIN CONTAINER
   ========================================================= */

.container {
    width:
        min(1180px, 100%);

    margin:
        0 auto;

    padding:
        42px 22px
        70px;
}


/* Heading */

.container > h1 {
    font-size:
        clamp(28px, 4vw, 42px);

    font-weight: 800;

    letter-spacing: -1.2px;

    line-height: 1.1;

    background:
        linear-gradient(
            90deg,
            #ffffff,
            #a5b4fc,
            #67e8f9
        );

    -webkit-background-clip: text;
    background-clip: text;

    color: transparent;
}


/* Subtitle */

.container > p {
    margin-top: 10px;

    color: #94a3b8;

    font-size: 14px;

    line-height: 1.6;
}


/* =========================================================
   GAME GRID
   ========================================================= */

.games {
    display: grid;

    grid-template-columns:
        repeat(4, minmax(0, 1fr));

    gap: 18px;

    margin-top: 30px;
}


/* =========================================================
   GAME CARD
   ========================================================= */

.card {
    position: relative;

    min-height: 190px;

    padding: 22px;

    display: flex;

    flex-direction: column;

    align-items: flex-start;

    justify-content: space-between;

    gap: 12px;

    overflow: hidden;

    border-radius: 22px;

    background:
        linear-gradient(
            145deg,
            rgba(255,255,255,.085),
            rgba(255,255,255,.025)
        );

    border:
        1px solid rgba(255,255,255,.09);

    backdrop-filter:
        blur(18px);

    -webkit-backdrop-filter:
        blur(18px);

    box-shadow:
        0 15px 40px rgba(0,0,0,.22);

    cursor: pointer;

    transition:
        transform .28s ease,
        border-color .28s ease,
        box-shadow .28s ease,
        background .28s ease;
}

.card::before {
    content: "";

    position: absolute;

    width: 150px;
    height: 150px;

    top: -70px;
    right: -60px;

    border-radius: 50%;

    background: #6366f1;

    filter: blur(65px);

    opacity: .18;

    transition: opacity .3s ease;
}

.card::after {
    content: "";

    position: absolute;

    left: 15%;
    right: 15%;

    bottom: 0;

    height: 1px;

    background:
        linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.25),
            transparent
        );

    opacity: .5;
}

.card:hover {
    transform: translateY(-7px);

    background:
        linear-gradient(
            145deg,
            rgba(255,255,255,.11),
            rgba(255,255,255,.04)
        );

    border-color:
        rgba(129, 140, 248, .35);

    box-shadow:
        0 20px 55px rgba(0,0,0,.3),
        0 0 30px rgba(99,102,241,.08);
}

.card:hover::before {
    opacity: .3;
}


/* =========================================================
   GAME ICON
   ========================================================= */

.card i {
    position: relative;
    z-index: 2;

    width: 58px;
    height: 58px;

    display: flex;

    align-items: center;
    justify-content: center;

    border-radius: 18px;

    font-size: 27px;

    color: #fff;

    background:
        linear-gradient(
            135deg,
            rgba(99,102,241,.9),
            rgba(6,182,212,.8)
        );

    box-shadow:
        0 8px 25px rgba(6,182,212,.18);

    transition:
        transform .25s ease,
        box-shadow .25s ease;
}

.card:hover i {
    transform:
        scale(1.08)
        rotate(-3deg);

    box-shadow:
        0 10px 35px rgba(99,102,241,.3);
}


/* Icon colors */

.card:nth-child(2) i {
    background:
        linear-gradient(
            135deg,
            #ef4444,
            #f97316
        );
}

.card:nth-child(3) i {
    background:
        linear-gradient(
            135deg,
            #22c55e,
            #14b8a6
        );
}

.card:nth-child(4) i {
    background:
        linear-gradient(
            135deg,
            #f59e0b,
            #ef4444
        );
}


/* =========================================================
   CARD TEXT
   ========================================================= */

.card h3 {
    position: relative;
    z-index: 2;

    font-size: 17px;

    font-weight: 700;

    color: #f8fafc;
}

.card p {
    position: relative;
    z-index: 2;

    margin: 0;

    color: #94a3b8;

    font-size: 12px;

    line-height: 1.5;

    text-align: left;
}


/* =========================================================
   COMING SOON
   ========================================================= */

.coming-soon {
    position: relative;

    opacity: .58;

    cursor: not-allowed;

    filter: saturate(.65);
}

.coming-soon:hover {
    transform: none;

    background:
        linear-gradient(
            145deg,
            rgba(255,255,255,.085),
            rgba(255,255,255,.025)
        );

    border-color:
        rgba(255,255,255,.09);

    box-shadow:
        0 15px 40px rgba(0,0,0,.22);
}

.coming-badge {
    position: absolute;

    top: 15px;
    right: -40px;

    padding: 5px 45px;

    transform: rotate(35deg);

    background:
        linear-gradient(
            90deg,
            #f59e0b,
            #f97316
        );

    color: white;

    font-size: 9px;

    font-weight: 800;

    letter-spacing: .8px;

    text-transform: uppercase;
}


/* =========================================================
   PROFILE DRAWER
   ========================================================= */

.profile-menu {
    position: fixed;

    top: 0;
    right: 0;

    width:
        min(340px, 88vw);

    height: 100vh;

    padding:
        25px 20px;

    background:
        linear-gradient(
            180deg,
            rgba(15,23,42,.98),
            rgba(7,11,22,.99)
        );

    backdrop-filter:
        blur(25px);

    -webkit-backdrop-filter:
        blur(25px);

    border-left:
        1px solid rgba(255,255,255,.08);

    transform:
        translateX(100%);

    transition:
        transform .3s cubic-bezier(.4,0,.2,1);

    z-index: 2000;

    box-shadow:
        -20px 0 60px rgba(0,0,0,.35);

    overflow-y: auto;
}


/* OPEN DRAWER */

.profile-menu.show {
    transform:
        translateX(0);
}


/* Profile header */

.profile-header {
    text-align: center;

    padding:
        30px 10px 22px;
}

.profile-header h3 {
    margin-top: 14px;

    font-size: 20px;
}

.profile-header p {
    margin-top: 6px;

    color: #94a3b8;

    font-size: 12px;
}


/* Avatar */

.avatar-circle {
    width: 88px;
    height: 88px;

    display: flex;

    align-items: center;
    justify-content: center;

    margin: 0 auto;

    border-radius: 50%;

    color: white;

    font-size: 30px;

    font-weight: 800;

    text-transform: uppercase;

    border:
        3px solid rgba(255,255,255,.15);

    background:
        linear-gradient(
            135deg,
            #6366f1,
            #06b6d4
        );

    box-shadow:
        0 0 35px rgba(99,102,241,.25);
}


/* Divider */

.profile-menu hr {
    border: none;

    height: 1px;

    margin: 8px 0;

    background:
        rgba(255,255,255,.07);
}


/* Drawer buttons */

.profile-menu button {
    width: 100%;

    display: flex;

    align-items: center;

    gap: 12px;

    padding: 14px 15px;

    margin: 4px 0;

    border: none;

    border-radius: 13px;

    background: transparent;

    color: #e2e8f0;

    font-size: 14px;

    text-align: left;

    cursor: pointer;

    transition: .2s ease;
}

.profile-menu button:hover {
    background:
        rgba(255,255,255,.07);

    transform:
        translateX(3px);
}

.profile-menu button i {
    width: 20px;

    text-align: center;
}

.logout {
    color: #fb7185 !important;
}


/* =========================================================
   FOOTER
   ========================================================= */

.footer {
    margin-top: 40px;

    padding:
        35px 20px
        30px;

    text-align: center;

    background:
        rgba(255,255,255,.025);

    border-top:
        1px solid rgba(255,255,255,.07);
}

.footer-logo {
    font-size: 21px;

    font-weight: 800;
}

.footer-logo span {
    margin-left: 5px;
}

.footer-tagline {
    margin-top: 8px;

    color: #64748b;

    font-size: 12px;
}

.footer-links {
    display: flex;

    justify-content: center;

    flex-wrap: wrap;

    gap: 20px;

    margin: 22px 0;
}

.footer-links a {
    color: #94a3b8;

    font-size: 12px;

    text-decoration: none;

    transition: .2s;
}

.footer-links a:hover {
    color: #60a5fa;
}

.footer-online {
    display: flex;

    justify-content: center;
    align-items: center;

    gap: 7px;

    margin: 15px 0;

    color: #cbd5e1;

    font-size: 12px;
}

.footer-online i {
    color: #22c55e;

    font-size: 8px;

    animation:
        onlinePulse
        1.7s
        infinite;
}

@keyframes onlinePulse {

    0%,
    100% {
        opacity: .45;
        transform: scale(1);
    }

    50% {
        opacity: 1;
        transform: scale(1.5);
    }
}

.footer-social {
    display: flex;

    justify-content: center;

    gap: 15px;

    margin: 18px 0;
}

.footer-social a {
    width: 38px;
    height: 38px;

    display: flex;

    align-items: center;
    justify-content: center;

    border-radius: 50%;

    background:
        rgba(255,255,255,.05);

    color: #cbd5e1;

    font-size: 17px;

    text-decoration: none;

    transition: .25s;
}

.footer-social a:hover {
    transform:
        translateY(-3px);

    color: white;

    background:
        rgba(99,102,241,.25);
}

.footer-copy,
.footer-version {
    color: #64748b;

    font-size: 11px;

    margin-top: 7px;
}


/* =========================================================
   TABLET
   ========================================================= */

@media (max-width: 900px) {

    .container {
        padding-top: 35px;
    }

    .games {
        grid-template-columns:
            repeat(2, minmax(0, 1fr));
    }
}


/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 600px) {

    .navbar {
        min-height: auto;

        padding: 11px 12px;

        gap: 9px;
    }

    .navbar h2 {
        font-size: 18px;
    }

    .navbar .right {
        gap: 5px;
    }

    #userName,
    #userPoints {
        min-height: 28px;

        padding: 5px 8px;

        font-size: 10px;
    }

    .leaderboard-text {
        display: none;
    }

    .navbar .right button {
        padding: 6px 9px;

        font-size: 10px;
    }

    .profile-btn {
        width: 34px;
        height: 34px;

        font-size: 18px;
    }

    .container {
        padding:
            28px 12px
            45px;
    }

    .container > h1 {
        font-size: 28px;
    }

    .container > p {
        font-size: 13px;
    }

    .games {
        grid-template-columns:
            repeat(2, minmax(0, 1fr));

        gap: 11px;

        margin-top: 24px;
    }

    .card {
        min-height: 175px;

        padding: 15px;

        border-radius: 18px;
    }

    .card i {
        width: 48px;
        height: 48px;

        border-radius: 15px;

        font-size: 23px;
    }

    .card h3 {
        font-size: 14px;
    }

    .card p {
        font-size: 10px;

        line-height: 1.4;
    }

    .profile-menu {
        width: 88vw;
    }
}


/* =========================================================
   VERY SMALL PHONES
   ========================================================= */

@media (max-width: 380px) {

    .navbar {
        padding: 9px;
    }

    .navbar h2 {
        font-size: 16px;
    }

    #userName {
        display: none;
    }

    #userPoints {
        font-size: 9px;
    }

    .container {
        padding-left: 9px;
        padding-right: 9px;
    }

    .games {
        gap: 9px;
    }

    .card {
        padding: 13px;

        border-radius: 16px;
    }

    .card i {
        width: 43px;
        height: 43px;

        font-size: 20px;
    }
}


/* =========================================================
   DRAWER OPEN — PREVENT BACKGROUND SCROLL
   ========================================================= */

body.drawer-open {
    overflow: hidden;
}


/* =========================================================
   ACCESSIBILITY
   ========================================================= */

@media (prefers-reduced-motion: reduce) {

    *,
    *::before,
    *::after {

        animation-duration:
            .01ms !important;

        animation-iteration-count:
            1 !important;

        transition-duration:
            .01ms !important;

        scroll-behavior:
            auto !important;
    }
}
