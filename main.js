// Config and Parameters
const TOTAL_FRAMES = 168;
const images = [];
let loadedCount = 0;

// Render Loop State
let currentFrame = 1;
let targetFrame = 1;
const lerpFactor = 0.08; // Smoothness factor for interpolation

// DOM Elements
const loaderOverlay = document.getElementById('loader-overlay');
const loaderProgressCircle = document.getElementById('loader-progress-circle');
const loaderPercentage = document.getElementById('loader-percentage');
const loaderStatus = document.getElementById('loader-status');
const loaderBarInner = document.getElementById('loader-bar-inner');

const logoContainer = document.getElementById('logo-hero-container');
const scrollContainer = document.getElementById('animation-section');
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');

// SVG Loader Gradient Setup
const createSvgGradient = () => {
    const svg = document.querySelector('.loader-svg');
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    linearGradient.setAttribute('id', 'loader-grad');
    linearGradient.setAttribute('x1', '0%');
    linearGradient.setAttribute('y1', '0%');
    linearGradient.setAttribute('x2', '100%');
    linearGradient.setAttribute('y2', '100%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#ff1f3b');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#ffffff');

    linearGradient.appendChild(stop1);
    linearGradient.appendChild(stop2);
    defs.appendChild(linearGradient);
    svg.insertBefore(defs, svg.firstChild);

    // Apply the gradient color to the stroke
    loaderProgressCircle.style.stroke = 'url(#loader-grad)';
};

// 1. Asset Preloading
const preloadImages = () => {
    createSvgGradient();
    
    return new Promise((resolve) => {
        for (let i = 1; i <= TOTAL_FRAMES; i++) {
            const img = new Image();
            const paddedIndex = String(i).padStart(3, '0');
            img.src = `./ezgif-frame-${paddedIndex}.jpg`;
            
            img.onload = () => {
                handleImageLoad(resolve);
            };
            
            img.onerror = () => {
                console.error(`Failed to load frame: ${img.src}`);
                handleImageLoad(resolve);
            };
            
            images.push(img);
        }
    });
};

const handleImageLoad = (resolve) => {
    loadedCount++;
    const progress = loadedCount / TOTAL_FRAMES;
    const percentage = Math.round(progress * 100);
    
    // Update Loading UI
    loaderPercentage.textContent = `${percentage}%`;
    loaderBarInner.style.width = `${percentage}%`;
    
    // Circular loader dash offset
    const strokeDashoffset = 283 - (progress * 283);
    loaderProgressCircle.style.strokeDashoffset = strokeDashoffset;
    
    if (percentage < 30) {
        loaderStatus.textContent = "Booting core animation system...";
    } else if (percentage < 60) {
        loaderStatus.textContent = `Preloading assets (${loadedCount}/${TOTAL_FRAMES})...`;
    } else if (percentage < 90) {
        loaderStatus.textContent = "Buffering high-res sequences...";
    } else {
        loaderStatus.textContent = "Finalizing hardware textures...";
    }
    
    if (loadedCount === TOTAL_FRAMES) {
        setTimeout(() => {
            loaderOverlay.classList.add('hidden');
            setTimeout(() => {
                logoContainer.classList.add('fade-in-ready');
            }, 300);
            resolve();
        }, 500);
    }
};

// 2. Canvas Resizing and Image Scaling ("cover" simulation)
const resizeCanvas = () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    
    ctx.scale(dpr, dpr);
    
    drawFrame(Math.round(currentFrame));
};

const drawFrame = (frameIndex) => {
    const img = images[frameIndex - 1];
    if (!img || !img.complete) return;
    
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    
    const imageWidth = img.naturalWidth || img.width;
    const imageHeight = img.naturalHeight || img.height;
    
    const imageRatio = imageWidth / imageHeight;
    const canvasRatio = canvasWidth / canvasHeight;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (canvasRatio > imageRatio) {
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / imageRatio;
        offsetX = 0;
        offsetY = (canvasHeight - drawHeight) / 2;
    } else {
        drawWidth = canvasHeight * imageRatio;
        drawHeight = canvasHeight;
        offsetX = (canvasWidth - drawWidth) / 2;
        offsetY = 0;
    }
    
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
};

// Helper utility to clamp numbers
const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

