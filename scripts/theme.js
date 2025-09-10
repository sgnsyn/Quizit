
const themeRadios = document.querySelectorAll('input[name="theme"]');
const body = document.body;

function applyTheme(theme) {
    if (theme === 'light') {
        body.classList.add('light');
    } else {
        body.classList.remove('light');
    }
}

function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    }
    return 'light'; // Default to light if preference cannot be determined
}

function saveTheme(theme) {
    localStorage.setItem('theme', theme);
}

function loadTheme() {
    return localStorage.getItem('theme') || 'system';
}

function updateRadioButtons(theme) {
    const radio = document.querySelector(`input[name="theme"][value="${theme}"]`);
    if (radio) {
        radio.checked = true;
    }
}

export function initTheme() {
    const configPopup = document.querySelector(".config-popup");
    const backdrop = document.querySelector(".popup-backdrop");

    const closePopup = () => {
        configPopup.classList.add("disabled");
        backdrop.classList.add("disabled");
    };

    let savedTheme = loadTheme();
    saveTheme(savedTheme);
    let themeToApply;

    if (savedTheme === 'system') {
        themeToApply = getSystemTheme();
    } else {
        themeToApply = savedTheme;
    }

    applyTheme(themeToApply);
    updateRadioButtons(savedTheme);

    themeRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            const newTheme = event.target.value;
            saveTheme(newTheme);
            if (newTheme === 'system') {
                themeToApply = getSystemTheme();
            } else {
                themeToApply = newTheme;
            }
            applyTheme(themeToApply);
            closePopup();
        });
    });

    // Listen for changes in system theme
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (loadTheme() === 'system') {
                const newSystemTheme = e.matches ? 'dark' : 'light';
                applyTheme(newSystemTheme);
            }
        });
    }

    const settingsBtn = document.querySelector(".settings-btn");
    const closeBtn = configPopup.querySelector(".close-popup-btn");

    settingsBtn.addEventListener("click", () => {
        configPopup.classList.remove("disabled");
        backdrop.classList.remove("disabled");
    });

    closeBtn.addEventListener("click", closePopup);
    backdrop.addEventListener("click", closePopup);
}
