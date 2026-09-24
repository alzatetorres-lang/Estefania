const { useState, useEffect, useRef, useCallback } = React;

// —— Configuración Modular de Servicios ——
// Cambiar showMicropigmentacion a true para reactivar el bloque y menús de Micropigmentación
const FEATURES = {
  showMicropigmentacion: false,
};

const BUSINESS = {
  name: "Stefania Panzariu Studio",
  tagline: "Belleza de Autor",
  phone: "34690699205",
  email: "estefaniapanzariu@gmail.com",
  instagramHandle: "@victoria_e_p",
  instagramUrl: "https://www.instagram.com/victoria_e_p?igsh=MWppMjdoaXlhYWxpOA==",
  // —— Dirección centralizada: para mudanzas, cambia SOLO estos campos ——
  addressLine: "Centro Comercial 4 Caminos, número 7", // calle + número (texto largo)
  addressShort: "Centro Comercial 4 Caminos, nº 7",     // versión corta
  postalCity: "16004 Cuenca",                            // CP + ciudad
  city: "Cuenca",
  region: "Cuenca",
  country: "España",
  area: "4 Caminos",                                     // barrio/zona (hero, branding)
  addressTag: "Número 7",                                // motivo de marca (footer/redes)
  landmark: "A pocos pasos de la Plaza de la Hispanidad.", // referencia cercana
  mapsShort: "https://maps.app.goo.gl/RmEoSxGfpnqJU6RFA",
  reviewsUrl: "https://share.google/glBQvfSFh7AWF6Wdg",
  paymentNote: "Pago directo en el establecimiento (Efectivo o Tarjeta). Sin pagos online requeridos.",
};

const BRAND_ASSETS = {
  logoBlack: "assets/brand/stefania-panzariu-logo-black.png",
  logoWhite: "assets/brand/stefania-panzariu-logo-white.png",
};

const SITE_IMAGES = {
  hero: "assets/images/stefania-panzariu-retrato-estudio-belleza-cuenca.jpg",
  artistTool: "assets/images/stefania-panzariu-micropigmentacion-dermografo-cuenca.jpg",
  pigmentDetail: "assets/images/micropigmentacion-pigmento-detalle.jpg",
  nailDetail: "assets/images/manicura-rusa-detalle-unas.jpg",
  browBefore: "assets/images/micropigmentacion-cejas-antes.jpg",
  browAfter: "assets/images/micropigmentacion-cejas-despues.jpg",
  nailMilky: "assets/images/manicura-rusa-milky-cuenca.jpg",
  nailNude: "assets/images/unas-nude-translucido-cuenca.jpg",
  facialCabin: "assets/images/cabina-estetica-facial-cuenca.jpg",
  massagePareja: "assets/images/masaje-en-pareja-spa-cuenca.jpg",
  massageDetail: "assets/images/masaje-relajante-detalle-manos.jpg",
};

const wa = (msg) => `https://wa.me/${BUSINESS.phone}?text=${encodeURIComponent(msg)}`;

// Mensaje estándar de cita (incluye la dirección centralizada).
const CITA_MSG = `Hola Stefania, me gustaría pedir cita en el estudio (${BUSINESS.addressLine}, ${BUSINESS.city}). ¿Me indicas tu disponibilidad?`;

/* ---------- Scroll progress bar ---------- */
function useScrollProgress() {
  useEffect(() => {
    const el = document.getElementById("scroll-progress");
    if (!el) return;
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? h.scrollTop / max * 100 : 0;
      el.style.width = p + "%";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
}

function useSitePreloader() {
  useEffect(() => {
    const startedAt = performance.now();
    const minDuration = 500;
    const maxDuration = 3600;
    let done = false;
    let cancelled = false;
    const timers = new Set();

    document.body.classList.add("app-mounted");

    const delay = (ms) =>
      new Promise((resolve) => {
        const id = window.setTimeout(() => {
          timers.delete(id);
          resolve();
        }, ms);
        timers.add(id);
      });

    const waitForWindowLoad = () =>
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise((resolve) => {
          window.addEventListener("load", resolve, { once: true });
        });

    const waitForHeroImage = async () => {
      const img = document.querySelector(".hero-photo img");
      if (!img) return;

      if (!img.complete || !img.naturalWidth) {
        await Promise.race([
          new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          }),
          delay(1800)
        ]);
      }

      if (img.decode) await img.decode().catch(() => {});
    };

    const finish = () => {
      if (done || cancelled) return;
      done = true;
      const wait = Math.max(0, minDuration - (performance.now() - startedAt));
      const readyTimer = window.setTimeout(() => {
        timers.delete(readyTimer);
        document.body.classList.add("site-ready");
        document.body.classList.remove("is-loading");
        const removeTimer = window.setTimeout(() => {
          timers.delete(removeTimer);
          document.getElementById("site-preloader")?.remove();
        }, 900);
        timers.add(removeTimer);
      }, wait);
      timers.add(readyTimer);
    };

    Promise.race([
      Promise.all([waitForWindowLoad(), waitForHeroImage(), delay(minDuration)]),
      delay(maxDuration)
    ]).then(finish);

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);
}

/* ---------- Reveal hook ---------- */
function useReveal(opts = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("in");
            if (opts.once !== false) io.unobserve(el);
          } else if (opts.once === false) {
            el.classList.remove("in");
          }
        });
      },
      { threshold: opts.threshold ?? 0.18, rootMargin: opts.rootMargin ?? "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function R({ as = "div", v = "r-fade", delay = 0, children, className = "", style, ...rest }) {
  const ref = useReveal();
  const Tag = as;
  const s = { ...(style || {}), transitionDelay: `${delay}ms` };
  return (
    <Tag ref={ref} className={`${v} ${className}`} style={s} {...rest}>
      {children}
    </Tag>);

}

/* line-by-line reveal — every line in own .line-mask span */
function LineMask({ children, delay = 0 }) {
  const ref = useReveal();
  return (
    <span ref={ref} className="line-mask" style={{ transitionDelay: `${delay}ms` }}>
      <span>{children}</span>
    </span>);

}

/* Word reveal */
function Words({ text, baseDelay = 0, step = 60, className = "" }) {
  return (
    <span className={className}>
      {text.split(" ").map((w, i) =>
      <R as="span" v="r-word" delay={baseDelay + i * step} key={i} style={{ marginRight: "0.28em" }}>
          {w}
        </R>
      )}
    </span>);

}

/* Parallax wrapper */
function Parallax({ speed = 0.18, children, className = "", style }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;if (!el) return;
    let raf = 0;
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = r.top + r.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${(-center * speed).toFixed(1)}px, 0)`;
      raf = 0;
    };
    const on = () => {if (!raf) raf = requestAnimationFrame(update);};
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {window.removeEventListener("scroll", on);window.removeEventListener("resize", on);cancelAnimationFrame(raf);};
  }, [speed]);
  return <div ref={ref} className={className} style={{ willChange: "transform", ...(style || {}) }}>{children}</div>;
}

/* Ghost section number that drifts vertically with scroll */
function GhostNum({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;if (!el) return;
    let raf = 0;
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = r.top + r.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${(-center * 0.12).toFixed(1)}px, 0)`;
      raf = 0;
    };
    const on = () => {if (!raf) raf = requestAnimationFrame(update);};
    update();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return <div ref={ref} className="ghost-num">{children}</div>;
}

