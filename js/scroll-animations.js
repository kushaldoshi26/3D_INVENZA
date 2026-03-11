/* 3D Invenza — Scroll Animations v1.0 */
(function () {
    'use strict';

    function init() {
        if (!window.gsap || !window.ScrollTrigger) return;

        gsap.registerPlugin(ScrollTrigger);

        // ── Smooth reveal for sections ──
        gsap.utils.toArray('section').forEach(section => {
            gsap.fromTo(section,
                { opacity: 0, y: 30 },
                {
                    opacity: 1, y: 0,
                    duration: 1.2,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 85%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        });

        // ── Feature cards staggered reveal ──
        gsap.from('.feature-card', {
            opacity: 0,
            y: 40,
            duration: 0.8,
            stagger: 0.15,
            ease: 'back.out(1.2)',
            scrollTrigger: {
                trigger: '.features-grid',
                start: 'top 80%'
            }
        });

        // ── Hero content entry ──
        gsap.from('.hero-content > *', {
            opacity: 0,
            x: -50,
            duration: 1,
            stagger: 0.2,
            ease: 'power3.out',
            delay: 0.3
        });

        // ── Hero visual (Hologram) scaling entrance ──
        gsap.from('.hero-visual', {
            scale: 0.8,
            opacity: 0,
            duration: 1.5,
            ease: 'elastic.out(1, 0.75)',
            delay: 0.2
        });

        // ── Floating parallax for elements with [data-parallax] ──
        document.querySelectorAll('[data-parallax]').forEach(el => {
            let speed = el.dataset.parallax || 0.1;
            gsap.to(el, {
                y: () => -ScrollTrigger.maxScroll(window) * speed,
                ease: 'none',
                scrollTrigger: {
                    start: 0,
                    end: 'max',
                    scrub: true
                }
            });
        });

        // ── Header shrink on scroll ──
        ScrollTrigger.create({
            start: 'top -50',
            onEnter: () => document.getElementById('navbar').classList.add('navbar-shrunk'),
            onLeaveBack: () => document.getElementById('navbar').classList.remove('navbar-shrunk')
        });
    }

    if (document.readyState !== 'loading') init();
    else document.addEventListener('DOMContentLoaded', init);
})();
