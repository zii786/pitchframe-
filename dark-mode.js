// Dark Mode Functionality
class DarkMode {
    constructor() {
        this.darkModeToggle = document.getElementById('darkMode');
        this.autoDarkModeToggle = document.getElementById('autoDarkMode');
        this.init();
    }

    init() {
        // Load saved preferences
        this.loadPreferences();

        // Add event listeners
        if (this.darkModeToggle) {
            this.darkModeToggle.addEventListener('change', () => this.toggleDarkMode());
        }
        if (this.autoDarkModeToggle) {
            this.autoDarkModeToggle.addEventListener('change', () => this.toggleAutoDarkMode());
        }

        // Listen for system color scheme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (this.isAutoDarkModeEnabled()) {
                this.setDarkMode(e.matches);
            }
        });
    }

    loadPreferences() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        const autoDarkMode = localStorage.getItem('autoDarkMode') === 'true';

        if (this.darkModeToggle) {
            this.darkModeToggle.checked = darkMode;
        }
        if (this.autoDarkModeToggle) {
            this.autoDarkModeToggle.checked = autoDarkMode;
        }

        if (autoDarkMode) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setDarkMode(prefersDark);
        } else {
            this.setDarkMode(darkMode);
        }
    }

    toggleDarkMode() {
        const isDarkMode = this.darkModeToggle.checked;
        localStorage.setItem('darkMode', isDarkMode);
        this.setDarkMode(isDarkMode);
    }

    toggleAutoDarkMode() {
        const isAutoDarkMode = this.autoDarkModeToggle.checked;
        localStorage.setItem('autoDarkMode', isAutoDarkMode);

        if (isAutoDarkMode) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setDarkMode(prefersDark);
        } else {
            const darkMode = localStorage.getItem('darkMode') === 'true';
            this.setDarkMode(darkMode);
        }
    }

    setDarkMode(isDark) {
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    isAutoDarkModeEnabled() {
        return localStorage.getItem('autoDarkMode') === 'true';
    }
}

// Initialize dark mode when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DarkMode();
}); 