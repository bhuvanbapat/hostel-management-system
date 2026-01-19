// WebGL Particle Animation System - Premium Subtle Motion
// Features: Ultra-subtle particles, page-adaptive intensity, theme-adaptive colors, accessibility
(function () {
  let scene, camera, renderer, particles;
  let mouseX = 0, mouseY = 0;
  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;
  let animationId = null;
  let isLowPerformance = false;
  let prefersReducedMotion = false;
  let currentTheme = 'light';
  let pageType = 'landing';

  // Page-specific intensity settings
  let motionIntensity = 1.0;
  let particleOpacity = 0.35;
  let particleCount = 1200;
  let canvasOpacity = '0.7';

  function detectPageType() {
    const path = window.location.pathname.toLowerCase();
    const body = document.body;

    if (path.includes('index') || path === '/' || path.endsWith('/frontend/') || body.classList.contains('modern-landing-page')) {
      pageType = 'landing';
      motionIntensity = 1.0;
      particleOpacity = 0.4;
      particleCount = isLowPerformance ? 600 : 1500;
      canvasOpacity = '0.8';
    } else if (path.includes('login') || body.classList.contains('login-page-body') || body.classList.contains('auth-wrapper')) {
      pageType = 'login';
      motionIntensity = 0.6;
      particleOpacity = 0.25;
      particleCount = isLowPerformance ? 400 : 900;
      canvasOpacity = '0.5';
    } else if (path.includes('admin') || path.includes('student') || body.classList.contains('dashboard-body')) {
      pageType = 'dashboard';
      motionIntensity = 0.35;
      particleOpacity = 0.15;
      particleCount = isLowPerformance ? 250 : 600;
      canvasOpacity = '0.35';
    }
    console.log(`HMS WebGL: Page=${pageType}, Particles=${particleCount}, Opacity=${canvasOpacity}`);
  }

  function getThemePalette() {
    // Landing and Login always use light particles (optimized for dark image overlays)
    if (pageType === 'landing' || pageType === 'login') {
      return [
        new THREE.Color(0xffffff),
        new THREE.Color(0xf5f5f5),
        new THREE.Color(0xe5e5e5),
        new THREE.Color(0xfef3c7), // Warm gold hint
        new THREE.Color(0xfed7aa)  // Warm orange hint
      ];
    }

    // Dashboards adapt to theme
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    if (isDark) {
      return [
        new THREE.Color(0xffffff),
        new THREE.Color(0xe5e5e5),
        new THREE.Color(0x94a3b8), // Slate 400
        new THREE.Color(0xfbbf24), // Amber 400
        new THREE.Color(0xf97316)  // Orange 500
      ];
    } else {
      // Light mode dashboard -> Darker particles
      return [
        new THREE.Color(0x334155), // Slate 700
        new THREE.Color(0x475569), // Slate 600
        new THREE.Color(0x94a3b8), // Slate 400
        new THREE.Color(0xf59e0b), // Amber 500
        new THREE.Color(0xea580c)  // Orange 600
      ];
    }
  }

  function updateParticleColors() {
    if (!particles) return;
    const palette = getThemePalette();
    const colors = particles.geometry.attributes.color.array;

    for (let i = 0; i < colors.length; i += 3) {
      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }
    particles.geometry.attributes.color.needsUpdate = true;

    // Also update Blending if needed
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (pageType === 'dashboard' && !isDark) {
      particles.material.blending = THREE.NormalBlending;
      particles.material.opacity = particleOpacity * 1.5; // Make slightly stronger in light mode
    } else {
      particles.material.blending = THREE.AdditiveBlending;
      particles.material.opacity = particleOpacity;
    }
    particles.material.needsUpdate = true;
  }

  function initThemeObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          updateParticleColors();
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
  }

  function checkReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion = mediaQuery.matches;
    mediaQuery.addEventListener('change', (e) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion && animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
        if (renderer) renderer.clear();
      } else if (!prefersReducedMotion && !animationId) {
        animate();
      }
    });
  }

  function detectPerformance() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      isLowPerformance = true;
      return;
    }
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const rendererInfo = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      if (rendererInfo.toLowerCase().includes('intel') ||
        rendererInfo.toLowerCase().includes('mali') ||
        window.innerWidth < 768) {
        isLowPerformance = true;
      }
    }
  }

  function init() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) {
      console.warn('HMS WebGL: Canvas #webgl-canvas not found');
      return;
    }

    if (!window.THREE) {
      console.error('HMS WebGL: Three.js library not loaded');
      return;
    }

    checkReducedMotion();
    if (prefersReducedMotion) return;

    detectPerformance();
    detectPageType();
    initThemeObserver();

    // Scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 900;

    // Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: !isLowPerformance,
      powerPreference: 'low-power'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(isLowPerformance ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);

    // Canvas Styles
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.opacity = canvasOpacity;

    // Particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const palette = getThemePalette();

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 2400;
      positions[i3 + 1] = (Math.random() - 0.5) * 2400;
      positions[i3 + 2] = (Math.random() - 0.5) * 1800;

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: isLowPerformance ? 2 : 2.5,
      vertexColors: true,
      transparent: true,
      opacity: particleOpacity,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false
    });

    // Check initial blending for light mode dashboard
    if (pageType === 'dashboard' && document.documentElement.getAttribute('data-theme') !== 'dark') {
      material.blending = THREE.NormalBlending;
      material.opacity = particleOpacity * 1.5;
    }

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    document.addEventListener('mousemove', onDocumentMouseMove, { passive: true });
    window.addEventListener('resize', onWindowResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange, false);

    console.log("HMS WebGL: Initialized successfully");
    animate();
  }

  function onDocumentMouseMove(event) {
    const sensitivity = 0.015 * motionIntensity;
    mouseX = (event.clientX - windowHalfX) * sensitivity;
    mouseY = (event.clientY - windowHalfY) * sensitivity;
  }

  function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    if (camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  function onVisibilityChange() {
    if (document.hidden) {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    } else {
      if (!animationId && !prefersReducedMotion) {
        animate();
      }
    }
  }

  let time = 0;
  function animate() {
    if (prefersReducedMotion) return;

    animationId = requestAnimationFrame(animate);
    time += 0.0005 * motionIntensity;

    if (particles) {
      particles.rotation.x += 0.00005 * motionIntensity;
      particles.rotation.y += 0.0001 * motionIntensity;

      const pulseAmount = 0.08 * motionIntensity;
      particles.material.opacity = particleOpacity + Math.sin(time * 0.2) * pulseAmount;
    }

    const driftSpeed = 0.008 * motionIntensity;
    camera.position.x += (mouseX - camera.position.x) * driftSpeed;
    camera.position.y += (-mouseY - camera.position.y) * driftSpeed;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