// 3. Slide Progression Logic (Calculates progress parameters for each sticky slide deck)
const updateSlideProperties = () => {
    const slides = document.querySelectorAll('.slide-section');
    
    slides.forEach(slide => {
        const rect = slide.getBoundingClientRect();
        const height = slide.offsetHeight;
        const scrollStart = -rect.top;
        const maxScroll = height - window.innerHeight;
        
        let progress = 0;
        if (scrollStart >= 0) {
            if (scrollStart >= maxScroll) {
                progress = 1;
            } else {
                progress = scrollStart / maxScroll;
            }
        }
        
        slide.style.setProperty('--slide-progress', progress.toFixed(3));
        
        // Entry progress: finishes animation by 45% scroll depth
        const entryProgress = clamp(progress / 0.45, 0, 1);
        slide.style.setProperty('--entry-progress', entryProgress.toFixed(3));
        
        // Staggered card unfolds (Slide 4 specific calculations)
        if (slide.classList.contains('specs-section')) {
            const card1Progress = clamp((progress - 0.0) / 0.35, 0, 1);
            const card2Progress = clamp((progress - 0.1) / 0.35, 0, 1);
            const card3Progress = clamp((progress - 0.2) / 0.35, 0, 1);
            const card4Progress = clamp((progress - 0.3) / 0.35, 0, 1);
            
            slide.style.setProperty('--card-1-progress', card1Progress.toFixed(3));
            slide.style.setProperty('--card-2-progress', card2Progress.toFixed(3));
            slide.style.setProperty('--card-3-progress', card3Progress.toFixed(3));
            slide.style.setProperty('--card-4-progress', card4Progress.toFixed(3));
        }
    });
};

// 4. Scroll Frame Calculation for Canvas Sequence (Slide 1)
const updateTargetFrameFromScroll = () => {
    const rect = scrollContainer.getBoundingClientRect();
    const containerHeight = scrollContainer.offsetHeight;
    
    const scrollStart = -rect.top;
    const maxScroll = containerHeight - window.innerHeight;
    
    if (scrollStart < 0) {
        logoContainer.style.opacity = 1;
        logoContainer.style.transform = 'translate(-50%, -50%) scale(1)';
        targetFrame = 1;
        return;
    }
    if (scrollStart > maxScroll) {
        logoContainer.style.opacity = 0;
        targetFrame = TOTAL_FRAMES;
        return;
    }
    
    const progress = scrollStart / maxScroll;
    
    // First 22% of scroll: Logo fades out, canvas remains static on frame 1
    const logoIntroThreshold = 0.22;
    if (progress < logoIntroThreshold) {
        const logoProgress = progress / logoIntroThreshold;
        const logoOpacity = 1 - logoProgress;
        logoContainer.style.opacity = logoOpacity;
        
        const scaleVal = 1 + (logoProgress * 0.08);
        logoContainer.style.transform = `translate(-50%, -50%) scale(${scaleVal})`;
        
        targetFrame = 1;
    } else {
        logoContainer.style.opacity = 0;
        logoContainer.style.transform = `translate(-50%, -50%) scale(1.08)`;
        
        // Map remaining 78% of scroll to frames 1-168
        const animationProgress = (progress - logoIntroThreshold) / (1 - logoIntroThreshold);
        targetFrame = animationProgress * (TOTAL_FRAMES - 1) + 1;
    }
};

// 5. Smooth Render Loop (60 FPS tick)
const tick = () => {
    // 1. Render main scroll sequence (Slide 1)
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.01) {
        currentFrame += diff * lerpFactor;
    } else {
        currentFrame = targetFrame;
    }
    const roundedFrame = Math.round(currentFrame);
    drawFrame(roundedFrame);
    
    requestAnimationFrame(tick);
};

// 6. Scroll Events Hub
const handleScroll = () => {
    updateTargetFrameFromScroll();
    updateSlideProperties();
};

const initEvents = () => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', () => {
        resizeCanvas();
    });
};

// Initialize Application
const init = async () => {
    await preloadImages();
    resizeCanvas();
    initEvents();
    
    updateTargetFrameFromScroll();
    updateSlideProperties();
    
    requestAnimationFrame(tick);
};

// Run app
init();
