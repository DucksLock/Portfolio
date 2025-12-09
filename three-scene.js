// three-scene.js — lightweight Three.js entrance animation
// Show duck.webp spinning fast, then fade out; fallback to torus knot if image missing
(function(){
    'use strict';

    // Config
    const DURATION = 4200; // ms total animation time before fade-out
    const FADE_OUT = 1000; // ms fade duration

    const overlay = document.getElementById('three-overlay');
    if (!overlay) return;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    // Cap DPR for performance
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(DPR);
    // set canvas drawing buffer size and keep CSS full-viewport
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    // ensure the backing buffer matches DPR to avoid letterboxing in Firefox
    renderer.domElement.width = Math.floor(window.innerWidth * DPR);
    renderer.domElement.height = Math.floor(window.innerHeight * DPR);
    overlay.appendChild(renderer.domElement);
    // make the overlay background black during the spin
    overlay.style.background = '#000';
    // ensure the WebGL clear color is black so transparent parts render on black
    renderer.setClearColor(0x000000, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    // lighting (used by fallback knot)
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(0, 50, 50);
    scene.add(dir);

    const group = new THREE.Group();
    scene.add(group);

    // no fallback knot — if image fails we'll quickly fade the overlay

    // duck image mesh if available
    let duckMesh = null;

    // Rotation control
    const maxRadPerSec = Math.PI * 60; // very fast initial spin (radians per second)

    // Load duck texture from expected path (relative to scratch/index.html)
    const loader = new THREE.TextureLoader();

    // (no 3D fallback — we'll fade out quickly if no image is available)

    // Try PNG first (user replaced with duck.png), then JPEG, then WebP
    loader.load('../images/duck.png', function(tex){
        // create a plane with the duck texture sized relative to the camera view
        const img = tex.image;
        const aspect = img && img.width && img.height ? img.width / img.height : 1;
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const viewHeight = 2 * Math.tan(vFOV / 2) * Math.abs(camera.position.z);
        const multiplier = 1.4; // 40% bigger than viewport
        const planeHeight = viewHeight * multiplier;
        const planeWidth = planeHeight * aspect;
        const geom = new THREE.PlaneGeometry(planeWidth, planeHeight);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        duckMesh = new THREE.Mesh(geom, mat);
        group.add(duckMesh);

        // position camera a bit closer for the plane
        camera.position.z = 40;

        startAnimation(true);
    }, undefined, function(err){
        // PNG failed — try JPEG next
        loader.load('../images/duck.jpg', function(texJ){
            const img = texJ.image;
            const aspect = img && img.width && img.height ? img.width / img.height : 1;
            const vFOV = THREE.MathUtils.degToRad(camera.fov);
            const viewHeight = 2 * Math.tan(vFOV / 2) * Math.abs(camera.position.z);
            const multiplier = 1.4;
            const planeHeight = viewHeight * multiplier;
            const planeWidth = planeHeight * aspect;
            const geom = new THREE.PlaneGeometry(planeWidth, planeHeight);
            const mat = new THREE.MeshBasicMaterial({ map: texJ, transparent: true });
            duckMesh = new THREE.Mesh(geom, mat);
            group.add(duckMesh);
            camera.position.z = 40;
            startAnimation(true);
        }, undefined, function(err2){
            // JPEG failed — try WebP next
            loader.load('../images/duck.webp', function(tex2){
                const img = tex2.image;
                const aspect = img && img.width && img.height ? img.width / img.height : 1;
                const vFOV = THREE.MathUtils.degToRad(camera.fov);
                const viewHeight = 2 * Math.tan(vFOV / 2) * Math.abs(camera.position.z);
                const multiplier = 1.4;
                const planeHeight = viewHeight * multiplier;
                const planeWidth = planeHeight * aspect;
                const geom = new THREE.PlaneGeometry(planeWidth, planeHeight);
                const mat = new THREE.MeshBasicMaterial({ map: tex2, transparent: true });
                duckMesh = new THREE.Mesh(geom, mat);
                group.add(duckMesh);
                camera.position.z = 40;
                startAnimation(true);
            }, undefined, function(err3){
                console.warn('duck.png/jpg/webp not found or failed to load — skipping animation.', err3);
                // if no image available, quickly fade overlay and cleanup
                quickFadeAndCleanup();
            });
        });
    });

        function quickFadeAndCleanup(){
            // small delay so user sees the overlay briefly, then fade out
            const SHORT = 500;
            setTimeout(() => {
                overlay.style.transition = `opacity ${FADE_OUT}ms ease`;
                overlay.style.opacity = '0';
                // cleanup after fade
                setTimeout(() => {
                    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
                        renderer.domElement.parentNode.removeChild(renderer.domElement);
                    }
                    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    window.removeEventListener('resize', onResize);
                }, FADE_OUT + 40);
            }, SHORT);
        }

    function startAnimation(duckMode) {
        let start = performance.now();
        let last = start;
        let ranAfter = false;

        function animate(now){
            const elapsed = now - start;
            const delta = (now - last) / 1000;
            last = now;

            const t = Math.min(elapsed / DURATION, 1);

            if (duckMode && duckMesh) {
                // Spin very fast at start, then slow down over time
                const speedFactor = 1 - easeOutCubic(t); // 1 -> 0
                const rot = delta * maxRadPerSec * speedFactor;
                duckMesh.rotation.z += rot;
                // subtle scale easing
                const s = 0.6 + 0.4 * (1 + Math.sin((1 - t) * Math.PI * 2)) * 0.5 + 0.4 * (1 - t);
                duckMesh.scale.setScalar(s);
            } // otherwise do nothing (no fallback knot)

            renderer.render(scene, camera);

            if (t < 1) {
                raf = requestAnimationFrame(animate);
            } else if (!ranAfter) {
                // after initial DURATION, continue light loop for a bit
                ranAfter = true;
                raf = requestAnimationFrame(loopAfter);
            }
        }

        function loopAfter(now){
            // gentle continued motion (only duck mesh remains)
            if (duckMesh) duckMesh.rotation.z += 0.02;
            renderer.render(scene, camera);
            raf = requestAnimationFrame(loopAfter);
        }

        function easeOutCubic(x){ return 1 - Math.pow(1 - x, 3); }

        let raf = requestAnimationFrame(animate);

        // Auto-stop and fade out overlay after DURATION
        setTimeout(() => {
            overlay.style.transition = `opacity ${FADE_OUT}ms ease`;
            overlay.style.opacity = '0';

            // stop rendering after fade completes and remove canvas for performance
            setTimeout(() => {
                cancelAnimationFrame(raf);
                if (renderer && renderer.domElement && renderer.domElement.parentNode) {
                    renderer.domElement.parentNode.removeChild(renderer.domElement);
                }
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                window.removeEventListener('resize', onResize);
            }, FADE_OUT + 40);
        }, DURATION);
    }

    // Responsive resize
    function onResize(){
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const DPR2 = Math.min(window.devicePixelRatio || 1, 2);
        renderer.setPixelRatio(DPR2);
        renderer.setSize(w, h, false);
        // update backing buffer to match DPR exactly
        renderer.domElement.width = Math.floor(w * DPR2);
        renderer.domElement.height = Math.floor(h * DPR2);
    }
    window.addEventListener('resize', onResize, { passive: true });

})();
