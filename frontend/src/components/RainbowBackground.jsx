import React, { useEffect, useRef } from 'react';

/* ── Blockchain Network Canvas ─────────────────────────────────────────── */
const BlockchainCanvas = () => {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);

        const NODE_COUNT = 40;
        const nodes = Array.from({ length: NODE_COUNT }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            r: 2 + Math.random() * 3,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: 0.015 + Math.random() * 0.02,
            color: Math.random() < 0.6 ? '#00f0ff' : (Math.random() < 0.5 ? '#b44fff' : '#00ff88'),
        }));

        // Data packets on edges
        const packets = Array.from({ length: 12 }, () => ({
            fromIdx: Math.floor(Math.random() * NODE_COUNT),
            toIdx: Math.floor(Math.random() * NODE_COUNT),
            progress: Math.random(),
            speed: 0.003 + Math.random() * 0.005,
            color: Math.random() < 0.5 ? '#00f0ff' : '#b44fff',
        }));

        // Floating hash labels
        const LABELS = ['0x4f3a…', 'TX✓', '#sha256', 'BLOCK', '⛓', 'CERT-ID', 'HASH', '0xA1B2…', 'VALID', 'SIGN'];
        const floaters = Array.from({ length: 14 }, (_, i) => ({
            text: LABELS[i % LABELS.length],
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vy: -(0.15 + Math.random() * 0.25),
            opacity: 0.08 + Math.random() * 0.18,
            size: 10 + Math.random() * 5,
            color: Math.random() < 0.5 ? '#00f0ff' : '#b44fff',
        }));

        const CONNECT_DIST = 160;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Move nodes
            for (const n of nodes) {
                n.x += n.vx; n.y += n.vy; n.pulse += n.pulseSpeed;
                if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
                if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
            }

            // Draw edges
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < CONNECT_DIST) {
                        const alpha = (1 - dist / CONNECT_DIST) * 0.35;
                        const grad = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
                        grad.addColorStop(0, `rgba(0,240,255,${alpha})`);
                        grad.addColorStop(1, `rgba(180,79,255,${alpha})`);
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.strokeStyle = grad;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }

            // Draw data packets
            for (const pkt of packets) {
                pkt.progress += pkt.speed;
                if (pkt.progress >= 1) {
                    pkt.progress = 0;
                    pkt.fromIdx = pkt.toIdx;
                    pkt.toIdx = Math.floor(Math.random() * NODE_COUNT);
                }
                const from = nodes[pkt.fromIdx];
                const to = nodes[pkt.toIdx];
                const px = from.x + (to.x - from.x) * pkt.progress;
                const py = from.y + (to.y - from.y) * pkt.progress;
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fillStyle = pkt.color;
                ctx.shadowColor = pkt.color;
                ctx.shadowBlur = 12;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // Draw nodes
            for (const n of nodes) {
                const glow = 0.5 + 0.5 * Math.sin(n.pulse);
                // Outer ring
                ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 5 * glow, 0, Math.PI * 2);
                const ringAlpha = 0.08 * glow;
                ctx.fillStyle = n.color.replace(')', `,${ringAlpha})`).replace('rgb', 'rgba');
                // Simpler approach:
                ctx.globalAlpha = 0.08 * glow;
                ctx.fillStyle = n.color;
                ctx.fill();
                ctx.globalAlpha = 1;

                // Core dot
                ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fillStyle = n.color;
                ctx.shadowColor = n.color;
                ctx.shadowBlur = 10 + 10 * glow;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // Floating hash labels
            for (const f of floaters) {
                f.y += f.vy;
                if (f.y < -20) { f.y = canvas.height + 20; f.x = Math.random() * canvas.width; }
                ctx.save();
                ctx.globalAlpha = f.opacity;
                ctx.fillStyle = f.color;
                ctx.font = `${f.size}px 'JetBrains Mono', 'Courier New', monospace`;
                ctx.shadowColor = f.color;
                ctx.shadowBlur = 6;
                ctx.fillText(f.text, f.x, f.y);
                ctx.restore();
            }

            rafRef.current = requestAnimationFrame(animate);
        };

        animate();
        return () => {
            window.removeEventListener('resize', resize);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: -2, pointerEvents: 'none' }} />;
};

