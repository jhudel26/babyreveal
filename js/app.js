// ===== MAIN APPLICATION JAVASCRIPT =====

class BabyRevealApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.hideLoadingScreen();
        this.initializeAnimations();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Enter Code Button
        const enterCodeBtn = document.getElementById('enterCodeBtn');
        if (enterCodeBtn) {
            enterCodeBtn.addEventListener('click', () => this.showCodeModal());
        }

        // Watch Demo Button
        const watchDemoBtn = document.getElementById('watchDemoBtn');
        if (watchDemoBtn) {
            watchDemoBtn.addEventListener('click', () => this.watchDemo());
        }

        // Modal
        this.setupModal();

        // Form submissions
        this.setupForms();
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 2000);
        }
    }

    initializeAnimations() {
        this.createFloatingElements();
        this.setupScrollAnimations();
    }

    createFloatingElements() {
        const heartsContainer = document.querySelector('.floating-hearts');
        const starsContainer = document.querySelector('.floating-stars');

        if (heartsContainer) {
            for (let i = 0; i < 5; i++) {
                const heart = document.createElement('div');
                heart.innerHTML = '❤️';
                heart.style.cssText = `
                    position: absolute;
                    left: ${Math.random() * 100}%;
                    font-size: ${Math.random() * 2 + 1}rem;
                    animation: heartFloat ${Math.random() * 3 + 6}s ease-in-out infinite;
                    animation-delay: ${Math.random() * 5}s;
                    opacity: ${Math.random() * 0.5 + 0.3};
                `;
                heartsContainer.appendChild(heart);
            }
        }

        if (starsContainer) {
            for (let i = 0; i < 8; i++) {
                const star = document.createElement('div');
                star.innerHTML = '✨';
                star.style.cssText = `
                    position: absolute;
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 100}%;
                    font-size: ${Math.random() * 1.5 + 0.5}rem;
                    animation: starTwinkle ${Math.random() * 2 + 2}s ease-in-out infinite;
                    animation-delay: ${Math.random() * 3}s;
                    opacity: ${Math.random() * 0.7 + 0.3};
                `;
                starsContainer.appendChild(star);
            }
        }
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements
        document.querySelectorAll('.step-card, .feature-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    handleNavigation(e) {
        const targetId = e.target.getAttribute('href');
        
        // Allow external links to work normally
        if (targetId && !targetId.startsWith('#')) {
            return; // Let the default behavior happen
        }
        
        // Handle anchor links with smooth scrolling
        if (targetId && targetId.startsWith('#')) {
            e.preventDefault();
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    }

    showCodeModal() {
        const modal = document.getElementById('codeModal');
        if (modal) {
            modal.classList.add('active');
            document.getElementById('revealCodeInput').focus();
        }
    }

    watchDemo() {
        // Create a demo experience
        this.createDemoReveal();
    }

    createDemoReveal() {
        // Generate a random demo code
        const demoCode = 'DEMO123';
        this.redirectToReveal(demoCode);
    }

    setupModal() {
        const modal = document.getElementById('codeModal');
        const closeBtn = modal?.querySelector('.modal-close');
        const submitBtn = document.getElementById('submitCodeBtn');
        const input = document.getElementById('revealCodeInput');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitCode());
        }

        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.submitCode();
                }
            });
        }
    }

    closeModal() {
        const modal = document.getElementById('codeModal');
        if (modal) {
            modal.classList.remove('active');
            document.getElementById('revealCodeInput').value = '';
        }
    }

    submitCode() {
        const input = document.getElementById('revealCodeInput');
        const code = input.value.trim().toUpperCase();

        if (!code) {
            this.showError('Please enter a reveal code');
            return;
        }

        if (code.length < 3) {
            this.showError('Code must be at least 3 characters');
            return;
        }

        // Validate code format (alphanumeric)
        if (!/^[A-Z0-9]+$/.test(code)) {
            this.showError('Code can only contain letters and numbers');
            return;
        }

        this.redirectToReveal(code);
    }

    redirectToReveal(code) {
        // Store the code in sessionStorage for the reveal page
        sessionStorage.setItem('revealCode', code);
        
        // Redirect to reveal page
        window.location.href = `reveal.html?code=${encodeURIComponent(code)}`;
    }

    showError(message) {
        const input = document.getElementById('revealCodeInput');
        const helpText = document.querySelector('.input-help');
        
        if (input) {
            input.style.borderColor = '#ef4444';
            input.focus();
        }

        if (helpText) {
            helpText.textContent = message;
            helpText.style.color = '#fca5a5';
        }

        // Reset after 3 seconds
        setTimeout(() => {
            if (input) {
                input.style.borderColor = '';
            }
            if (helpText) {
                helpText.textContent = 'Enter the code you received from the admin';
                helpText.style.color = '';
            }
        }, 3000);
    }

    setupForms() {
        // Prevent form submissions that aren't handled
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!form.hasAttribute('data-handled')) {
                    e.preventDefault();
                }
            });
        });
    }

    // Utility functions
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    formatCode(code) {
        return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    validateCode(code) {
        const formatted = this.formatCode(code);
        return formatted.length >= 3 && formatted.length <= 10;
    }

    // Local storage helpers
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }

    getFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn('Failed to read from localStorage:', error);
            return null;
        }
    }

    removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('Failed to remove from localStorage:', error);
        }
    }

    // Animation helpers
    animateElement(element, animation, duration = 1000) {
        if (!element) return;

        element.style.animation = animation;
        element.style.animationDuration = `${duration}ms`;

        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }

    createConfetti(container = document.body) {
        const colors = ['#FFB6C1', '#87CEEB', '#FFD700', '#98FB98', '#DDA0DD'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.cssText = `
                position: fixed;
                width: ${Math.random() * 10 + 5}px;
                height: ${Math.random() * 10 + 5}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}%;
                top: -10px;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                pointer-events: none;
                z-index: 9999;
                animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
            `;
            container.appendChild(confetti);

            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
    }
}

// ===== UTILITY FUNCTIONS =====

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Check if device is mobile
function isMobile() {
    return window.innerWidth <= 768;
}

// Check if device supports touch
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Get URL parameters
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Copy text to clipboard
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    } catch (error) {
        console.error('Failed to copy text:', error);
        return false;
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BabyRevealApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, pause animations
        document.querySelectorAll('[style*="animation"]').forEach(el => {
            el.style.animationPlayState = 'paused';
        });
    } else {
        // Page is visible, resume animations
        document.querySelectorAll('[style*="animation"]').forEach(el => {
            el.style.animationPlayState = 'running';
        });
    }
});

// Handle resize events
window.addEventListener('resize', debounce(() => {
    // Re-initialize responsive elements
    if (window.app) {
        window.app.initializeAnimations();
    }
}, 250));
