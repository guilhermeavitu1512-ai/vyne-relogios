"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { gsap } from "gsap";
import Link from "next/link";

import "./StaggeredMenu.css";

export type StaggeredMenuItem = {
  label: string;
  ariaLabel: string;
  link: string;
};

export type StaggeredMenuSocialItem = {
  label: string;
  link: string;
};

type StaggeredMenuProps = {
  position?: "left" | "right";
  colors?: string[];
  items: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  isFixed?: boolean;
  scrolled?: boolean;
  headerLinks?: Array<{ label: string; link: string }>;
};

export default function StaggeredMenu({
  position = "right",
  colors = ["#0b2117", "#173629", "#294738"],
  items,
  socialItems = [],
  displaySocials = false,
  displayItemNumbering = true,
  menuButtonColor = "#f1efe8",
  openMenuButtonColor = "#f1efe8",
  accentColor = "#4b9c70",
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose,
  isFixed = true,
  scrolled = false,
  headerLinks = [],
}: StaggeredMenuProps) {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const panelRef = useRef<HTMLElement>(null);
  const layersRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const reducedMotion = useCallback(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const layers = layersRef.current
      ? Array.from(layersRef.current.querySelectorAll<HTMLElement>(".sm-prelayer"))
      : [];
    if (!panel) return;

    const offscreen = position === "left" ? -100 : 100;
    const context = gsap.context(() => {
      gsap.set([panel, ...layers], {
        xPercent: offscreen,
        opacity: 1,
      });
      gsap.set(iconRef.current, {
        rotate: 0,
        transformOrigin: "50% 50%",
      });
      gsap.set(textRef.current, { yPercent: 0 });
    });

    return () => context.revert();
  }, [position]);

  const closeMenu = useCallback(
    (returnFocus = true) => {
      if (!openRef.current) return;
      openRef.current = false;
      timelineRef.current?.kill();

      const panel = panelRef.current;
      const layers = layersRef.current
        ? Array.from(layersRef.current.querySelectorAll<HTMLElement>(".sm-prelayer"))
        : [];
      const offscreen = position === "left" ? -100 : 100;
      const duration = reducedMotion() ? 0 : 0.28;

      gsap.to(iconRef.current, {
        rotate: 0,
        duration,
        ease: "power3.inOut",
      });
      gsap.to(textRef.current, {
        yPercent: 0,
        duration,
        ease: "power3.inOut",
      });

      timelineRef.current = gsap
        .timeline({
          onComplete: () => {
            setOpen(false);
            document.body.classList.remove("staggered-menu-open");
            onMenuClose?.();
            if (returnFocus) toggleRef.current?.focus();
          },
        })
        .to(
          [panel, ...layers],
          {
            xPercent: offscreen,
            duration,
            ease: "power3.in",
            stagger: reducedMotion() ? 0 : 0.025,
          },
          0,
        );
    },
    [onMenuClose, position, reducedMotion],
  );

  const openMenu = useCallback(() => {
    if (openRef.current) return;
    openRef.current = true;
    setOpen(true);
    document.body.classList.add("staggered-menu-open");
    onMenuOpen?.();
    timelineRef.current?.kill();

    const panel = panelRef.current;
    const layers = layersRef.current
      ? Array.from(layersRef.current.querySelectorAll<HTMLElement>(".sm-prelayer"))
      : [];
    if (!panel) return;

    const itemLabels = Array.from(
      panel.querySelectorAll<HTMLElement>(".sm-panel-item-label"),
    );
    const numberedItems = Array.from(
      panel.querySelectorAll<HTMLElement>(".sm-panel-list[data-numbering] .sm-panel-item"),
    );
    const socialTitle = panel.querySelector<HTMLElement>(".sm-socials-title");
    const socialLinks = Array.from(
      panel.querySelectorAll<HTMLElement>(".sm-socials-link"),
    );
    const offscreen = position === "left" ? -100 : 100;
    const noMotion = reducedMotion();

    gsap.set([panel, ...layers], { xPercent: offscreen });
    gsap.set(itemLabels, { yPercent: noMotion ? 0 : 135, rotate: noMotion ? 0 : 8 });
    gsap.set(numberedItems, { "--sm-num-opacity": 0 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) {
      gsap.set(socialLinks, { y: noMotion ? 0 : 22, opacity: 0 });
    }

    const timeline = gsap.timeline({
      onComplete: () => {
        panel.querySelector<HTMLAnchorElement>(".sm-panel-item")?.focus();
      },
    });

    layers.forEach((layer, index) => {
      timeline.to(
        layer,
        {
          xPercent: 0,
          duration: noMotion ? 0 : 0.42,
          ease: "power4.out",
        },
        noMotion ? 0 : index * 0.07,
      );
    });

    const panelStart = noMotion ? 0 : Math.max(layers.length - 1, 0) * 0.07 + 0.08;
    timeline.to(
      panel,
      {
        xPercent: 0,
        duration: noMotion ? 0 : 0.5,
        ease: "power4.out",
      },
      panelStart,
    );
    timeline.to(
      itemLabels,
      {
        yPercent: 0,
        rotate: 0,
        duration: noMotion ? 0 : 0.58,
        ease: "power4.out",
        stagger: noMotion ? 0 : 0.085,
      },
      panelStart + (noMotion ? 0 : 0.11),
    );
    timeline.to(
      numberedItems,
      {
        "--sm-num-opacity": 1,
        duration: noMotion ? 0 : 0.42,
        stagger: noMotion ? 0 : 0.07,
      },
      panelStart + (noMotion ? 0 : 0.2),
    );

    if (socialTitle || socialLinks.length) {
      timeline.to(
        socialTitle,
        { opacity: 1, duration: noMotion ? 0 : 0.4 },
        panelStart + (noMotion ? 0 : 0.35),
      );
      timeline.to(
        socialLinks,
        {
          y: 0,
          opacity: 1,
          duration: noMotion ? 0 : 0.5,
          stagger: noMotion ? 0 : 0.07,
        },
        panelStart + (noMotion ? 0 : 0.38),
      );
    }

    timelineRef.current = timeline;
    gsap.to(iconRef.current, {
      rotate: 225,
      duration: noMotion ? 0 : 0.5,
      ease: "power4.out",
    });
    gsap.to(textRef.current, {
      yPercent: -50,
      duration: noMotion ? 0 : 0.46,
      ease: "power4.out",
    });
  }, [onMenuOpen, position, reducedMotion]);

  const toggleMenu = useCallback(() => {
    if (openRef.current) closeMenu();
    else openMenu();
  }, [closeMenu, openMenu]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = [
        toggleRef.current,
        ...Array.from(panel.querySelectorAll<HTMLElement>("a[href], button")),
      ].filter((element): element is HTMLElement => Boolean(element));
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeMenu, open]);

  useEffect(
    () => () => {
      timelineRef.current?.kill();
      document.body.classList.remove("staggered-menu-open");
    },
    [],
  );

  return (
    <div
      className={`staggered-menu-wrapper ${isFixed ? "fixed-wrapper" : ""} ${
        scrolled ? "is-scrolled" : ""
      }`}
      style={{ "--sm-accent": accentColor } as CSSProperties}
      data-position={position}
      data-open={open ? "true" : "false"}
    >
      {closeOnClickAway ? (
        <button
          className="sm-backdrop"
          type="button"
          tabIndex={open ? 0 : -1}
          aria-label="Fechar menu"
          onClick={() => closeMenu()}
        />
      ) : (
        <span className="sm-backdrop" aria-hidden="true" />
      )}

      <div ref={layersRef} className="sm-prelayers" aria-hidden="true">
        {colors.slice(0, 4).map((color) => (
          <div
            className="sm-prelayer"
            style={{ backgroundColor: color }}
            key={color}
          />
        ))}
      </div>

      <header className="staggered-menu-header">
        <Link className="sm-logo" href="/#inicio" aria-label="VYNE — início">
          VYNE
        </Link>

        {headerLinks.length > 0 && (
          <nav className="sm-header-nav" aria-label="Atalhos principais">
            {headerLinks.map((item) => (
              <Link href={item.link} key={`${item.label}-${item.link}`}>
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <button
          ref={toggleRef}
          className="sm-toggle"
          style={{ color: open ? openMenuButtonColor : menuButtonColor }}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="staggered-menu-panel"
          onClick={toggleMenu}
          type="button"
        >
          <span className="sm-toggle-text-wrap" aria-hidden="true">
            <span ref={textRef} className="sm-toggle-text-inner">
              <span>Menu</span>
              <span>Fechar</span>
            </span>
          </span>
          <span ref={iconRef} className="sm-icon" aria-hidden="true">
            <span className="sm-icon-line" />
            <span className="sm-icon-line sm-icon-line-v" />
          </span>
        </button>
      </header>

      <aside
        id="staggered-menu-panel"
        ref={panelRef}
        className="staggered-menu-panel"
        aria-hidden={!open}
        aria-label="Navegação principal"
        inert={!open}
      >
        <div className="sm-panel-inner">
          <span className="sm-panel-kicker">Navegue pela VYNE</span>

          <ul
            className="sm-panel-list"
            role="list"
            data-numbering={displayItemNumbering || undefined}
          >
            {items.map((item, index) => (
              <li className="sm-panel-item-wrap" key={`${item.label}-${index}`}>
                <Link
                  className="sm-panel-item"
                  href={item.link}
                  aria-label={item.ariaLabel}
                  onClick={() => closeMenu(false)}
                >
                  <span className="sm-panel-item-label">{item.label}</span>
                  <i aria-hidden="true">↗</i>
                </Link>
              </li>
            ))}
          </ul>

          {displaySocials && socialItems.length > 0 && (
            <div className="sm-socials">
              <h3 className="sm-socials-title">Conecte-se</h3>
              <ul className="sm-socials-list" role="list">
                {socialItems.map((social) => (
                  <li key={social.label}>
                    <a
                      className="sm-socials-link"
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="sm-panel-foot">
            <span>Relógios originais</span>
            <span>Preço inteligente</span>
            <span>Curadoria independente</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