/* ---------- Interlude full-bleed band ---------- */
function Interlude({ id, src, placeholder, label, quote, side = "left" }) {
  const photoRef = useRef(null);
  useEffect(() => {
    const el = photoRef.current;if (!el) return;
    let raf = 0;
    const update = () => {
      const r = el.parentElement.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = r.top + r.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${(-center * 0.22).toFixed(1)}px, 0)`;
      raf = 0;
    };
    const on = () => {if (!raf) raf = requestAnimationFrame(update);};
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {window.removeEventListener("scroll", on);window.removeEventListener("resize", on);cancelAnimationFrame(raf);};
  }, []);
  return (
    <section className="interlude" aria-hidden="false">
      <div className="photo" ref={photoRef}>
        <img className="cover-img" src={src} alt={placeholder} loading="lazy" />
      </div>
      <div className="legend">
        <R v="r-fade" className="ital">{quote}</R>
        <R v="r-right" as="span">{label}</R>
      </div>
    </section>);

}

/* ---------- Drawer (slide-out menu) ---------- */
function Drawer({ open, onClose }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {document.body.style.overflow = "";};
  }, [open]);

  const rawLinks = [
    { href: "/servicios", label: "Servicios", idx: "00" },
    { href: "#conoce-estefania", label: "Conoce a Estefanía", idx: "01" },
    { href: "#masajes", label: "Masajes & Dúo", idx: "02" },
    { href: "#unas", label: "Uñas de Autor", idx: "03" },
    { href: "#estetica", label: "Estética Facial", idx: "04" },
    { href: "#corporal", label: "Estética Corporal", idx: "05" },
    { href: "#micropigmentacion", label: "Micropigmentación", idx: "06" },
    { href: "#testimonios", label: "Reseñas", idx: "07" },
    { href: "#trayectoria", label: "Trayectoria", idx: "08" },
    { href: "#faq", label: "Preguntas", idx: "09" },
    { href: "#contacto", label: "El Refugio", idx: "10" }
  ];

  const links = rawLinks.filter((l) => l.href !== "#micropigmentacion" || FEATURES.showMicropigmentacion);


  return (
    <div className={`drawer-overlay ${open ? "open" : ""}`} aria-hidden={!open}>
      <div className="scrim" onClick={onClose}></div>
      <aside className="drawer" role="dialog" aria-label="Menú">
        <div className="drawer-top">
          <span className="brand-mark">
            <img className="logo-img on-light" src={BRAND_ASSETS.logoWhite} alt={BUSINESS.name} style={{ height: 40 }} />
          </span>
          <button className="drawer-close" onClick={onClose} aria-label="Cerrar menú"></button>
        </div>
        <nav className="drawer-links">
          {links.map((l) =>
          <a key={l.href} href={l.href} onClick={onClose}>
              <span>{l.label}</span>
              <span className="idx">{l.idx}</span>
            </a>
          )}
        </nav>
        <div className="drawer-foot">
          <div>
            <div className="label">El Refugio</div>
            <div className="addr">{BUSINESS.addressLine}<br />{BUSINESS.postalCity}</div>
          </div>
          <div>
            <div className="label">Síguenos</div>
            <div className="row">
              <a href={BUSINESS.instagramUrl} target="_blank" rel="noopener" aria-label="Instagram">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".9" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href={BUSINESS.mapsShort} target="_blank" rel="noopener" aria-label="Ubicación en Google Maps">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" />
                </svg>
              </a>
            </div>
          </div>
          <a className="btn dark" href={wa(CITA_MSG)} onClick={onClose}>
            Pedir Cita por WhatsApp <span className="arrow">→</span>
          </a>
        </div>
      </aside>
    </div>);

}

/* ---------- Dropdown ---------- */
function NavDropdown({ label, dark = false, panelClass = "", children, align = "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {if (e.key === "Escape") setOpen(false);};
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {document.removeEventListener("mousedown", onClick);document.removeEventListener("keydown", onKey);};
  }, []);
  return (
    <div className={`nav-dd ${open ? "open" : ""}`} ref={ref}>
      <button className={`nav-dd-btn ${dark ? "dark" : ""}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {label}
        <span className="chev"></span>
      </button>
      <div className={`nav-dd-panel ${panelClass} ${align === "right" ? "right-align" : ""}`} onClick={() => setOpen(false)}>
        {children}
      </div>
    </div>);

}

/* ---------- Nav ---------- */
function Nav() {
  const [visible, setVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      // Aparece elegantemente cuando pasas el hero (≈ 88% del viewport)
      setVisible(y > window.innerHeight * 0.88);
      // Sombra y padding extra al haber scrolleado más
      setScrolled(y > window.innerHeight * 1.3);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const Ig =
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".9" fill="currentColor" stroke="none" />
    </svg>;

  const Em =
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
    </svg>;

  const Wa =
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21l1.6-4.6A9 9 0 1 1 8 20.4L3 21z" />
      <path d="M8.5 9c.2 1 .9 2.4 2 3.5s2.5 1.8 3.5 2c.4 0 .9-.1 1.2-.5l.6-.8a.8.8 0 0 0-.2-1.1l-1.3-.8a.8.8 0 0 0-1 .2l-.3.4c-.7-.3-1.4-.7-1.9-1.2s-.9-1.2-1.2-1.9l.4-.3a.8.8 0 0 0 .2-1l-.8-1.3a.8.8 0 0 0-1.1-.2L8 6.6c-.4.3-.5.8-.5 1.2 0 .4.4.8 1 1.2z" />
    </svg>;

  const Pin =
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" />
    </svg>;

  const Car =
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17h2l1.4-4.7A2 2 0 0 1 8.3 11h7.4a2 2 0 0 1 1.9 1.3L19 17h2"/>
      <path d="M5 17v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2M16 17v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2"/>
      <circle cx="7.5" cy="14.5" r=".8"/><circle cx="16.5" cy="14.5" r=".8"/>
    </svg>;

  const mapsLink = BUSINESS.mapsShort;
  const ctaMsg = CITA_MSG;

  return (
    <React.Fragment>
      <header className={`nav ${visible ? "visible" : ""} ${scrolled ? "scrolled" : ""}`}>
        <a href="#top" className="brand-mark" aria-label={BUSINESS.name}>
          <img className="logo-img on-dark" src={BRAND_ASSETS.logoBlack} alt={BUSINESS.name} />
        </a>
        <nav className="nav-links">
          <a href="/servicios">Servicios</a>
          <a href="#conoce-estefania">Conoce a Estefanía</a>
          <a href="#masajes">Masajes &amp; Dúo</a>
          <a href="#unas">Uñas de Autor</a>
          <a href="#estetica">Facial</a>
          <a href="#corporal">Corporal</a>
          {FEATURES.showMicropigmentacion && <a href="#micropigmentacion">Micropigmentación</a>}
        </nav>
        <div className="nav-cta">
          <NavDropdown label={<><span className="lead-ic">{Pin}</span>Encuéntranos</>} panelClass="socials">
            <a className="item" href={wa(ctaMsg)} target="_blank" rel="noopener">
              <span className="ic">{Wa}</span>
              <span className="meta">
                <span className="t">Pedir cita por WhatsApp</span>
                <span className="h">Respuesta personal en minutos</span>
              </span>
              <span className="arrow">→</span>
            </a>
            <a className="item" href={BUSINESS.instagramUrl} target="_blank" rel="noopener">
              <span className="ic">{Ig}</span>
              <span className="meta">
                <span className="t">Instagram</span>
                <span className="h">{BUSINESS.instagramHandle}</span>
              </span>
              <span className="arrow">→</span>
            </a>
          </NavDropdown>

          <NavDropdown label={<><span className="lead-ic">{Car}</span>Ubicación</>} dark>
            <a className="item" href={mapsLink} target="_blank" rel="noopener">
              <span className="ic">{Pin}</span>
              <span className="meta">
                <span className="t">{BUSINESS.addressShort}</span>
                <span className="h">{BUSINESS.postalCity} · {BUSINESS.country}</span>
              </span>
              <span className="arrow">→</span>
            </a>
            <a className="item" href={mapsLink} target="_blank" rel="noopener">
              <span className="ic">{Car}</span>
              <span className="meta">
                <span className="t">Cómo llegar</span>
                <span className="h">Abrir en Google Maps</span>
              </span>
              <span className="arrow">→</span>
            </a>
            <a className="item" href="#contacto">
              <span className="ic">{Em}</span>
              <span className="meta">
                <span className="t">Horario · Lun-Vie</span>
                <span className="h">9:00 – 21:00 · cita previa</span>
              </span>
              <span className="arrow">→</span>
            </a>
          </NavDropdown>
        </div>
      </header>

      {/* Floating menu button — sólo móvil (CSS lo oculta en desktop) */}
      <button className={`float-menu nav-menu-btn ${drawerOpen ? "open" : ""}`}
      onClick={() => setDrawerOpen(true)} aria-label="Abrir menú">
        <span className="lines"></span>
      </button>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </React.Fragment>);

}

/* ---------- Hero ---------- */
function Hero() {
  const photoRef = useRef(null);
  useEffect(() => {
    let raf = 0;
    const apply = () => {
      const y = window.scrollY;
      if (photoRef.current) photoRef.current.style.transform = `translate3d(0, ${(y * 0.22).toFixed(1)}px, 0) scale(1.08)`;
      raf = 0;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section className="hero" id="top">
      <div className="hero-inner">
        <div className="hero-text">
          <R v="r-fade" delay={0}>
            <div className="hero-duo-badge" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(180, 140, 100, 0.12)", border: "1px solid rgba(180, 140, 100, 0.3)", padding: "6px 14px", borderRadius: "100px", fontSize: "13px", fontWeight: "500", marginBottom: "14px", color: "var(--fg)" }}>
              <span>✨</span> <strong>Experiencia Dúo:</strong> Masajes relajantes en pareja, amigas o familiares
            </div>
            <div className="kicker">{BUSINESS.name} · {BUSINESS.tagline}</div>
          </R>

          <h1 className="display">
            <LineMask delay={150}>El arte</LineMask>
            <LineMask delay={350}>de sentirte</LineMask>
            <LineMask delay={550}><em style={{ fontFamily: "var(--display)", fontStyle: "normal" }}>bien.</em></LineMask>
          </h1>

          <R className="lead" delay={1050}>
            Masajes relajantes y en pareja (Dúo), uñas de autor y estética facial y corporal en un espacio íntimo concebido para tu calma en Cuenca.
          </R>

          <R className="hero-actions" delay={1250}>
            <a className="btn dark" href={wa("Hola Stefania, he estado viendo la web y me gustaría reservar una Experiencia Dúo / Masaje en Pareja.")}>
              Reservar Masaje en Dúo <span className="arrow">→</span>
            </a>
            <a className="btn" href="#masajes">Ver Experiencia Dúo</a>
          </R>

          <R className="hero-payment-note" delay={1350} style={{ marginTop: "18px", fontSize: "13px", color: "var(--muted)", opacity: 0.9 }}>
            💳 {BUSINESS.paymentNote}
          </R>
        </div>

        <div className="hero-photo">
          <div className="inner" ref={photoRef} style={{ willChange: "transform" }}>
            <img
              className="cover-img"
              src={SITE_IMAGES.hero}
              alt="Stefania Panzariu, fundadora del estudio de belleza de autor en Cuenca"
              style={{ objectPosition: "50% 20%" }}
              width="1062" height="1509"
              fetchPriority="high"
              loading="eager" />
          </div>
        </div>
      </div>

      <div className="hero-meta">
        <div><span className="num">— </span>{BUSINESS.city} · {BUSINESS.country}</div>
        <div>EST · {BUSINESS.area}</div>
        <div><span className="num">— </span>Belleza de autor</div>
      </div>

      <div className="scroll-cue">
        <span>Desliza</span>
        <span className="bar"></span>
      </div>
    </section>);

}

/* ---------- Conoce a Estefanía ---------- */
function AboutStefaniaSection() {
  return (
    <section className="sec-about" id="conoce-estefania" style={{ padding: "100px 0", background: "var(--bg-alt, #f7f5f0)", borderTop: "1px solid var(--border, rgba(0,0,0,0.06))", borderBottom: "1px solid var(--border, rgba(0,0,0,0.06))" }}>
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <R className="chapter">
          <span className="rule"></span>
          <span className="small-caps">Alma del estudio</span>
        </R>

        <div className="grid-2 end" style={{ alignItems: "center", gap: "48px" }}>
          <div className="about-photo-wrap" style={{ position: "relative" }}>
            <R v="r-mask" className="img" style={{ borderRadius: "12px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}>
              <img
                className="cover-img"
                src={SITE_IMAGES.hero}
                alt="Stefania Panzariu, fundadora del estudio de belleza en Cuenca"
                loading="lazy"
                style={{ width: "100%", maxHeight: "560px", objectFit: "cover", objectPosition: "50% 20%" }}
              />
            </R>
            <div className="about-badge" style={{ position: "absolute", bottom: "-20px", right: "20px", background: "#1a1a1a", color: "#fff", padding: "16px 24px", borderRadius: "8px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: "20px", fontWeight: "400" }}>Stefania Panzariu</div>
              <div style={{ fontSize: "12px", opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Fundadora &amp; Técnica Especialista</div>
            </div>
          </div>

          <div className="about-content">
            <R as="h2" className="h-section" style={{ marginBottom: "24px" }}>
              <LineMask>Conoce a</LineMask>
              <LineMask delay={120}><em style={{ fontFamily: "var(--serif)" }}>Estefanía</em>.</LineMask>
            </R>
            <R className="lead" delay={200} style={{ fontSize: "1.15rem", lineHeight: "1.7", marginBottom: "20px", color: "var(--fg)" }}>
              "Mi objetivo no es cambiar la esencia de nadie, sino resaltar la elegancia, la firmeza y la salud natural que cada persona ya posee."
            </R>
            <R className="body" delay={280} style={{ color: "var(--muted)", marginBottom: "24px", fontSize: "1rem", lineHeight: "1.65" }}>
              Con más de 7 años dedicados profesionalmente al cuidado estético y el bienestar corporal, he concebido un espacio de autor en Cuenca orientado a la máxima personalización. Aquí cada tratamiento se realiza sin prisas, con productos premium respetuosos con tu salud y en una atmósfera de calma y privacidad absoluta.
            </R>
            <R className="about-features" delay={340} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
              <div style={{ padding: "16px", background: "rgba(255,255,255,0.8)", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.06)" }}>
                <strong style={{ display: "block", fontSize: "15px", marginBottom: "4px" }}>✦ Atención 1 a 1</strong>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>Reserva de espacio exclusivo por cita previa.</span>
              </div>
              <div style={{ padding: "16px", background: "rgba(255,255,255,0.8)", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.06)" }}>
                <strong style={{ display: "block", fontSize: "15px", marginBottom: "4px" }}>✦ Rigor &amp; Calidad</strong>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>Técnicas avanzadas y asepsia rigurosa.</span>
              </div>
            </R>
            <R delay={400}>
              <a className="btn dark" href={wa("Hola Stefania, me gustaría consultar la disponibilidad para reservar una cita.")}>
                Contactar personalmente por WhatsApp <span className="arrow">→</span>
              </a>
            </R>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Masajes ---------- */
function MassageSection() {
  return (
    <section className="sec-nails sec-massage" id="masajes">
      <GhostNum>01</GhostNum>
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <R className="chapter">
          <span className="rule"></span>
          <span className="small-caps">Experiencia Dúo · Masajes &amp; Bienestar</span>
        </R>

        <div className="grid-2 end">
          <h2 className="h-section">
            <LineMask>Un paréntesis</LineMask>
            <LineMask delay={120}>para <em style={{ fontFamily: "var(--serif)" }}>dos</em>.</LineMask>
          </h2>
          <R className="body" delay={200}>
            La <strong>Experiencia Dúo</strong> está diseñada para compartir un ritual relajante en la misma cabina: ideal para parejas, amigas, madre e hija o padre e hijo. O si lo prefieres, disfruta de un ritual solo para ti.
          </R>
        </div>

        <div className="nails-stage">
          <div className="col-photos">
            <R v="r-mask" className="img">
              <Parallax speed={0.08} className="inner">
                <img className="cover-img" src={SITE_IMAGES.massagePareja} alt="Masaje relajante en pareja en el estudio de Stefania Panzariu en Cuenca" loading="lazy" />
              </Parallax>
            </R>
            <R v="r-fade" delay={120} className="quote-tile">
              <span className="mark">✦</span>
              <p>Dos camillas, una misma atmósfera de velas y aromaterapia. Un regalo memorable a compartir.</p>
              <span className="sign">Experiencia Dúo</span>
            </R>
            <R v="r-mask" delay={200} className="img">
              <Parallax speed={0.12} className="inner">
                <img className="cover-img" src={SITE_IMAGES.massageDetail} alt="Detalle de masaje relajante con aceites en Stefania Panzariu Studio" loading="lazy" />
              </Parallax>
            </R>
          </div>

          <div className="col-text">
            <R className="kicker" style={{ marginBottom: 16 }}>Experiencia Dúo &amp; Ritual Individual</R>
            <R as="h3" className="h-sub" delay={120} style={{ maxWidth: "20ch" }}>
              Desconectar del estrés y recargar energías a tu ritmo o en compañía.
            </R>
            <div className="nails-features">
              <R as="div" className="feat" v="r-left">
                <div className="label">En Pareja / Dúo</div>
                <div>
                  <h4>Masaje en Dúo (Parejas, Amigas, Familia)</h4>
                  <p>Dos terapeutas/camillas en la misma cabina para compartir un momento de calma absoluta con tu pareja, mejor amiga, madre/padre o hijo/a.</p>
                </div>
              </R>
              <R as="div" className="feat" v="r-left" delay={120}>
                <div className="label">Individual</div>
                <div>
                  <h4>Masaje Relajante Corporal</h4>
                  <p>Maniobras envolventes y presión personalizada con aceites botánicos para aliviar la tensión acumulada y serenar la mente.</p>
                </div>
              </R>
              <R as="div" className="feat" v="r-left" delay={240}>
                <div className="label">Garantía</div>
                <div>
                  <h4>Sin pagos previos online</h4>
                  <p>Realizas tu reserva por WhatsApp y el pago se efectúa directamente en el establecimiento en Efectivo o Tarjeta.</p>
                </div>
              </R>
            </div>

            <R delay={300} style={{ marginTop: 36 }}>
              <a className="btn dark" href={wa("Hola Stefania, quiero pedir cita para la Experiencia Dúo (Masaje en pareja / acompañante).")}>
                Reservar Experiencia Dúo <span className="arrow">→</span>
              </a>
            </R>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Micropigmentación ---------- */
function MicroSection() {
  const methods = [
  {
    n: "01",
    t: "Visagismo hiperrealista, pelo a pelo",
    d: "Estudiamos tu estructura ósea, la dirección natural de tu vello y la tonalidad de tu piel para recrear unas cejas con un realismo tridimensional absoluto. No iniciamos el tratamiento hasta que apruebes el boceto a lápiz."
  },
  {
    n: "02",
    t: "Labios de seda · Acuarela Lip Blush",
    d: "Devolvemos la definición perdida al contorno de tus labios y aportamos un tono saludable y jugoso con pigmentos orgánicos de última generación."
  },
  {
    n: "03",
    t: "Eyeliner degradado de alta precisión",
    d: "Una sombra sutil y elegante en el párpado que enmarca y despierta la mirada sin el efecto duro de un delineado convencional."
  }];

  return (
    <section className="sec-micro sec-micro-secondary" id="micropigmentacion">
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <R className="chapter">
          <span className="rule"></span>
          <span className="small-caps">También en el estudio · Micropigmentación</span>
        </R>

        <div className="grid-2 end">
          <h2 className="h-sub">
            <LineMask>La armonía</LineMask>
            <LineMask delay={120}>que siempre estuvo ahí.</LineMask>
          </h2>
          <R className="body" delay={200}>
            Diseño visagista hiperrealista para cejas, labios y mirada, con asepsia
            de grado clínico y pigmentos AEMPS. Consulta disponibilidad y resuelve
            tus dudas por WhatsApp.
          </R>
        </div>

        <div className="methods-list compact">
          {methods.map((m, i) =>
          <R as="div" key={m.n} className="row" v="r-left" delay={i * 80}>
              <div className="n">{m.n}</div>
              <div>
                <h4>{m.t}</h4>
                <p>{m.d}</p>
              </div>
            </R>
          )}
        </div>

        <R style={{ marginTop: 48 }}>
          <a className="linkish" href={wa("Hola Stefania, me gustaría recibir más información sobre Micropigmentación.")}>
            Más información sobre micropigmentación <span className="arrow">→</span>
          </a>
        </R>
      </div>
    </section>);

}

/* ---------- Nails ---------- */
function NailsSection() {
  return (
    <section className="sec-nails" id="unas">
      <GhostNum>02</GhostNum>
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <R className="chapter">
          <span className="rule"></span>
          <span className="small-caps">Uñas de Autor</span>
        </R>

        <div className="grid-2 end">
          <h2 className="h-section">
            <LineMask>La manicura</LineMask>
            <LineMask delay={120}>que <em style={{ fontFamily: "var(--serif)" }}>fortalece</em></LineMask>
            <LineMask delay={240}>desde la raíz.</LineMask>
          </h2>
          <R className="body" delay={200}>
            Las uñas hermosas no son el resultado de ocultar imperfecciones bajo
            capas pesadas. Esculpimos la elegancia sobre la salud de tu uña natural.
          </R>
        </div>

        <div className="nails-stage">
          <div className="col-photos">
            <R v="r-mask" className="img">
              <Parallax speed={0.08} className="inner">
                <img className="cover-img" src={SITE_IMAGES.nailMilky} alt="Uñas de autor con acabado milky en Stefania Panzariu Studio" loading="lazy" />
              </Parallax>
            </R>
            <R v="r-fade" delay={120} className="quote-tile">
              <span className="mark">✦</span>
              <p>Manos cuidadas, acabados limpios y una elegancia que no necesita gritar.</p>
              <span className="sign">Quiet Luxury</span>
            </R>
            <R v="r-mask" delay={200} className="img">
              <Parallax speed={0.12} className="inner">
                <img className="cover-img" src={SITE_IMAGES.nailNude} alt="Uñas nude translúcidas con acabado limpio y natural" loading="lazy" />
              </Parallax>
            </R>
          </div>

          <div className="col-text">
            <R className="kicker" style={{ marginBottom: 16 }}>Quiet Luxury</R>
            <R as="h3" className="h-sub" delay={120} style={{ maxWidth: "20ch" }}>
              Tonos lechosos, nudes translúcidos y acabados limpios que estilizan tus manos.
            </R>
            <div className="nails-features">
              <R as="div" className="feat" v="r-left">
                <div className="label">Técnica</div>
                <div>
                  <h4>Manicura de alta precisión</h4>
                  <p>Trabajamos la cutícula con detalle y herramientas específicas, logrando un esmaltado impecable que nace bajo el pliegue de la piel.</p>
                </div>
              </R>
              <R as="div" className="feat" v="r-left" delay={120}>
                <div className="label">Refuerzo</div>
                <div>
                  <h4>Nivelación de matriz · Rubber Base</h4>
                  <p>Bases de primera calidad para corregir imperfecciones y fortalecer la placa natural, con durabilidad de más de 3 semanas.</p>
                </div>
              </R>
              <R as="div" className="feat" v="r-left" delay={240}>
                <div className="label">Estética</div>
                <div>
                  <h4>Milky &amp; soft neutrals</h4>
                  <p>Acabados limpios y atemporales que respetan la anatomía de la mano y se mantienen elegantes en cualquier contexto.</p>
                </div>
              </R>
            </div>

            <R delay={300} style={{ marginTop: 36 }}>
              <a className="btn dark" href={wa("Hola, quiero reservar una cita para uñas de autor con refuerzo de matriz.")}>
                Reservar mi ritual <span className="arrow">→</span>
              </a>
            </R>
          </div>
        </div>
      </div>
    </section>);

}

/* ---------- Facial ---------- */
function FacialSection() {
  return (
    <section className="sec-facial" id="estetica">
      <GhostNum>03</GhostNum>
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <R className="chapter">
          <span className="rule"></span>
          <span className="small-caps">Estética facial avanzada</span>
        </R>

        <div className="facial-grid">
          <div className="facial-photos">
            <R v="r-mask" className="p1">
              <Parallax speed={0.08} className="inner">
                <img className="cover-img" src={SITE_IMAGES.facialCabin} alt="Cabina de estética facial avanzada con luz cálida" loading="lazy" />
              </Parallax>
            </R>
            <R v="r-mask" delay={200} className="p2">
              <Parallax speed={0.14} className="inner">
                <img className="cover-img" src={SITE_IMAGES.pigmentDetail} alt="Detalle macro de la piel en un tratamiento de estética facial avanzada" loading="lazy" />
              </Parallax>
            </R>
          </div>

          <div>
            <h2 className="h-section" style={{ marginBottom: 28 }}>
              <LineMask>Cuidando tu piel</LineMask>
              <LineMask delay={120}>y tu alma.</LineMask>
            </h2>
            <R className="lead" delay={200}>
              Un ritual diseñado para silenciar el ruido exterior y devolver el
              resplandor natural a tu rostro. Un momento de pausa y reconexión profunda.
            </R>

            <div className="ritual-list">
              <R as="div" v="r-left" className="it">
                <div className="mark">✦</div>
                <div>
                  <h4>Brightening Action</h4>
                  <p>Tratamiento profesional despigmentante e iluminador que unifica el tono, reduce imperfecciones y aporta un efecto glow inmediato desde la primera sesión.</p>
                </div>
              </R>
              <R as="div" v="r-left" delay={120} className="it">
                <div className="mark">✦</div>
                <div>
                  <h4>Argi-Mask White · Arcilla blanca</h4>
                  <p>Ritual oxigenante que limpia en profundidad, equilibra la piel cansada y la deja increíblemente suave, fresca y luminosa.</p>
                </div>
              </R>
            </div>

            <R delay={280} style={{ marginTop: 36 }}>
              <a className="btn dark" href={wa("Hola Stefania, me gustaría reservar una sesión de Estética Facial Avanzada.")}>
                Regalarme un momento de calma <span className="arrow">→</span>
              </a>
            </R>
          </div>
        </div>
      </div>
    </section>);

}

/* ---------- Armonía Corporal ---------- */
function BodySection() {
  return (
    <section className="sec-body" id="corporal">
      <GhostNum>04</GhostNum>
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <R className="chapter">
          <span className="rule"></span>
          <span className="small-caps">Estética corporal</span>
        </R>

        <div className="body-grid">
          <div className="body-text">
            <h2 className="h-section" style={{ marginBottom: 28 }}>
              <LineMask>Reconectar con</LineMask>
              <LineMask delay={120}>tu <em style={{ fontFamily: "var(--serif)" }}>cuerpo</em>.</LineMask>
            </h2>
            <R className="lead" delay={200}>
              Rituales diseñados para reconectar con tu cuerpo, liberando tensión
              y realzando tu firmeza natural a través de terapias manuales y técnicas avanzadas.
            </R>

            <div className="ritual-list">
              <R as="div" v="r-left" className="it">
                <div className="mark">✦</div>
                <div>
                  <h4>Maderoterapia Corporal</h4>
                  <p>Técnica natural con elementos de madera noble que moldea la silueta, tonifica el tejido y ayuda a alisar y combatir la celulitis.</p>
                </div>
              </R>
              <R as="div" v="r-left" delay={100} className="it">
                <div className="mark">✦</div>
                <div>
                  <h4>Drenaje Linfático Manual</h4>
                  <p>Terapia suave y descongestiva que estimula el sistema linfático, favorece la eliminación de toxinas y alivia eficazmente la retención de líquidos y piernas cansadas.</p>
                </div>
              </R>
              <R as="div" v="r-left" delay={200} className="it">
                <div className="mark">✦</div>
                <div>
                  <h4>Exfoliación Corporal</h4>
                  <p>Renovación epidérmica profunda que elimina células muertas, suaviza el grano de la piel y prepara el tejido para una absorción óptima de principios activos.</p>
                </div>
              </R>
              <R as="div" v="r-left" delay={300} className="it">
                <div className="mark">✦</div>
                <div>
                  <h4>Envolturas Corporales Nutritivas</h4>
                  <p>Ritual de hidratación y reafirmación intensiva con concentrados botánicos y arcillas que devuelven la elasticidad, firmeza y luminosidad al cuerpo.</p>
                </div>
              </R>
            </div>

            <R delay={320} style={{ marginTop: 36 }}>
              <a className="btn dark" href={wa("Hola Stefania, me gustaría reservar una sesión de tratamiento corporal (Armonía Corporal).")}>
                Reservar mi ritual corporal <span className="arrow">→</span>
              </a>
            </R>
          </div>

          <div className="body-visual">
            <R v="r-fade" delay={300}>
              <div className="body-visual-deco">
                <div className="ring"></div>
                <div className="ring"></div>
                <div className="ring"></div>
                <div className="center-mark">✦</div>
              </div>
            </R>
          </div>
        </div>
      </div>
    </section>);

}

/* ---------- Trayectoria ---------- */
function TrackSection() {
  const wrapRef = useRef(null);
  const progRef = useRef(null);
  useEffect(() => {
    const wrap = wrapRef.current;const prog = progRef.current;
    if (!wrap || !prog) return;
    const update = () => {
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = r.top - vh * 0.5;
      const end = r.top + r.height - vh * 0.5;
      const t = Math.max(0, Math.min(1, -start / (end - start)));
      prog.style.height = `${(t * 100).toFixed(1)}%`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {window.removeEventListener("scroll", update);window.removeEventListener("resize", update);};
  }, []);

  const steps = [
  {
    n: "01",
    t: "Perfección bajo presión",
    d: "Compitiendo a nivel nacional con los mejores talentos del maquillaje permanente en el campeonato The Beauty Experts (Valencia) para mantener nuestro estudio a la vanguardia absoluta.",
    tag: "El Reconocimiento",
    src: SITE_IMAGES.artistTool,
    alt: "Stefania Panzariu con su dermógrafo de micropigmentación en el estudio de Cuenca",
    pos: "50% 28%"
  },
  {
    n: "02",
    t: "Innovación sin fronteras",
    d: "Formación continua en el World PMU Congress 2026 a bordo del MSC Fantasia. Análisis de tendencias mundiales en técnicas de implantación de pigmentos hiperrealistas.",
    tag: "El Congreso Mundial",
    src: SITE_IMAGES.hero,
    alt: "Retrato de Stefania Panzariu, artista de micropigmentación y belleza de autor en Cuenca",
    pos: "50% 18%"
  },
  {
    n: "03",
    t: "Tu confianza es el destino",
    d: "Traer la excelencia internacional directamente al corazón de Cuenca, ofreciéndote un refugio donde la técnica se convierte en arte.",
    tag: "La Misión",
    src: SITE_IMAGES.facialCabin,
    alt: "Cabina del estudio Stefania Panzariu en Cuenca, un refugio íntimo de belleza",
    pos: "50% 50%"
  }];


  return (
    <section className="sec-track" id="trayectoria">
      <GhostNum>05</GhostNum>
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <R className="chapter">
          <span className="rule" style={{ background: "rgba(255,255,255,.5)" }}></span>
          <span className="small-caps">El cuaderno de la artista</span>
        </R>

        <div className="grid-2 end">
          <h2 className="h-section">
            <LineMask>La trayectoria</LineMask>
            <LineMask delay={120}>del autor.</LineMask>
          </h2>
          <R className="body" delay={200} style={{ color: "rgba(255,255,255,.72)" }}>
            Tres hitos que cuentan, sin atajos, cómo nace este estudio: del
            entrenamiento competitivo al congreso mundial, y de ahí a un rincón
            íntimo en el corazón de Cuenca.
          </R>
        </div>

        <div className="track-timeline" ref={wrapRef}>
          <div className="track-progress" ref={progRef}></div>
          {steps.map((s, i) =>
          <R as="div" key={s.n} className={`track-step ${i % 2 === 1 ? "right" : ""}`}>
              {i % 2 === 0 ?
            <React.Fragment>
                  <div className="img-wrap">
                    <Parallax speed={0.1} className="inner">
                      <img className="cover-img" src={s.src} alt={s.alt} style={{ objectPosition: s.pos }} loading="lazy" />
                    </Parallax>
                  </div>
                  <div className="dot"></div>
                  <div className="text">
                    <div className="n">{s.n}</div>
                    <h3>{s.t}</h3>
                    <p>{s.d}</p>
                  </div>
                </React.Fragment> :

            <React.Fragment>
                  <div className="text">
                    <div className="n">{s.n}</div>
                    <h3>{s.t}</h3>
                    <p>{s.d}</p>
                  </div>
                  <div className="dot"></div>
                  <div className="img-wrap">
                    <Parallax speed={0.1} className="inner">
                      <img className="cover-img" src={s.src} alt={s.alt} style={{ objectPosition: s.pos }} loading="lazy" />
                    </Parallax>
                  </div>
                </React.Fragment>
            }
            </R>
          )}
        </div>
      </div>
    </section>);

}

/* ---------- Testimonials ---------- */
function TestimonialsSection() {
  const [activeFilter, setActiveFilter] = useState("all");
  const reviews = [
    { name: "Cecilia Gil Navarro", service: "Estética facial", date: "Hace 3 días", tags: ["facial", "experiencia"], text: "Como siempre, una experiencia maravillosa. Nunca deja de sorprenderme por su profesionalidad, dedicación y el cariño con el que realiza cada tratamiento.", a: "C" },
    { name: "P. María del Carmen", service: "Facial y labios", date: "Hace 3 días", tags: ["facial", "micro"], text: "Resultados espectaculares. No puedo estar más feliz con el resultado. El tratamiento facial dejó mi piel luminosa e hidratada.", a: "M" },
    { name: "Maria IM", service: "Limpieza facial", date: "Hace una semana", tags: ["facial", "experiencia"], text: "He salido encantada con la limpieza facial. Desde que entras por la puerta te sientes como en casa: ambiente acogedor, trato cercano y muy profesional.", a: "M" },
    { name: "Carmen Lopez Sanabria", service: "Atención y paciencia", date: "Hace 2 semanas", tags: ["experiencia"], text: "Estefanía, un amor como siempre. Ama lo que hace y la atención es un 10. Sobre todo tiene mucha paciencia.", a: "C" },
    { name: "Isabel Aranda Garcia", service: "Trato profesional", date: "Hace 3 semanas", tags: ["experiencia"], text: "Profesional a tope y muy amable. La recomiendo al 100%.", a: "I" },
    { name: "Maria Mercedes Felipe Auñón", service: "Sombreado de cejas", date: "Hace 3 semanas", tags: ["micro"], text: "Me hice un sombreado de cejas y me quedaron espectaculares. Tenía tatuaje por debajo y ha sido todo un acierto. Recomendado 100%.", a: "M" },
    { name: "Eden Niknafs", service: "Uñas y maquillaje permanente", date: "Hace 3 semanas", tags: ["unas", "micro"], text: "I have been visiting Estefania for my nails and have been delighted with her work. She is a true professional and talented technician.", a: "E" },
    { name: "Conchi Pérez Real", service: "Todos los tratamientos", date: "Hace 3 semanas", tags: ["experiencia", "facial"], text: "Ponerte en manos de Estefanía es garantía de éxito. Es una profesional muy perfeccionista; su asesoramiento, trato y amabilidad diferencian su trabajo.", a: "C" },
    { name: "Judith Barrios Gómez", service: "Centro de estética", date: "Hace 3 semanas", tags: ["facial", "experiencia"], text: "Estoy encantada con este centro de estética. Desde la primera visita me hizo sentir súper cómoda y muy bien atendida.", a: "J" },
    { name: "Débora Gómez Romero", service: "Manos y pies", date: "Hace 4 semanas", tags: ["unas", "pies"], text: "No solo hizo su arte en mis manos, que como siempre es espectacular; también sanó unos pies que llevaban mucho encima.", a: "D" },
    { name: "Maribel Rabadan", service: "Trato cercano", date: "Hace un mes", tags: ["experiencia"], text: "Estefania es una buenísima profesional, con mucho interés en su profesión. Siempre está contenta; se ve que es feliz con lo que hace.", a: "M" },
    { name: "Natalia Abanades", service: "Limpieza facial", date: "Hace un mes", tags: ["facial"], text: "La limpieza facial ha sido espectacular. Mi piel ha quedado con una luz increíble, súper fresca y mucho más uniforme. Noté el resultado al instante.", a: "N" },
    { name: "Sabrina Calleja", service: "Manicura", date: "Hace un año", tags: ["unas"], text: "Llevo haciéndome las uñas 20 años. Estefania es la manicurista más profesional que he tenido. Mis uñas están preciosas y duran 6 semanas perfectamente.", a: "S" },
    { name: "Lau GasCar", service: "Experiencia", date: "Hace 2 años", tags: ["experiencia"], text: "Mi experiencia con Estefanía es espectacular siempre, así como de espectacular es ella.", a: "L" },
    { name: "Paula Lapeña Gonzalez", service: "Uñas y asesoramiento", date: "Hace 2 años", tags: ["unas", "experiencia"], text: "Súper satisfecha con mi experiencia. Es muy profesional, el sitio es acogedor y aconseja lo mejor para el cuidado de tus uñas.", a: "P" },
    { name: "Judit GG", service: "Diseños de uñas", date: "Hace 2 años", tags: ["unas"], text: "Más de cuatro años llevo a su lado haciéndome las uñas. Siempre crea los diseños perfectos y te deja las uñas perfectísimas.", a: "J" },
    { name: "Rebeca Lorente Martínez", service: "Durabilidad", date: "Hace 2 años", tags: ["unas"], text: "Son 7 años haciéndome las uñas con ella y la calidad es inmejorable. Jamás se me ha partido o caído una uña. Siempre innovando.", a: "R" },
    { name: "Déborah García Plaza", service: "Puntualidad y calidad", date: "Hace un año", tags: ["unas", "experiencia"], text: "La mejor de Cuenca: buen precio, calidad y duración. No te hace esperar; es muy puntual y organizada con los tiempos.", a: "D" },
    { name: "Beatriz Murcia Collado", service: "Uñas sanas", date: "Hace 2 años", tags: ["unas"], text: "Elegir a Estefanía para el cuidado de tus uñas es un acierto. Nunca he tenido mis uñas tan bonitas y sanas.", a: "B" },
    { name: "Cristina Castellanos", service: "Duración y horarios", date: "Hace 2 años", tags: ["unas", "experiencia"], text: "Gran profesional. Las uñas duran muchísimo y lo más importante: respeta mucho los horarios. Calidad-precio, la mejor.", a: "C" },
    { name: "Ikigai Bienestar", service: "Uñas sanas", date: "Hace 2 años", tags: ["unas"], text: "Desde hace 3 años mis uñas cuidadas y bonitas gracias a Estefanía, con la seguridad de que están sanas. Adapta el diseño a mis gustos.", a: "I" },
    { name: "Sheyla Villarreal", service: "Terminación de uña", date: "Hace 2 años", tags: ["unas"], text: "Es una auténtica profesional. Una calidad buenísima y un terminado de uña perfecto.", a: "S" },
    { name: "Amalia Avram", service: "Diseños exactos", date: "Hace un año", tags: ["unas"], text: "En mi vida he tenido las uñas tan perfectas e impecables. Duran un montón y te hace los diseños tal cual.", a: "A" },
    { name: "Sonia Del Hoyo", service: "Uñas bonitas", date: "Hace 2 años", tags: ["unas"], text: "Desde que me hizo las uñas por primera vez, tengo las uñas bonitas. Gracias a ella, mis uñas me encantan.", a: "S" },
    { name: "Silvia Silvia", service: "Detalle y elegancia", date: "Hace 2 años", tags: ["unas"], text: "Si buscas unas uñas que te identifiquen, cuidadas hasta en el más mínimo detalle, este es el sitio idóneo.", a: "S" },
    { name: "Noemí De la Morena López", service: "Trato y manicura", date: "Hace 2 años", tags: ["unas", "experiencia"], text: "Llevo dos años haciéndome las uñas con Estefania y estoy encantada: uñas muy bien hechas y trato buenísimo.", a: "N" },
    { name: "María MePo", service: "Uñas perfectas", date: "Hace 2 años", tags: ["unas", "experiencia"], text: "Magnífica persona y profesional. Salgo siempre encantada por el trato y por mis uñas perfectas.", a: "M" },
    { name: "Leticia Guadalajara Pérez", service: "Uñas y trato", date: "Hace 2 años", tags: ["unas", "experiencia"], text: "Encantada con los resultados cada vez que voy. Estefania es una gran profesional y muy agradable.", a: "L" },
    { name: "Explora Cuenca", service: "Cuidado de uñas", date: "Hace 2 años", tags: ["unas", "experiencia"], text: "Trato y profesionalidad excelentes. Hace años que Estefanía cuida mis uñas y sigo encantada. Recomendable 100%.", a: "E" },
    { name: "Laura Aparicio Puerta", service: "Diseño personalizado", date: "Hace 2 años", tags: ["unas"], text: "Siempre consigue mejorar tus ideas y hacer que te encante su trabajo. Sabe plasmar tus gustos y jamás se equivoca.", a: "L" },
    { name: "Elena Viana", service: "Tendencias y calidad", date: "Hace 2 años", tags: ["unas", "experiencia"], text: "Excepcional. Profesionalidad, calidad y trato. Está a la última en tendencias y productos. Llevo siete años con ella.", a: "E" },
    { name: "Purificación Blanco", service: "Resultado y cercanía", date: "Hace 9 meses", tags: ["experiencia"], text: "Muy satisfecha con el resultado, mucha profesionalidad y cercanía.", a: "P" },
    { name: "Feli Cuenca", service: "Duración", date: "Hace 2 años", tags: ["unas"], text: "Llegué a hacerme las uñas después de un mes y siete días con todas enteritas, ni una partida. Contentísima.", a: "F" },
    { name: "Lorena Del Cubo", service: "Fidelidad", date: "Hace 2 años", tags: ["experiencia"], text: "Trabajo magnífico y maravillosa persona. Llevo muchísimos años con Estefania y así seguiré.", a: "L" },
    { name: "Alina Baciu", service: "Confianza", date: "Hace 11 meses", tags: ["experiencia"], text: "Súper satisfecha con el trabajo que hace y lo profesional que es. El sitio es acogedor y transmite mucha confianza.", a: "A" },
    { name: "María Teresa", service: "Arte en uñas", date: "Hace un año", tags: ["unas"], text: "Excelente profesional. Una artista de las uñas con todas las letras. Encantadísima siempre con su trabajo.", a: "M" },
    { name: "Sandra Molinero", service: "Trabajos impecables", date: "Hace 2 años", tags: ["unas", "experiencia"], text: "Excelente profesional. Trabajos impecables. Llevo más de 5 años con ella y no cambio.", a: "S" },
    { name: "Teresa Tejeda", service: "Clienta fiel", date: "Hace un año", tags: ["experiencia", "unas"], text: "Son muchos años desde que empecé con ella y no puedo estar más satisfecha con su trabajo. Para mí, la mejor.", a: "T" },
    { name: "Patricia SJB", service: "Trato humano", date: "Hace 2 años", tags: ["experiencia"], text: "Persona 10 en todos los sentidos. Verdadera profesional y maravillosa persona, siempre sacando una sonrisa.", a: "P" },
    { name: "Alicia Ruiz", service: "Arte en uñas", date: "Hace 2 años", tags: ["unas", "experiencia"], text: "Una profesional de los pies a la cabeza, hace arte en las uñas y además es una persona maravillosa.", a: "A" },
    { name: "Alexia Pardo", service: "Experiencia", date: "Hace un año", tags: ["experiencia"], text: "Muy satisfecha con mi experiencia. Estoy con ella desde hace mucho tiempo y es una gran profesional.", a: "A" },
    { name: "Belén Torralba Plaza", service: "Manicura", date: "Hace 2 años", tags: ["unas"], text: "Llevo varios años haciéndome la manicura con Estefania. Es magnífica y encantadora. Se supera con cada diseño.", a: "B" },
    { name: "Lucía Abad Ayora", service: "Experiencia", date: "Hace 2 años", tags: ["experiencia"], text: "Me encanta cómo lo hace y cada día que voy me gusta más.", a: "L" },
    { name: "Teresa Fuentes", service: "Uñas perfectas", date: "Hace 2 años", tags: ["unas", "experiencia"], text: "Excelente trato y profesionalidad en su trabajo. Uñas perfectas. 100% recomendable.", a: "T" },
    { name: "Ana Cepas Muñoz", service: "Uñas en Cuenca", date: "Hace 2 años", tags: ["unas"], text: "Aparte de hacer las mejores uñas de Cuenca, ella en sí es estupenda. Vuelvo siempre.", a: "A" },
    { name: "Elena Silvestre", service: "Fidelidad", date: "Hace 2 años", tags: ["experiencia"], text: "Una auténtica profesional. Llevo 8 años en sus manos y como persona es inmejorable.", a: "E" },
    { name: "Sonia Langreo Escudero", service: "Profesionalidad", date: "Hace un año", tags: ["experiencia"], text: "Llevo muchos años con ella y es muy buena. Profesional y simpática.", a: "S" },
    { name: "Diana Panadero Alvarez", service: "Uñas y cercanía", date: "Hace 2 años", tags: ["unas", "experiencia"], text: "Dos años con Estefanía y nunca defrauda. Además de hacer unas bonitas uñas, te sientes en casa.", a: "D" },
    { name: "Virginia Valenciano Saiz", service: "Uñas rápidas", date: "Hace un año", tags: ["unas"], text: "Manicurista maravillosa. Llevo años con ella y hace un trabajo excelente y en una hora.", a: "V" },
    { name: "Mónica López Ortiz", service: "Puntualidad y producto", date: "Hace 2 años", tags: ["unas", "experiencia"], text: "De 10 como siempre. Puntual, trabajo excelente, calidad en los productos y unas uñas preciosas.", a: "M" },
    { name: "Alexandra Vilcan", service: "Uñas", date: "Hace 2 años", tags: ["unas"], text: "Llevo años haciéndome las uñas con ella y estoy muy encantada.", a: "A" },
    { name: "Bea Langreo", service: "Experiencia", date: "Hace un año", tags: ["experiencia"], text: "Es mi segunda vez con Estefanía y la verdad que volveré. Un placer.", a: "B" },
    { name: "Jenifer Rodriguez", service: "Uñas en Cuenca", date: "Hace un año", tags: ["unas"], text: "El mejor sitio de uñas en Cuenca. Llevo años haciéndome las uñas con ella y no la cambio por nada.", a: "J" },
    { name: "Rocio De las Heras Sanchez", service: "Uñas acrílicas", date: "Hace un año", tags: ["unas"], text: "Uñas acrílicas muy bien hechas, con muchísima variedad de colores y diseños muy bonitos y detallados.", a: "R" },
    { name: "Adriana Castellanos", service: "Manicura", date: "Hace un año", tags: ["unas", "experiencia"], text: "La mejor manicurista que hay. Increíble su trabajo y su trato. 100% recomendada.", a: "A" },
    { name: "Virginia Hernansaiz Arguisuelas", service: "Rapidez y trato", date: "Hace 2 años", tags: ["experiencia"], text: "Una profesional de los pies a la cabeza. Además de su rapidez y trato. Encantada siempre con los resultados.", a: "V" },
    { name: "Natalia Vindel", service: "Servicio y resultado", date: "Hace 2 años", tags: ["experiencia"], text: "Gran profesional; atención, servicio y resultado inmejorable. No hay otra mejor. Recomendable al 100%.", a: "N" },
    { name: "Paula Mora", service: "Adaptación a gustos", date: "Hace un año", tags: ["unas", "experiencia"], text: "Una experiencia increíble, siempre con una gran adaptación a tus gustos. Da gusto encontrar a alguien tan profesional.", a: "P" },
    { name: "Carmen Dominguez", service: "Cuidado de manos", date: "Hace 2 años", tags: ["unas"], text: "Donde mejor y con más cariño te cuida de tus manos. Muy recomendable y muy profesional.", a: "C" },
    { name: "Coral Valverde Templado", service: "Uñas perfectas", date: "Hace 2 años", tags: ["unas", "experiencia"], text: "Una auténtica profesional en mayúsculas. Nunca he llevado las uñas tan perfectas y el trato es exquisito.", a: "C" },
    { name: "Cristina Plaza", service: "Resultado", date: "Hace un año", tags: ["experiencia"], text: "Trabajo espectacular. Muy profesional y amable. Encantada.", a: "C" },
    { name: "Veronica Jimenez", service: "Uñas de ensueño", date: "Hace un año", tags: ["unas"], text: "La mejor para hacerse uñas. Gracias a ella tengo unas uñas de ensueño.", a: "V" },
    { name: "Nerea Fernández", service: "Uñas", date: "Hace un año", tags: ["unas"], text: "Es la mejor haciendo uñas y un amor.", a: "N" },
    { name: "Raquel Oliver", service: "Trato agradable", date: "Hace 2 años", tags: ["experiencia"], text: "Profesional, hace genial su trabajo y además es muy agradable.", a: "R" },
    { name: "Antonio Baciu", service: "Uñas", date: "Hace un año", tags: ["unas"], text: "Muy buen servicio y las uñas chulísimas.", a: "A" },
    { name: "Verónica Ventura", service: "Cercanía", date: "Hace 2 años", tags: ["experiencia"], text: "Muy profesional, cercana y amable. Recomiendo totalmente. Es un 10.", a: "V" },
    { name: "Patricia Martinez Portero", service: "Manicura", date: "Hace 2 años", tags: ["unas"], text: "El mejor sitio de Cuenca para tener una manicura perfecta.", a: "P" },
    { name: "Irene Navarro Palencia", service: "Cercanía", date: "Hace 2 años", tags: ["experiencia"], text: "Es profesional y muy cercana con los clientes. Sin duda, la mejor.", a: "I" },
    { name: "Brujillaratona Niña", service: "Experiencia", date: "Hace un año", tags: ["experiencia"], text: "Donde la vida te la hace más fácil. Gracias por tanto.", a: "B" },
    { name: "Lucía Torrijos Laín", service: "Renovación", date: "Hace un año", tags: ["experiencia"], text: "Muy profesional y renovándose continuamente.", a: "L" },
    { name: "Julia Pontones", service: "Servicio", date: "Hace 2 años", tags: ["experiencia"], text: "Muy buen servicio y Estefanía muy maja.", a: "J" },
    { name: "Luz María Carrasco Castro", service: "Experiencia", date: "Hace un año", tags: ["experiencia"], text: "Eres la mejor, en todos los sentidos.", a: "L" },
  ];

  const rawFilters = [
    { id: "all", label: "Todas", note: "Reseñas con texto" },
    { id: "unas", label: "Uñas", note: "Diseño, duración y salud natural" },
    { id: "micro", label: "Micro", note: "Cejas, labios y ojos" },
    { id: "facial", label: "Facial", note: "Limpieza y tratamientos" },
    { id: "pies", label: "Pies", note: "Cuidado y bienestar" },
    { id: "experiencia", label: "Trato", note: "Puntualidad y confianza" },
  ];
  const filters = rawFilters.filter((f) => f.id !== "micro" || FEATURES.showMicropigmentacion);
  const catLabel = {
    unas: "Uñas",
    micro: "Micropigmentación",
    facial: "Facial",
    pies: "Pies",
    experiencia: "Trato",
  };
  const activeReviews = activeFilter === "all" ? reviews : reviews.filter((r) => r.tags.includes(activeFilter));
  const activeMeta = filters.find((f) => f.id === activeFilter) || filters[0];
  const countFor = (id) => id === "all" ? reviews.length : reviews.filter((r) => r.tags.includes(id)).length;

  const Star = () => (
    <svg viewBox="0 0 24 24"><path d="M12 2l2.95 6.97L22 10l-5.5 4.78L18.18 22 12 18.27 5.82 22l1.68-7.22L2 10l7.05-1.03L12 2z"/></svg>
  );

  const GoogleG = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.5 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.22-4.74 3.22-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );

  return (
    <section className="sec-testimonials" id="testimonios">
      <Ornament style={{ top: 60, right: -40 }} speed={0.05}>06</Ornament>
      <Ornament tick style={{ bottom: 60, left: -20 }} speed={-0.08}>“</Ornament>

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <R className="chapter">
          <span className="rule"></span>
          <span className="small-caps">Reseñas verificadas en Google</span>
        </R>

        <div className="testimonials-head">
          <h2 className="h-section">
            <LineMask>Lo que dicen</LineMask>
            <LineMask delay={120}>en <em style={{fontFamily:"var(--serif)"}}>Cuenca</em>.</LineMask>
          </h2>
          <R className="body" delay={200}>
            Reseñas reales de Google clasificadas por servicio: uñas, micropigmentación,
            estética facial, pies y experiencia en el estudio.
          </R>
        </div>

        <div className="reviews-board">
          <div className="review-filters" role="tablist" aria-label="Filtrar reseñas por servicio">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`review-filter ${activeFilter === f.id ? "is-active" : ""}`}
                onClick={() => setActiveFilter(f.id)}
                aria-pressed={activeFilter === f.id}>
                <span className="rf-label">{f.label}</span>
                <span className="rf-count">{countFor(f.id)}</span>
              </button>
            ))}
          </div>

          <div className="reviews-panel-head">
            <div>
              <span className="small-caps">{activeMeta.note}</span>
              <h3>{activeMeta.label}</h3>
            </div>
            <span className="reviews-total">{activeReviews.length} comentarios</span>
          </div>

          <div className="reviews-table">
            {activeReviews.map((r, i) => {
              const primary = r.tags[0];
              return (
                <R as="article" key={`${r.name}-${i}`} className={`review-row tone-${primary}`} v="r-fade" delay={(i % 8) * 45}>
                  <div className="review-rating" aria-label="5 estrellas en Google">
                    <GoogleG/>
                    <span className="score">5,0</span>
                    <span className="stars-text">★★★★★</span>
                  </div>
                  <div className="review-main">
                    <div className="review-meta">
                      <span className="review-name">{r.name}</span>
                      <span>{r.service}</span>
                      <span>{r.date}</span>
                    </div>
                    <blockquote>{r.text}</blockquote>
                  </div>
                  <div className="review-side">
                    <span className={`review-chip chip-${primary}`}>{catLabel[primary] || "Google"}</span>
                    <span className="avatar">{r.a}</span>
                  </div>
                </R>
              );
            })}
          </div>
        </div>

        <div className="testimonials-stats">
          <R as="div" className="stat">
            <span className="n">5,0<span style={{ fontSize: ".5em", color: "var(--muted)" }}>★</span></span>
            <span className="l">Valoración en Google</span>
          </R>
          <R as="div" className="stat" delay={100}>
            <span className="n">+75</span>
            <span className="l">Reseñas reales en Google</span>
          </R>
          <R as="div" className="stat" delay={200}>
            <span className="n">{reviews.length}</span>
            <span className="l">Comentarios visibles clasificados</span>
          </R>
          <R as="div" className="stat" delay={300}>
            <span className="n">+7<span style={{ fontSize: ".5em", color: "var(--muted)" }}> años</span></span>
            <span className="l">De clientas fieles que repiten</span>
          </R>
        </div>

        <R as="div" className="reviews-cta" delay={120}>
          <span className="gstars">
            <span className="s">★★★★★</span> <b>5,0 en Google</b> · +75 reseñas
          </span>
          <a className="btn dark" href={BUSINESS.reviewsUrl} target="_blank" rel="noopener noreferrer">
            Leer todas las reseñas en Google <span className="arrow">→</span>
          </a>
        </R>
      </div>
    </section>
  );
}

/* ---------- Ornament (drift-on-scroll decoration) ---------- */
function Ornament({ children, style, speed = 0.1, tick = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0;
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = r.top + r.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${(-center * speed).toFixed(1)}px, 0)`;
      raf = 0;
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", on, { passive: true });
    return () => { window.removeEventListener("scroll", on); cancelAnimationFrame(raf); };
  }, [speed]);
  return <div ref={ref} className={`ornament ${tick ? "tick" : ""}`} style={style}>{children}</div>;
}

function LegalNoticeModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div className={`legal-modal ${open ? "open" : ""}`} aria-hidden={!open}>
      <div className="scrim" onClick={onClose}></div>
      <section className="legal-panel" role="dialog" aria-modal="true" aria-labelledby="legal-title">
        <button className="legal-close" onClick={onClose} aria-label="Cerrar aviso legal y privacidad"></button>
        <h2 id="legal-title">Aviso legal y privacidad</h2>
        <p className="intro">
          Información breve, transparente y pensada para entender cómo se usa esta web y qué ocurre si contactas con el estudio.
        </p>

        <div className="legal-section">
          <h3>Responsable</h3>
          <p>
            Esta web pertenece a {BUSINESS.name}, estudio de belleza situado en {BUSINESS.addressLine}, {BUSINESS.postalCity}, {BUSINESS.country}. Puedes contactar en{" "}
            <a className="linkish" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
          </p>
        </div>

        <div className="legal-section">
          <h3>Finalidad</h3>
          <p>
            Los datos que envíes por email, WhatsApp o redes sociales se usan únicamente para responder a tu consulta, gestionar una cita o darte información sobre los servicios solicitados.
          </p>
        </div>

        <div className="legal-section">
          <h3>Privacidad</h3>
          <ul>
            <li>No se venden tus datos ni se ceden a terceros con fines comerciales.</li>
            <li>Los datos se conservan el tiempo necesario para atender la consulta o la relación profesional.</li>
            <li>Puedes solicitar acceso, rectificación, supresión, oposición o limitación escribiendo al correo indicado.</li>
          </ul>
        </div>

        <div className="legal-section">
          <h3>Servicios externos</h3>
          <p>
            La web carga tipografías, mapa y enlaces externos como Instagram o WhatsApp. Al abrir esos servicios se aplican sus propias condiciones y políticas de privacidad.
          </p>
        </div>

        <div className="legal-section">
          <h3>Cookies</h3>
          <p>
            Esta web no instala cookies propias de analítica o publicidad. Los servicios externos integrados o enlazados pueden realizar conexiones técnicas necesarias para mostrarse correctamente.
          </p>
        </div>

        <p className="legal-note">
          Texto informativo de primera capa inspirado en el criterio de claridad y transparencia del RGPD y la LSSI-CE. Conviene validarlo con asesoría si se añaden formularios, pagos, analítica o campañas.
        </p>
      </section>
    </div>
  );
}

/* ---------- Footer ---------- */
function FooterSection() {
  const [legalOpen, setLegalOpen] = useState(false);
  const mapsEmbed = "https://www.openstreetmap.org/export/embed.html?bbox=-2.148%2C40.060%2C-2.122%2C40.074&layer=mapnik&marker=40.0657%2C-2.1357";
  const mapsLink  = BUSINESS.mapsShort;

  const waMsg = CITA_MSG;

  const Ig = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".9" fill="currentColor" stroke="none"/>
    </svg>
  );
  const Wa = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21l1.6-4.6A9 9 0 1 1 8 20.4L3 21z"/>
      <path d="M8.5 9c.2 1 .9 2.4 2 3.5s2.5 1.8 3.5 2c.4 0 .9-.1 1.2-.5l.6-.8a.8.8 0 0 0-.2-1.1l-1.3-.8a.8.8 0 0 0-1 .2l-.3.4c-.7-.3-1.4-.7-1.9-1.2s-.9-1.2-1.2-1.9l.4-.3a.8.8 0 0 0 .2-1l-.8-1.3a.8.8 0 0 0-1.1-.2L8 6.6c-.4.3-.5.8-.5 1.2 0 .4.4.8 1 1.2z"/>
    </svg>
  );

  const socials = [
    { ic: Wa, label: "WhatsApp",   sub: `Pedir cita ahora · ${BUSINESS.city}`,  href: wa(waMsg) },
    { ic: Ig, label: "Instagram",  sub: BUSINESS.instagramHandle,                href: BUSINESS.instagramUrl },
  ];

  return (
    <footer className="footer" id="contacto">
      <div className="container">
        <R className="chapter">
          <span className="rule"></span>
          <span className="small-caps">El refugio · Contacto</span>
        </R>

        <div className="footer-head">
          <R as="h2">
            <LineMask>El refugio.</LineMask>
          </R>
          <R className="body" delay={150} style={{ maxWidth: "44ch" }}>
            Te esperamos en un rincón diseñado en exclusiva para el bienestar de tus
            manos, tu piel y tu autoestima. Sin prisas, con toda la atención que te mereces.
          </R>
        </div>

        <div className="footer-layout">
          {/* MAP */}
          <div className="footer-map-wrap">
            <iframe
              className="footer-map"
              src={mapsEmbed}
              title={`Ubicación del estudio · ${BUSINESS.addressLine}, ${BUSINESS.city}`}
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen></iframe>
            <a className="footer-map-pin" href={mapsLink} target="_blank" rel="noopener" aria-label="Abrir en Google Maps">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/>
                <circle cx="12" cy="10" r="2.5"/>
              </svg>
              <span>Abrir en Google Maps</span>
            </a>
          </div>

          {/* INFO */}
          <div className="footer-info">
            <R as="div" className="info-row">
              <div className="label">Ubicación · {BUSINESS.addressTag}</div>
              <div className="val">{BUSINESS.addressShort}<br/>{BUSINESS.postalCity} · {BUSINESS.country}</div>
              <div className="note">{BUSINESS.landmark}</div>
            </R>

            <R as="div" className="info-row" delay={80}>
              <div className="label">Horario</div>
              <div className="val">Lunes a viernes · 9:00 – 21:00</div>
              <div className="note">Atención con cita previa para garantizar la exclusividad del espacio.</div>
            </R>

            <R as="div" className="info-row" delay={160}>
              <div className="label">Teléfono y correo</div>
              <a className="linkish" href={`tel:+${BUSINESS.phone}`}>+34 690 699 205</a>
              <div className="note" style={{ marginTop: 6 }}>
                <a className="linkish" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
              </div>
            </R>

            <R as="div" className="info-row" delay={240}>
              <div className="label">Reserva tu hora</div>
              <a className="linkish" href={wa(waMsg)} target="_blank" rel="noopener">
                Pedir cita por WhatsApp →
              </a>
            </R>
          </div>
        </div>

        {/* SOCIAL TILES — WhatsApp / Instagram */}
        <div className="social-grid">
          {socials.map((s, i) => (
            <R as="a" key={s.label} v="r-fade" delay={i * 80}
               className="social-tile"
               href={s.href} target={s.href.startsWith("http") ? "_blank" : undefined}
               rel="noopener" aria-label={s.label}>
              <span className="ic">{s.ic}</span>
              <span className="meta">
                <span className="t">{s.label}</span>
                <span className="h">{s.sub}</span>
              </span>
              <span className="arrow">→</span>
            </R>
          ))}
        </div>

        {/* Signature */}
        <div className="footer-signature">
          <img className="footer-logo-img on-dark" src={BRAND_ASSETS.logoBlack} alt={BUSINESS.name} />
          <div className="tag">Belleza de autor · {BUSINESS.city} · {BUSINESS.addressTag}</div>
        </div>

        <div className="bottom">
          <span>© {new Date().getFullYear()} {BUSINESS.name}</span>
          <span>El arte de sentirte bien · {BUSINESS.city}</span>
          <button className="legal-trigger" onClick={() => setLegalOpen(true)}>Aviso legal · Privacidad</button>
        </div>

        <div className="dev-credit">
          Desarrollado por{" "}
          <a href="https://natanaelalzatetorres.com/" target="_blank" rel="noopener" className="dev-link">
            Nathan Torres
          </a>
        </div>
      </div>
      <LegalNoticeModal open={legalOpen} onClose={() => setLegalOpen(false)} />
    </footer>);

}

/* ---------- FAQ ---------- */
function FaqSection() {
  const allFaqs = [
    {
      q: "¿En qué consiste la Experiencia Dúo / Masaje en pareja?",
      a: "Es un ritual en el que dos personas reciben un masaje relajante simultáneamente en la misma cabina, acondicionada con luz suave, aromaterapia y música envolvente. Es la opción favorita para parejas, amigas, madre e hija o padre e hijo."
    },
    {
      q: "¿Cómo se efectúa el pago de los tratamientos?",
      a: "Todos los pagos se realizan directamente en el estudio al finalizar tu cita, mediante Efectivo o Tarjeta bancaria. No requerimos ningún pago ni señal previa online."
    },
    {
      q: "¿Qué tratamientos corporales ofrecéis?",
      a: "Ofrecemos Maderoterapia corporal (moldeado y reducción de celulitis), Drenaje Linfático manual (desintoxicación y alivio de piernas cansadas), Exfoliación corporal (renovación epidérmica) y Envolturas nutritivas (hidratación profunda y firmeza)."
    },
    {
      q: "¿En qué consisten las uñas de autor y cuál es su durabilidad?",
      a: "Trabajamos una manicura de alta precisión detallando la cutícula y aplicando nivelación de matriz con Rubber Base. La durabilidad supera las 3 semanas manteniendo la uña natural fuerte y sana."
    },
    {
      q: FEATURES.showMicropigmentacion ? "¿Cuánto dura la micropigmentación de cejas, labios u ojos?" : null,
      a: "El resultado se mantiene de forma natural entre 12 y 24 meses, según tu tipo de piel, el cuidado diario y la exposición solar. Incluimos una sesión de retoque de asentamiento para consolidar un acabado impecable."
    },
    {
      q: "¿Dónde se encuentra el estudio y cómo puedo reservar cita?",
      a: `Estamos situados en ${BUSINESS.addressShort}, ${BUSINESS.postalCity} (${BUSINESS.landmark}). Atendemos de lunes a viernes de 9:00 a 21:00 exclusivamente con cita previa. La forma más rápida de reservar es enviándonos un mensaje directo por WhatsApp.`
    }
  ];

  const faqs = allFaqs.filter((f) => f.q !== null);

  return (
    <section className="sec-faq" id="faq">
      <div className="container">
        <R className="chapter">
          <span className="rule"></span>
          <span className="small-caps">Preguntas frecuentes</span>
        </R>
        <div className="faq-grid">
          <div className="faq-head">
            <h2 className="h-section">
              <LineMask>Todo lo que</LineMask>
              <LineMask delay={120}>quieres <em style={{ fontFamily: "var(--serif)" }}>saber</em>.</LineMask>
            </h2>
            <R className="body" delay={200} style={{ marginTop: 24 }}>
              Resolvemos tus dudas habituales antes de tu cita. Si tienes cualquier otra consulta, escríbenos por WhatsApp y te responderemos personalmente.
            </R>
            <R delay={300} style={{ marginTop: 28 }}>
              <a className="btn dark" href={wa("Hola Stefania, tengo una duda antes de reservar mi cita. ¿Me puedes asesorar?")} target="_blank" rel="noopener">
                Consultar por WhatsApp <span className="arrow">→</span>
              </a>
            </R>
          </div>
          <div className="faq-list">
            {faqs.map((f, i) =>
              <R as="details" className="faq-item" key={i} v="r-fade" delay={i * 70}>
                <summary>
                  <span className="faq-q">{f.q}</span>
                  <span className="faq-ic" aria-hidden="true"></span>
                </summary>
                <p className="faq-a">{f.a}</p>
              </R>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Floating WhatsApp button ---------- */
function WhatsAppFab() {
  const msg = CITA_MSG;
  return (
    <a className="wa-fab" href={wa(msg)} target="_blank" rel="noopener" aria-label="Pedir cita por WhatsApp">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 21l1.6-4.6A9 9 0 1 1 8 20.4L3 21z" />
        <path d="M8.5 9c.2 1 .9 2.4 2 3.5s2.5 1.8 3.5 2c.4 0 .9-.1 1.2-.5l.6-.8a.8.8 0 0 0-.2-1.1l-1.3-.8a.8.8 0 0 0-1 .2l-.3.4c-.7-.3-1.4-.7-1.9-1.2s-.9-1.2-1.2-1.9l.4-.3a.8.8 0 0 0 .2-1l-.8-1.3a.8.8 0 0 0-1.1-.2L8 6.6c-.4.3-.5.8-.5 1.2 0 .4.4.8 1 1.2z" />
      </svg>
      <span className="wa-fab-label">Pedir cita</span>
    </a>
  );
}

/* ---------- App ---------- */
function App() {
  useScrollProgress();
  useSitePreloader();
  return (
    <React.Fragment>
      <Nav />
      <main id="contenido">
        <Hero />
        <AboutStefaniaSection />
        <Interlude id="interlude-1"
          src={SITE_IMAGES.massagePareja}
          placeholder="Masaje en pareja · cabina con velas"
          label="Experiencia Dúo"
          quote={<>Un paréntesis a dúo. <em style={{ fontFamily: "var(--serif)" }}>Tiempo para compartir y desconectar</em>.</>} />
        <MassageSection />
        <Interlude id="interlude-2"
          src={SITE_IMAGES.nailDetail}
          placeholder="Mano de manicura · detalle macro"
          label="Uñas de Autor"
          quote={<>Esculpir la elegancia sobre la <em style={{ fontFamily: "var(--serif)" }}>salud natural de la uña</em>.</>} />
        <NailsSection />
        <Interlude id="interlude-3"
          src={SITE_IMAGES.facialCabin}
          placeholder="Cabina · velas, humo de aromaterapia"
          label="Estética Facial"
          quote={<>Silenciar el ruido. <em style={{ fontFamily: "var(--serif)" }}>Devolver el resplandor a tu piel</em>.</>} />
        <FacialSection />
        <BodySection />
        {FEATURES.showMicropigmentacion && <MicroSection />}
        <TestimonialsSection />
        <TrackSection />
        <FaqSection />
      </main>
      <FooterSection />
      <WhatsAppFab />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