/* ── Mouse spark trail ─────────────────────────────────────────────────── */
const MouseTrail = () => {
    const canvasRef = useRef(null);
    const particles = useRef([]);
    const rafRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);

        const COLORS = ['#00f0ff', '#b44fff', '#00ff88', '#4f46e5', '#00f0ff'];

        const onMove = (e) => {
            for (let i = 0; i < 4; i++) {
                particles.current.push({
                    x: e.clientX, y: e.clientY,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3 - 0.5,
                    size: 1.5 + Math.random() * 5,
                    opacity: 1,
                    decay: 0.045 + Math.random() * 0.035,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                    gravity: 0.06,
                });
            }
        };
        window.addEventListener('mousemove', onMove);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.current = particles.current.filter(p => p.opacity > 0.01);
            for (const p of particles.current) {
                ctx.save();
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                p.x += p.vx; p.y += p.vy;
                p.vy += p.gravity; p.opacity -= p.decay;
            }
            rafRef.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', onMove);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }} />;
};

/* ── Custom cursor ─────────────────────────────────────────────────────── */
const CursorDot = () => {
    const dotRef = useRef(null);
    const ringRef = useRef(null);

    useEffect(() => {
        const dot = dotRef.current; const ring = ringRef.current;
        if (!dot || !ring) return;
        const move = (e) => {
            dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px';
            ring.style.left = e.clientX + 'px'; ring.style.top = e.clientY + 'px';
        };
        const down = () => { dot.style.transform = 'translate(-50%,-50%) scale(1.8)'; };
        const up = () => { dot.style.transform = 'translate(-50%,-50%) scale(1)'; };
        window.addEventListener('mousemove', move);
        window.addEventListener('mousedown', down);
        window.addEventListener('mouseup', up);
        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mousedown', down);
            window.removeEventListener('mouseup', up);
        };
    }, []);

    return (
        <>
            <div ref={dotRef} style={{
                position: 'fixed', width: 10, height: 10, borderRadius: '50%',
                background: '#00f0ff', boxShadow: '0 0 10px #00f0ff, 0 0 20px rgba(0,240,255,0.5)',
                pointerEvents: 'none', zIndex: 99998, transform: 'translate(-50%,-50%)',
                transition: 'transform .15s cubic-bezier(.34,1.56,.64,1)',
            }} />
            <div ref={ringRef} style={{
                position: 'fixed', width: 32, height: 32, borderRadius: '50%',
                border: '1.5px solid rgba(0,240,255,0.5)',
                boxShadow: '0 0 8px rgba(0,240,255,0.2)',
                pointerEvents: 'none', zIndex: 99997, transform: 'translate(-50%,-50%)',
                transition: 'left .08s ease-out, top .08s ease-out',
            }} />
        </>
    );
};

/* ── Main export ─────────────────────────────────────────────────────────── */
const RainbowBackground = () => (
    <>
        <style>{`
            body { cursor: none; }
            .rb-base {
                position: fixed; inset: 0; z-index: -3;
                background:
                    radial-gradient(ellipse 80% 60% at 10% 20%, rgba(0,240,255,0.06), transparent),
                    radial-gradient(ellipse 60% 50% at 90% 80%, rgba(180,79,255,0.07), transparent),
                    radial-gradient(ellipse 50% 70% at 50% 50%, rgba(0,255,136,0.03), transparent),
                    linear-gradient(180deg, #020818 0%, #060d1f 50%, #020818 100%);
                animation: bgBreath 12s ease-in-out infinite alternate;
            }
            @keyframes bgBreath {
                0%   { opacity: 0.9; }
                100% { opacity: 1; }
            }
        `}</style>

        <div className="rb-base" />
        <BlockchainCanvas />
        <MouseTrail />
        <CursorDot />
    </>
);

export default RainbowBackground;
