// ===== REVEAL PAGE JAVASCRIPT =====

class RevealExperience {
    constructor() {
        this.userData = null;
        this.revealToken = null;
        this.revealedGender = null;
        this.currentRevealType = null;
        this.soundEnabled = true;
        this.isRevealed = false;
        this.isRevealing = false;
        this.scratchCardInitialized = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.hideLoadingScreen();
        this.initializeAnimations();
    }

    async api(path, options = {}) {
        const response = await fetch(path, {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            ...options
        });

        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(json.error || 'Request failed');
        }
        return json;
    }

    setupEventListeners() {
        // Start reveal button
        const startBtn = document.getElementById('startRevealBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startCountdown());
        }

        // Interaction cards
        document.querySelectorAll('.interaction-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.selectRevealType(type);
            });
        });

        // Sound toggle
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => this.toggleSound());
        }

        // Fullscreen toggle
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        // Replay button
        const replayBtn = document.getElementById('replayBtn');
        if (replayBtn) {
            replayBtn.addEventListener('click', () => this.replayAnimation());
        }

        // Go home button (error screen)
        const goHomeBtn = document.getElementById('goHomeBtn');
        if (goHomeBtn) {
            goHomeBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
        }

        // Share button
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareResult());
        }

        // Gift box
        const giftBox = document.getElementById('giftBox');
        if (giftBox) {
            giftBox.addEventListener('click', () => this.openGiftBox());
        }

        // Tap area
        const tapArea = document.getElementById('tapArea');
        if (tapArea) {
            tapArea.addEventListener('click', () => this.revealTap());
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const container = document.getElementById('revealContainer');
        const errorScreen = document.getElementById('errorScreen');

        setTimeout(() => {
            if (this.userData) {
                if (loadingScreen) {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 500);
                }
                if (container) {
                    container.style.display = 'block';
                }
            } else {
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                }
                if (errorScreen) {
                    errorScreen.style.display = 'flex';
                }
            }
        }, 2000);
    }

    async loadUserData() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code') || sessionStorage.getItem('revealCode');

        if (!code) {
            this.showError('No reveal code provided');
            return;
        }

        try {
            const result = await this.api(`/api/reveal/${encodeURIComponent(code.toUpperCase())}`, {
                method: 'GET'
            });
            this.userData = result.user;
            this.revealToken = result.revealToken;
        } catch (error) {
            this.showError(error.message || 'Invalid reveal code');
        }
    }

    createDemoData(code) {
        const demoGenders = ['boy', 'girl'];
        const demoRevealTypes = ['scratch', 'balloon', 'gift', 'tap'];
        const randomGender = demoGenders[Math.floor(Math.random() * demoGenders.length)];
        const randomRevealType = demoRevealTypes[Math.floor(Math.random() * demoRevealTypes.length)];
        
        this.userData = {
            id: 'demo_' + Math.random().toString(36).substr(2, 9),
            name: 'Demo User',
            email: 'demo@example.com',
            code: code.toUpperCase(),
            gender: randomGender,
            revealType: randomRevealType,
            revealed: false,
            createdAt: new Date().toISOString()
        };
    }

    initializeAnimations() {
        this.createFloatingElements();
        this.setupBackgroundEffects();
    }

    createFloatingElements() {
        const heartsContainer = document.querySelector('.floating-hearts');
        const starsContainer = document.querySelector('.floating-stars');
        const sparklesContainer = document.querySelector('.sparkles');

        if (heartsContainer) {
            for (let i = 0; i < 8; i++) {
                const heart = document.createElement('div');
                heart.innerHTML = '❤️';
                heart.style.cssText = `
                    position: absolute;
                    left: ${Math.random() * 100}%;
                    font-size: ${Math.random() * 2 + 1}rem;
                    animation: heartFloat ${Math.random() * 4 + 8}s ease-in-out infinite;
                    animation-delay: ${Math.random() * 5}s;
                    opacity: ${Math.random() * 0.6 + 0.2};
                `;
                heartsContainer.appendChild(heart);
            }
        }

        if (starsContainer) {
            for (let i = 0; i < 12; i++) {
                const star = document.createElement('div');
                star.innerHTML = '✨';
                star.style.cssText = `
                    position: absolute;
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 100}%;
                    font-size: ${Math.random() * 1.5 + 0.5}rem;
                    animation: starTwinkle ${Math.random() * 3 + 2}s ease-in-out infinite;
                    animation-delay: ${Math.random() * 4}s;
                    opacity: ${Math.random() * 0.8 + 0.2};
                `;
                starsContainer.appendChild(star);
            }
        }

        if (sparklesContainer) {
            for (let i = 0; i < 15; i++) {
                const sparkle = document.createElement('div');
                sparkle.innerHTML = '🌟';
                sparkle.style.cssText = `
                    position: absolute;
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 100}%;
                    font-size: ${Math.random() * 1 + 0.3}rem;
                    animation: starTwinkle ${Math.random() * 2 + 1}s ease-in-out infinite;
                    animation-delay: ${Math.random() * 3}s;
                    opacity: ${Math.random() * 0.7 + 0.1};
                `;
                sparklesContainer.appendChild(sparkle);
            }
        }
    }

    setupBackgroundEffects() {
        // Add subtle parallax effect
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;

            document.querySelectorAll('.floating-hearts, .floating-stars, .sparkles').forEach((el, index) => {
                const speed = (index + 1) * 0.5;
                const xOffset = (x - 0.5) * speed;
                const yOffset = (y - 0.5) * speed;
                
                el.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
            });
        });
    }

    startCountdown() {
        const countdownSection = document.getElementById('countdownSection');
        const interactionsSection = document.getElementById('interactionsSection');
        const countdownNumber = document.getElementById('countdownNumber');

        if (!countdownNumber) return;

        let count = 5;
        countdownNumber.textContent = count;

        const playSound = () => {
            if (this.soundEnabled) {
                this.playTickSound();
            }
        };

        const updateCountdown = () => {
            countdownNumber.classList.remove('pop');
            void countdownNumber.offsetWidth;
            countdownNumber.classList.add('pop');
            countdownNumber.className = `countdown-number pop count-${count}`;
            countdownNumber.textContent = count;
            playSound();
        };

        updateCountdown();

        const countInterval = setInterval(() => {
            count--;

            if (count >= 0) {
                updateCountdown();
            } else {
                clearInterval(countInterval);
                countdownNumber.classList.remove('pop');
                void countdownNumber.offsetWidth;
                countdownNumber.classList.add('pop');
                countdownNumber.textContent = '🎉';
                countdownNumber.style.boxShadow = '0 0 60px rgba(255,215,0,.4), inset 0 0 30px rgba(255,255,255,.1)';

                setTimeout(() => {
                    if (countdownSection) countdownSection.style.display = 'none';
                    countdownNumber.style.boxShadow = '';
                    this.startAdminSelectedReveal();
                }, 1200);
            }
        }, 1000);
    }

    startAdminSelectedReveal() {
        // Use the reveal type set by admin, or default to scratch if not set
        const revealType = this.userData.revealType || 'scratch';
        this.selectRevealType(revealType);
    }

    selectRevealType(type) {
        this.currentRevealType = type;
        
        // Hide interactions section
        const interactionsSection = document.getElementById('interactionsSection');
        if (interactionsSection) {
            interactionsSection.style.display = 'none';
        }

        // Show selected reveal section
        switch (type) {
            case 'scratch':
                this.showScratchCard();
                break;
            case 'balloon':
                this.showBalloonPopping();
                break;
            case 'gift':
                this.showGiftBox();
                break;
            case 'tap':
                this.showTapReveal();
                break;
        }
    }

    showScratchCard() {
        const scratchSection = document.getElementById('scratchSection');
        if (scratchSection) {
            scratchSection.style.display = 'block';
            // Initialize scratch card when section becomes visible
            requestAnimationFrame(() => this.initScratchCard());
        }
    }

    initScratchCard() {
        const placeholder = document.getElementById('scratchPlaceholder');
        let canvas = document.getElementById('scratchCanvas');
        if (!canvas || !placeholder) {
            console.error('Scratch canvas or placeholder not found');
            return;
        }

        // Clone to clear listeners
        const newCanvas = canvas.cloneNode(true);
        canvas.parentNode.replaceChild(newCanvas, canvas);
        canvas = document.getElementById('scratchCanvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Size canvas to match container (CSS pixel size) for 1:1 mapping
        const rect = placeholder.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        // Draw scratch surface
        const gradient = ctx.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, '#d0d0d0');
        gradient.addColorStop(0.5, '#b8b8b8');
        gradient.addColorStop(1, '#d0d0d0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Diagonal stripe pattern
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 2;
        for (let i = -h; i < w + h; i += 16) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + h, h);
            ctx.stroke();
        }
        ctx.restore();

        // Center text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Poppins, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = 4;
        ctx.fillText('✨ Scratch to Reveal! ✨', w / 2, h / 2);
        ctx.shadowBlur = 0;

        let isScratching = false;
        let hasTriggered = false;
        const brushSize = 28;

        const getPoint = (e) => {
            const cRect = canvas.getBoundingClientRect();
            const clientX = e.clientX ?? (e.touches?.[0]?.clientX ?? 0);
            const clientY = e.clientY ?? (e.touches?.[0]?.clientY ?? 0);
            return {
                x: clientX - cRect.left,
                y: clientY - cRect.top
            };
        };

        const eraseAt = (x, y) => {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(x, y, brushSize, 0, Math.PI * 2);
            ctx.fill();
        };

        const checkProgress = () => {
            if (hasTriggered || this.isRevealed || this.isRevealing) return;
            // Sample every 10th pixel for performance
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            let transparent = 0;
            let sampled = 0;
            const step = 40; // check every 40th pixel (10x10 grid roughly)
            for (let i = 3; i < data.length; i += step * 4) {
                sampled++;
                if (data[i] < 128) transparent++;
            }
            const pct = (transparent / sampled) * 100;
            if (pct > 45) {
                hasTriggered = true;
                // Auto-clear remaining scratch layer for dramatic reveal
                ctx.clearRect(0, 0, w, h);
                this.revealGender();
            }
        };

        const scratch = (e) => {
            if (!isScratching) return;
            e.preventDefault();
            const { x, y } = getPoint(e);
            eraseAt(x, y);
            // Throttle progress checks
            if (Math.random() < 0.08) checkProgress();
        };

        canvas.addEventListener('mousedown', (e) => { isScratching = true; scratch(e); });
        canvas.addEventListener('mouseup', () => { isScratching = false; checkProgress(); });
        canvas.addEventListener('mouseleave', () => { isScratching = false; checkProgress(); });
        canvas.addEventListener('mousemove', (e) => { if (isScratching) scratch(e); });

        canvas.addEventListener('touchstart', (e) => { isScratching = true; scratch(e); }, { passive: false });
        canvas.addEventListener('touchend', () => { isScratching = false; checkProgress(); });
        canvas.addEventListener('touchcancel', () => { isScratching = false; checkProgress(); });
        canvas.addEventListener('touchmove', (e) => { if (isScratching) scratch(e); }, { passive: false });

        // Click fallback: scratch a big circle then reveal
        canvas.addEventListener('click', (e) => {
            if (this.isRevealed || this.isRevealing || hasTriggered) return;
            const { x, y } = getPoint(e);
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(x, y, 80, 0, Math.PI * 2);
            ctx.fill();
            hasTriggered = true;
            ctx.clearRect(0, 0, w, h);
            this.revealGender();
        });
    }

    showBalloonPopping() {
        const balloonSection = document.getElementById('balloonSection');
        if (balloonSection) {
            balloonSection.style.display = 'block';
            this.createBalloons();
        }
    }

    createBalloons() {
        const balloonsArea = document.getElementById('balloonsArea');
        if (!balloonsArea) return;

        balloonsArea.innerHTML = '';
        const balloonCount = 12;
        const colors = [
            ['#FFD700', '#FFA500'],
            ['#FF6B9D', '#FF8FAB'],
            ['#6fa8ff', '#4a90e2'],
            ['#c084fc', '#a855f7'],
            ['#4ADE80', '#22c55e'],
            ['#FB923C', '#f97316']
        ];

        for (let i = 0; i < balloonCount; i++) {
            const balloon = document.createElement('div');
            const [color1, color2] = colors[i % colors.length];
            balloon.className = 'balloon';
            balloon.style.cssText = `
                left: ${Math.random() * 80 + 10}%;
                top: ${Math.random() * 60 + 20}%;
                animation-delay: ${Math.random() * 2}s;
                background: linear-gradient(150deg, ${color1}, ${color2});
            `;
            
            balloon.addEventListener('click', () => this.popBalloon(balloon));
            balloonsArea.appendChild(balloon);
        }
    }

    popBalloon(balloon) {
        if (balloon.classList.contains('popped')) return;

        balloon.classList.add('popped');
        
        this.createPopParticles(balloon);
        
        if (this.soundEnabled) {
            this.playPopSound();
        }

        const balloons = document.querySelectorAll('.balloon');
        const poppedBalloons = document.querySelectorAll('.balloon.popped');
        
        if (poppedBalloons.length >= balloons.length - 2 && !this.isRevealed) {
            setTimeout(() => this.revealGender(), 500);
        }
    }

    createPopParticles(balloon) {
        const rect = balloon.getBoundingClientRect();
        const colors = ['#FFD700', '#FF6B9D', '#6fa8ff', '#c084fc', '#4ADE80', '#FB923C'];
        const particles = 12;
        
        for (let i = 0; i < particles; i++) {
            const particle = document.createElement('div');
            const angle = (Math.PI * 2 * i) / particles;
            const distance = 25 + Math.random() * 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.cssText = `
                position: fixed;
                left: ${rect.left + rect.width / 2}px;
                top: ${rect.top + rect.height / 2}px;
                width: ${4 + Math.random() * 5}px;
                height: ${4 + Math.random() * 5}px;
                border-radius: 50%;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                pointer-events: none;
                z-index: 1000;
                --tx: ${tx}px;
                --ty: ${ty}px;
                animation: particleBurst 0.5s ease-out forwards;
            `;
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 500);
        }
    }

    showGiftBox() {
        const giftSection = document.getElementById('giftSection');
        if (giftSection) {
            giftSection.style.display = 'block';
        }
    }

    openGiftBox() {
        const giftBox = document.getElementById('giftBox');
        if (giftBox && !giftBox.classList.contains('opened')) {
            giftBox.classList.add('opened');
            
            if (this.soundEnabled) {
                this.playRevealSound();
            }

            setTimeout(() => {
                const giftResult = document.getElementById('giftResult');
                if (giftResult) {
                    giftResult.style.display = 'block';
                    const giftGenderIcon = document.getElementById('giftGenderIcon');
                    const giftGenderText = document.getElementById('giftGenderText');
                    if (giftGenderIcon && giftGenderText) {
                        giftGenderIcon.innerHTML = '🎁';
                        giftGenderText.textContent = "What's inside?";
                        giftGenderText.style.color = 'var(--brand-gold)';
                    }
                }
                
                if (!this.isRevealed) {
                    this.revealGender();
                }
            }, 600);
        }
    }

    showTapReveal() {
        const tapSection = document.getElementById('tapSection');
        if (tapSection) {
            tapSection.style.display = 'block';
        }
    }

    revealTap() {
        const tapResult = document.getElementById('tapResult');
        const tapHint = document.querySelector('.tap-hint');
        const tapArea = document.getElementById('tapArea');
        
        if (tapArea && tapResult && tapHint && !this.isRevealed) {
            const ripple = document.createElement('div');
            ripple.className = 'tap-ripple';
            const rect = tapArea.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = size + 'px';
            ripple.style.height = size + 'px';
            ripple.style.left = (rect.width / 2 - size / 2) + 'px';
            ripple.style.top = (rect.height / 2 - size / 2) + 'px';
            tapArea.appendChild(ripple);
            setTimeout(() => ripple.remove(), 800);
            
            tapHint.style.display = 'none';
            tapResult.style.display = 'flex';
            const tapGenderIcon = document.getElementById('tapGenderIcon');
            const tapGenderText = document.getElementById('tapGenderText');
            if (tapGenderIcon && tapGenderText) {
                tapGenderIcon.innerHTML = '✨';
                tapGenderText.textContent = 'Revealing...';
                tapGenderText.style.color = 'var(--brand-gold)';
            }
            
            if (this.soundEnabled) {
                this.playRevealSound();
            }
            
            this.revealGender();
        }
    }

    async revealGender() {
        if (this.isRevealed || this.isRevealing) return;
        this.isRevealing = true;

        try {
            const result = await this.api('/api/reveal/consume', {
                method: 'POST',
                body: JSON.stringify({ revealToken: this.revealToken })
            });
            this.revealedGender = result.gender;
        } catch (error) {
            this.isRevealing = false;
            this.showNotification(error.message || 'Failed to reveal');
            return;
        }

        this.isRevealed = true;
        this.isRevealing = false;
        
        // Play celebration effects
        this.createConfetti();
        
        if (this.soundEnabled) {
            this.playRevealSound();
            this.playCelebrationMusic();
        }

        // Show final result after a delay
        setTimeout(() => {
            this.showFinalResult();
        }, 2000);
    }

    updateGenderDisplay(prefix) {
        const genderIcon = document.getElementById(`${prefix}GenderIcon`);
        const genderText = document.getElementById(`${prefix}GenderText`);
        const genderImg = document.getElementById(`${prefix}RevealImage`);
        const gender = this.revealedGender;
        
        if (genderIcon && genderText && gender) {
            if (gender === 'boy') {
                genderIcon.innerHTML = '👶';
                genderText.textContent = "It's a Boy!";
            } else {
                genderIcon.innerHTML = '👧';
                genderText.textContent = "It's a Girl!";
            }
        }
        if (genderImg && gender) {
            genderImg.src = gender === 'boy' 
                ? 'https://raw.githubusercontent.com/jhudel26/babyreveal/main/img/its-a-boy.png'
                : 'https://raw.githubusercontent.com/jhudel26/babyreveal/main/img/its-a-girl.png';
            genderImg.classList.add('visible');
        }
    }

    showFinalResult() {
        document.querySelectorAll('.scratch-section, .balloon-section, .gift-section, .tap-section').forEach(section => {
            section.style.display = 'none';
        });

        const resultSection = document.getElementById('resultSection');
        if (resultSection) {
            resultSection.style.display = 'block';
            
            const genderIcon = document.getElementById('resultGenderIcon');
            const genderText = document.getElementById('resultGenderText');
            const genderImg = document.getElementById('resultRevealImage');
            const parentsMsg = document.getElementById('parentsMessage');
            const gender = this.revealedGender;
            
            const father = this.userData?.fatherName || this.userData?.name || '';
            const mother = this.userData?.motherName || '';
            if (parentsMsg && (father || mother)) {
                const genderLabel = gender === 'boy' ? 'Boy' : gender === 'girl' ? 'Girl' : 'Baby';
                parentsMsg.innerHTML = `Mr ${this.escapeHtml(father)} &amp; Mrs ${this.escapeHtml(mother)}<br>Congratulations your baby is a ${genderLabel}!`;
            }

            if (genderIcon && genderText && gender) {
                if (gender === 'boy') {
                    genderIcon.innerHTML = '👶';
                    genderText.textContent = "It's a Boy!";
                    genderText.style.color = '#87CEEB';
                } else {
                    genderIcon.innerHTML = '👧';
                    genderText.textContent = "It's a Girl!";
                    genderText.style.color = '#FFB6C1';
                }
            }
            if (genderImg && gender) {
                genderImg.src = gender === 'boy' 
                    ? 'https://raw.githubusercontent.com/jhudel26/babyreveal/main/img/its-a-boy.png'
                    : 'https://raw.githubusercontent.com/jhudel26/babyreveal/main/img/its-a-girl.png';
                genderImg.classList.add('visible');
            }
        }
    }

    createConfetti() {
        const colors = ['#FFB6C1', '#87CEEB', '#FFD700', '#4ADE80', '#c084fc', '#FB923C', '#f472b6', '#60a5fa'];
        const shapes = ['circle', 'square', 'rect', 'triangle'];
        const confettiCount = 140;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 10 + 4;
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const left = Math.random() * 100;
            const duration = Math.random() * 2.5 + 2.5;
            const delay = Math.random() * 0.8;
            const rotateDir = Math.random() > 0.5 ? 1 : -1;
            const drift = (Math.random() - 0.5) * 200;

            let borderRadius = '0';
            let clipPath = 'none';
            let w = size, h = size;

            if (shape === 'circle') { borderRadius = '50%'; }
            else if (shape === 'rect') { w = size; h = size * 0.55; borderRadius = '2px'; }
            else if (shape === 'triangle') {
                clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
                w = size; h = size;
            }

            confetti.style.cssText = `
                position: fixed;
                width: ${w}px;
                height: ${h}px;
                background: ${color};
                left: ${left}%;
                top: -14px;
                border-radius: ${borderRadius};
                clip-path: ${clipPath};
                pointer-events: none;
                z-index: 9999;
                opacity: ${Math.random() * 0.3 + 0.7};
                --drift: ${drift}px;
                --rotate: ${rotateDir * (Math.random() * 720 + 360)}deg;
                animation: confettiFall ${duration}s ease-in forwards;
                animation-delay: ${delay}s;
            `;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), (duration + delay) * 1000 + 100);
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundToggle = document.getElementById('soundToggle');
        
        if (soundToggle) {
            if (this.soundEnabled) {
                soundToggle.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;
            } else {
                soundToggle.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;
            }
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    replayAnimation() {
        this.isRevealed = false;
        this.revealedGender = null;
        
        // Hide result section
        const resultSection = document.getElementById('resultSection');
        if (resultSection) {
            resultSection.style.display = 'none';
        }
        
        // Reset to interactions
        const interactionsSection = document.getElementById('interactionsSection');
        if (interactionsSection) {
            interactionsSection.style.display = 'block';
        }
        
        // Reset specific reveal sections
        this.resetScratchCard();
        this.resetBalloons();
        this.resetGiftBox();
        this.resetTapReveal();
        this.resetRevealImages();
    }

    resetRevealImages() {
        document.querySelectorAll('.reveal-image').forEach(img => {
            img.src = '';
            img.classList.remove('visible');
        });
    }

    resetScratchCard() {
        const canvas = document.getElementById('scratchCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
        this.scratchCardInitialized = false;
    }

    resetBalloons() {
        this.createBalloons();
        const balloonResult = document.getElementById('balloonResult');
        if (balloonResult) {
            balloonResult.style.display = 'none';
        }
    }

    resetGiftBox() {
        const giftBox = document.getElementById('giftBox');
        const giftResult = document.getElementById('giftResult');
        
        if (giftBox) {
            giftBox.classList.remove('opened');
        }
        if (giftResult) {
            giftResult.style.display = 'none';
        }
    }

    resetTapReveal() {
        const tapResult = document.getElementById('tapResult');
        const tapHint = document.querySelector('.tap-hint');
        
        if (tapResult) {
            tapResult.style.display = 'none';
        }
        if (tapHint) {
            tapHint.style.display = 'block';
        }
    }

    async shareResult() {
        const shareText = this.userData.gender === 'boy' 
            ? "It's a Boy! 🎉" 
            : "It's a Girl! 🎊";
        
        const shareUrl = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Baby Gender Reveal',
                    text: shareText,
                    url: shareUrl
                });
            } catch (error) {
                // User cancelled share.
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
                this.showNotification('Share link copied to clipboard!');
            } catch (error) {
                this.showNotification('Failed to copy share link');
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = String(text || '');
        return div.innerHTML;
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            z-index: 10000;
            backdrop-filter: blur(10px);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = message;
        }
    }

    // Sound methods (simplified - in production, you'd load actual audio files)
    playTickSound() {
        // Create a simple tick sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    playPopSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 400;
        oscillator.type = 'square';
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    }

    playRevealSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523, 659, 784, 1047]; // C, E, G, High C

        notes.forEach((frequency, index) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';
                gainNode.gain.value = 0.1;

                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.5);
            }, index * 200);
        });
    }

    playCelebrationMusic() {
        const music = document.getElementById('celebrationMusic');
        if (music) {
            music.currentTime = 0;
            music.volume = 0.35;
            const playPromise = music.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // MP3 failed (not found or blocked), fall back to Web Audio
                    this.playCelebrationMusicFallback();
                });
                return;
            }
            return;
        }
        this.playCelebrationMusicFallback();
    }

    playCelebrationMusicFallback() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioContext.currentTime;

        const melody = [
            { f: 523.25, t: 0.0, d: 0.35 },
            { f: 659.25, t: 0.25, d: 0.35 },
            { f: 783.99, t: 0.50, d: 0.35 },
            { f: 1046.50, t: 0.75, d: 0.40 },
            { f: 783.99, t: 1.15, d: 0.30 },
            { f: 659.25, t: 1.40, d: 0.30 },
            { f: 523.25, t: 1.70, d: 0.50 },
            { f: 587.33, t: 2.10, d: 0.25 },
            { f: 659.25, t: 2.35, d: 0.25 },
            { f: 783.99, t: 2.60, d: 0.25 },
            { f: 1046.50, t: 2.85, d: 0.60 },
        ];

        const harmony = [
            { f: 261.63, t: 0.0, d: 1.0 },
            { f: 329.63, t: 1.0, d: 1.0 },
            { f: 392.00, t: 2.0, d: 1.5 },
        ];

        const masterGain = audioContext.createGain();
        masterGain.connect(audioContext.destination);
        masterGain.gain.value = 0.08;
        masterGain.gain.setValueAtTime(0.08, now);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

        melody.forEach(note => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(masterGain);
            osc.frequency.value = note.f;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0, now + note.t);
            gain.gain.linearRampToValueAtTime(1, now + note.t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);
            osc.start(now + note.t);
            osc.stop(now + note.t + note.d + 0.05);
        });

        harmony.forEach(note => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(masterGain);
            osc.frequency.value = note.f;
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0, now + note.t);
            gain.gain.linearRampToValueAtTime(0.6, now + note.t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);
            osc.start(now + note.t);
            osc.stop(now + note.t + note.d + 0.05);
        });

        for (let i = 0; i < 8; i++) {
            const t = now + 0.3 + i * 0.35;
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(masterGain);
            osc.frequency.value = 1046.50 + (i % 2) * 523;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            osc.start(t);
            osc.stop(t + 0.2);
        }
    }
}

// Initialize reveal experience
document.addEventListener('DOMContentLoaded', () => {
    window.revealApp = new RevealExperience();
});
