import { useLayoutEffect, type RefObject } from "react";
import { compensateScroll, getScrollIntent, requestDetailedView, subscribeScrollIntent } from "@/lib/scrollIntent";

type Box = { el: HTMLElement; height: number; width: number; title: HTMLElement; media?: HTMLElement; actions?: HTMLElement; mediaX: number; mediaY: number; mediaW: number; mediaH: number; actionsY: number; details: HTMLElement[]; kind: string; titleSize: number; compactHeight: number; brand?: HTMLElement; logo?: HTMLElement; role?: HTMLElement; roleX: number; roleY: number; roleSize: number; summaryTitleSize: number; summaryTitleHeight: number; summaryMediaW: number; summaryMediaH: number; copy?: HTMLElement; copyW: number; copyTargetW: number; lift: number; frozen: boolean; passed: boolean; badge?: HTMLElement; ribbon?: HTMLElement; toggle?: HTMLElement };
type Anchor = { el: HTMLElement; edge: "top" | "bottom"; y: number; lastScroll: number };

/** Real mobile layouts regroup with one viewport anchor; full-detail styles restore exactly. */
export function useAdaptiveBrowsing(editorRef: RefObject<HTMLDivElement>) {
  useLayoutEffect(() => {
    const groups = [...document.querySelectorAll<HTMLElement>("[data-scan-group]")];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = matchMedia("(pointer: coarse)");
    const editors = [...(editorRef.current?.querySelectorAll<HTMLElement>("[data-scan-editor]") || [])];
    const trails = [...(editorRef.current?.querySelectorAll<SVGPathElement>("[data-scan-trail]") || [])];
    const original = new Map<HTMLElement, string | null>();
    let boxes: Box[] = [], anchor: Anchor | null = null, progress = 0, goal = 0, frame = 0, tickAt = 0;
    let pointerHeld = false, touching = false, overflowAnchor = "", cachedWidth = innerWidth;
    let activationTarget: HTMLElement | null = null, activationTimer: ReturnType<typeof setTimeout> | undefined;
    let activeGroup: HTMLElement | null = null;
    let paintedProgress = -1;
    const measureTextHeight = (el: HTMLElement, fontSize: number, width: number) => {
      const style = getComputedStyle(el), context = document.createElement("canvas").getContext("2d")!;
      context.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
      let lines = 1, line = "";
      for (const word of (el.textContent || "").split(/\s+/)) {
        const next = line ? `${line} ${word}` : word;
        if (line && context.measureText(next).width > width) { lines++; line = word; } else line = next;
      }
      return lines * fontSize * 1.2;
    };
    const decorative = () => !coarse.matches && innerWidth >= 768;
    const mobileMoving = () => { const intent = getScrollIntent(); return !decorative() && (touching || (intent.active && intent.userDriven)); };
    const remember = (el: HTMLElement) => { if (!original.has(el)) original.set(el, el.getAttribute("style")); };
    const relevant = () => groups.some(g => { const r = g.getBoundingClientRect(); return r.top < innerHeight * .9 && r.bottom > 110; });
    const currentGroup = () => groups.find(g => { const r = g.getBoundingClientRect(); return r.top <= 150 && r.bottom > 150; }) || groups.find(g => { const r = g.getBoundingClientRect(); return r.top < innerHeight * .8 && r.bottom > 110; }) || null;
    const blocked = () => pointerHeld && !touching || !!document.querySelector('[role="dialog"]') || !!document.activeElement?.closest("[data-scan-group] button:focus-visible,[data-scan-group] a:focus-visible");
    const pickAnchor = (): Anchor | null => {
      const group = currentGroup() || activeGroup;
      const rows = [...(group?.querySelectorAll<HTMLElement>("[data-project],.skill-category,[data-scan-item]") || [])].map(el => ({ el, rect: el.getBoundingClientRect() }));
      const row = rows.find(({ rect }) => rect.top <= 150 && rect.bottom > 150) || rows.find(({ rect }) => rect.top >= 80 && rect.top < innerHeight - 80);
      if (row) {
        const heading = row.el.querySelector<HTMLElement>("h3"), h = heading?.getBoundingClientRect();
        if (heading && h && h.top >= 80 && h.top < innerHeight - 80) return { el: heading, edge: "top", y: h.top, lastScroll: scrollY };
        // A real border is stable material; a percentage of a shrinking box is not.
        const edge = row.rect.bottom > 90 && row.rect.bottom < innerHeight - 64 ? "bottom" : "top";
        return { el: row.el, edge, y: row.rect[edge], lastScroll: scrollY };
      }
      const fallback = [...document.querySelectorAll<HTMLElement>("[data-scan-static],section h2")].find(el => { const r = el.getBoundingClientRect(); return r.top >= 80 && r.top < innerHeight; });
      const material = fallback || document.elementFromPoint(innerWidth * .5, 150)?.closest<HTMLElement>("p,input,textarea,button,div,section");
      return material ? { el: material, edge: "top", y: material.getBoundingClientRect().top, lastScroll: scrollY } : null;
    };
    const capture = () => {
      activeGroup = currentGroup(); paintedProgress = -1;
      const active = activeGroup ? [activeGroup.dataset.scanGroup] : [];
      window.dispatchEvent(new CustomEvent("portfolio:regroup", { detail: active }));
      overflowAnchor = document.documentElement.style.overflowAnchor;
      document.documentElement.style.overflowAnchor = "none";
      boxes = (activeGroup ? [activeGroup] : []).flatMap(group => {
        remember(group);
        return [...group.querySelectorAll<HTMLElement>("[data-project],.skill-category,[data-scan-item]")].map(el => {
          const r = el.getBoundingClientRect(), title = el.querySelector<HTMLElement>("h3")!;
          const media = el.querySelector<HTMLElement>(".project-media,.certificate-image-trigger"), actions = el.querySelector<HTMLElement>(".project-actions");
          const m = media?.getBoundingClientRect(), a = actions?.getBoundingClientRect();
          const details = [...el.querySelectorAll<HTMLElement>("[data-scan-detail]")].filter(detail => detail !== media);
          const brand = el.querySelector<HTMLElement>(".experience-brand"), logo = el.querySelector<HTMLElement>(".company-logo");
          const kind = el.dataset.scanItem || (media ? "project" : "skill");
          const titleSize = parseFloat(getComputedStyle(title).fontSize);
          const role = el.querySelector<HTMLElement>(".experience-role"), copy = el.querySelector<HTMLElement>(".credential-copy");
          const roleRect = role?.getBoundingClientRect(), copyRect = copy?.getBoundingClientRect();
          const summaryMediaW = Math.min(224, Math.max(168, r.width * .3), r.width * .48);
          const summaryMediaH = innerWidth < 768 ? 168 : 200;
          const copyTargetW = Math.max(110, r.width - 28 - summaryMediaW - 18);
          const summaryTitleSize = kind === "experience" ? titleSize + (innerWidth < 768 ? 4 : 6) : kind === "credential" ? titleSize + 2 : titleSize;
          const summaryTitleHeight = measureTextHeight(title, summaryTitleSize, kind === "credential" && media ? copyTargetW : Math.max(120, r.width - 90));
          const compactHeight = kind === "project" ? 112 : kind === "skill" ? 60 : kind === "experience" ? Math.max(132, summaryTitleHeight + 62) : Math.max(summaryTitleHeight + 28, m ? summaryMediaH + 24 : 72);
          [el, title, media, actions, brand, logo, role, copy, ...details, el.querySelector<HTMLElement>(".project-building")].forEach(node => { if (node) remember(node); });
          const headingRect = title.getBoundingClientRect();
          // Already passed rows retain their height. A tall row being viewed in its
          // middle waits for the next burst instead of collapsing out from under touch.
          const frozen = r.bottom <= 80 || (!decorative() && r.top <= 150) || (r.top < 80 && headingRect.bottom < 80 && r.bottom > innerHeight - 64);
          return { el, height: r.height, width: r.width, title, media: media || undefined, actions: actions || undefined, mediaX: m ? m.left - r.left - parseFloat(getComputedStyle(el).borderLeftWidth) : 0, mediaY: m ? m.top - r.top - parseFloat(getComputedStyle(el).borderTopWidth) : 0, mediaW: m?.width || 0, mediaH: m?.height || 0, actionsY: a ? a.top - r.top - 2 : 0, details, kind, titleSize, compactHeight, brand: brand || undefined, logo: logo || undefined, role: role || undefined, roleX: roleRect ? roleRect.left - r.left : 0, roleY: roleRect ? roleRect.top - r.top : 0, roleSize: role ? parseFloat(getComputedStyle(role).fontSize) : 16, summaryTitleSize, summaryTitleHeight, summaryMediaW, summaryMediaH, copy: copy || undefined, copyW: copyRect?.width || 0, copyTargetW, lift: brand ? brand.getBoundingClientRect().top - r.top - parseFloat(getComputedStyle(el).paddingTop) : 0, frozen, passed: r.bottom <= 80, badge: el.querySelector<HTMLElement>(".project-building") || undefined, ribbon: el.querySelector<HTMLElement>(".achievement-ribbon") || undefined, toggle: el.querySelector<HTMLElement>("[data-scan-toggle]") || undefined };
        });
      });
    };
    const restore = () => {
      for (const [el, style] of original) {
        const clip = el.style.getPropertyValue("--construction-clip"), opacity = el.style.getPropertyValue("--construction-opacity");
        if (style === null) el.removeAttribute("style"); else el.setAttribute("style", style);
        el.style.removeProperty("--construction-clip"); el.style.removeProperty("--construction-opacity");
        if (el.dataset.building) { if (clip) el.style.setProperty("--construction-clip", clip); if (opacity) el.style.setProperty("--construction-opacity", opacity); }
      }
      original.clear();
      boxes.forEach(b => b.details.forEach(d => { d.inert = false; d.removeAttribute("aria-hidden"); }));
      groups.forEach(g => { delete g.dataset.scanActive; g.querySelectorAll("[data-scan-toggle]").forEach(b => b.setAttribute("aria-expanded", "true")); });
      document.documentElement.style.overflowAnchor = overflowAnchor;
      delete document.documentElement.dataset.browsing;
      boxes = [];
      activeGroup = null; paintedProgress = -1;
    };
    const compensate = () => {
      if (!anchor?.el.isConnected) return;
      // Programmatic scrollTo aborts native touch inertia in Chromium. Mobile
      // changes only upcoming rows while moving; corrections wait until idle.
      if (mobileMoving()) return;
      const r = anchor.el.getBoundingClientRect(), correction = r[anchor.edge] - anchor.y;
      if (Math.abs(correction) > .1) {
        const target = scrollY + correction;
        compensateScroll(target);
        // Preserve subpixel residuals instead of accumulating rounded scrollY
        // error on every frame. Only a real page-boundary clamp resets the pin.
        if (Math.abs(scrollY - target) > 1) anchor.y = anchor.el.getBoundingClientRect()[anchor.edge];
      }
      anchor.lastScroll = scrollY;
    };
    const paint = () => {
      const changed = paintedProgress !== progress;
      if (changed && anchor) { anchor.y -= scrollY - anchor.lastScroll; anchor.lastScroll = scrollY; }
      if (changed) {
      for (const group of activeGroup ? [activeGroup] : []) {
        group.dataset.scanActive = "true"; group.style.setProperty("--scan", String(progress));
        // Keep existing gaps: shrinking gaps above the current row steals scroll
        // distance before the user has actually moved through those rows.
      }
      for (const b of boxes) {
        b.toggle?.setAttribute("aria-expanded", String(b.frozen || progress < .6));
        if (b.frozen && (b.passed || !["experience", "credential"].includes(b.kind))) continue;
        const project = b.kind === "project";
        // Visible mobile rows retain their footprint during native momentum,
        // while their logo/photo summary can still grow inside that reservation.
        b.el.style.height = `${b.frozen ? b.height : b.height + (b.compactHeight - b.height) * progress}px`;
        b.el.style.overflow = "hidden";
        if (project) {
          b.title.style.fontSize = `${20 - 5 * progress}px`; b.title.style.lineHeight = `${28 - 8 * progress}px`;
          b.title.style.maxWidth = `${b.width - 44 - 105 * progress}px`;
          b.title.style.transform = `translate(${-6 * progress}px,${-4 * progress}px)`;
          const media = b.media!, scale = 96 / b.mediaW;
          media.style.position = "absolute"; media.style.left = `${b.mediaX}px`; media.style.top = `${b.mediaY}px`;
          media.style.width = `${b.mediaW}px`; media.style.height = `${b.mediaH}px`; media.style.marginTop = "0";
          media.style.transformOrigin = "0 0";
          media.style.transform = `translate(${(b.width - 114 - b.mediaX) * progress}px,${(26 - b.mediaY) * progress}px) scale(${1 + (scale - 1) * progress})`;
          if (b.actions) { b.actions.style.position = "absolute"; b.actions.style.top = `${b.actionsY}px`; b.actions.style.left = "20px"; b.actions.style.width = `${b.width - 44}px`; b.actions.style.marginTop = "0"; }
          if (b.badge) b.badge.style.top = `${-10 + 96 * progress}px`;
        } else if (b.kind === "skill") { b.title.style.transform = `translateX(${16 * progress}px)`; b.title.style.width = `calc(100% - ${16 * progress}px)`; }
        else {
          b.title.style.fontSize = `${b.titleSize + (b.summaryTitleSize - b.titleSize) * progress}px`;
          b.title.style.lineHeight = "1.2";
          if (b.brand) { b.brand.style.transform = `translateY(${-b.lift * progress}px)`; b.brand.style.gap = `${12 + 4 * progress}px`; }
          if (b.logo) { b.logo.style.width = b.logo.style.height = b.logo.style.flexBasis = `${40 + 28 * progress}px`; }
          if (b.role) {
            b.role.style.position = "absolute";
            b.role.style.left = `${b.roleX + (84 - b.roleX) * progress}px`;
            b.role.style.top = `${b.roleY + (b.summaryTitleHeight + 10 + parseFloat(getComputedStyle(b.el).paddingTop) - b.roleY) * progress}px`;
            b.role.style.width = `${b.width - 90}px`;
            b.role.style.fontSize = `${b.roleSize + (19 - b.roleSize) * progress}px`;
            b.role.style.lineHeight = "1.25";
          }
          if (b.kind === "credential") {
            b.el.style.position = "relative";
            if (b.copy && b.media) b.copy.style.width = `${b.copyW + (b.copyTargetW - b.copyW) * progress}px`;
            if (b.media) {
              b.media.style.position = "absolute"; b.media.style.marginTop = "0"; b.media.style.maxWidth = "none";
              b.media.style.left = `${b.mediaX + (b.width - b.summaryMediaW - 6 - b.mediaX) * progress}px`;
              b.media.style.top = `${b.mediaY + (12 - b.mediaY) * progress}px`;
              b.media.style.width = `${b.mediaW + (b.summaryMediaW - b.mediaW) * progress}px`;
              b.media.style.height = `${b.mediaH + (b.summaryMediaH - b.mediaH) * progress}px`;
            }
            if (b.ribbon) b.title.style.transform = `translateY(${-27 * progress}px)`;
          }
        }
        for (const detail of b.details) {
          detail.style.opacity = String(Math.max(0, 1 - progress * 2));
          detail.inert = progress > .6;
          if (progress > .6) detail.setAttribute("aria-hidden", "true"); else detail.removeAttribute("aria-hidden");
        }
      }
      compensate();
      paintedProgress = progress;
      }
      // Fast summaries have no pretend workers. The real scene director resumes
      // typing and asset placement after natural detail restoration.
      [...editors, ...trails].forEach(el => { el.style.opacity = "0"; });
    };
    const hideEditors = () => [...editors, ...trails].forEach(e => { e.style.opacity = "0"; });
    const animate = (now: number) => {
      frame = 0; const dt = Math.min(40, now - tickAt); tickAt = now;
      if (!goal && mobileMoving()) return;
      const step = dt / (goal ? 200 : 300); progress = goal > progress ? Math.min(goal, progress + step) : Math.max(goal, progress - step);
      paint();
      if (progress !== goal) frame = requestAnimationFrame(animate);
      else {
        hideEditors();
        if (!goal) { restore(); compensate(); }
        window.dispatchEvent(new Event("portfolio:layout-settled"));
      }
    };
    const transition = (next: number, instant = false) => {
      if (next === goal && !instant) {
        if (progress !== goal && !frame && !mobileMoving()) { anchor = pickAnchor(); tickAt = performance.now(); frame = requestAnimationFrame(animate); }
        return;
      }
      if (!boxes.length && next) capture();
      if (!boxes.length) return;
      anchor = pickAnchor(); goal = next;
      window.dispatchEvent(new Event("portfolio:layout-start"));
      document.documentElement.dataset.browsing = next ? "scan" : "detail";
      cancelAnimationFrame(frame); frame = 0;
      if (instant || reduced.matches || (!decorative() && next === 1)) { progress = next; paint(); hideEditors(); if (!next) { restore(); compensate(); } window.dispatchEvent(new Event("portfolio:layout-settled")); return; }
      tickAt = performance.now(); frame = requestAnimationFrame(animate);
    };
    const onIntent = () => {
      if (activationTarget) return; // Keep a touched thumbnail still through synthetic click dispatch.
      const intent = getScrollIntent();
      if (mobileMoving() && boxes.length && (goal === 0 || currentGroup() !== activeGroup || !intent.scan)) return;
      if (intent.scan && boxes.length && currentGroup() && currentGroup() !== activeGroup) transition(0, true);
      transition(!reduced.matches && intent.scan && relevant() && !blocked() ? 1 : 0);
    };
    const onFocus = (event?: FocusEvent) => {
      if (activationTarget && (event?.target as HTMLElement | undefined)?.closest("[data-scan-group]")) return;
      requestDetailedView(); transition(0, true);
    };
    const releaseActivation = () => { activationTarget = null; pointerHeld = false; requestDetailedView(); transition(0, true); };
    const resume = () => { if (boxes.length && progress !== goal && !frame && !mobileMoving()) { anchor = pickAnchor(); tickAt = performance.now(); frame = requestAnimationFrame(animate); } };
    const onPointerDown = (event: PointerEvent) => {
      pointerHeld = true;
      if (event.pointerType === "touch") { touching = true; if (!goal) { cancelAnimationFrame(frame); frame = 0; } }
      activationTarget = (event.target as HTMLElement).closest<HTMLElement>("[data-scan-group] button,[data-scan-group] a");
      if (activationTarget) { clearTimeout(activationTimer); cancelAnimationFrame(frame); frame = 0; }
    };
    const onPointerUp = () => {
      pointerHeld = false; touching = false;
      // Touch emits focus/click AFTER pointerup. Do not move the activation target yet.
      if (activationTarget) { clearTimeout(activationTimer); activationTimer = setTimeout(releaseActivation, 400); }
      else { if (document.querySelector('[role="dialog"]')) transition(0, true); resume(); }
    };
    const onPointerCancel = () => { clearTimeout(activationTimer); activationTarget = null; pointerHeld = false; onIntent(); resume(); };
    const onTouchEnd = () => { touching = false; onIntent(); resume(); };
    const onClick = (event: MouseEvent) => {
      const el = event.target as HTMLElement;
      if (el.closest("[data-scan-toggle]")) { requestDetailedView(); transition(0, true); }
      if (el.closest('a[href^="#"]')) { requestDetailedView(); transition(0, true); }
      if (activationTarget) { clearTimeout(activationTimer); activationTimer = setTimeout(releaseActivation, 0); }
    };
    const onResize = () => { if (innerWidth !== cachedWidth) { cachedWidth = innerWidth; transition(0, true); } };
    const onJump = () => { requestDetailedView(); transition(0, true); };
    const onVisibility = () => { if (document.hidden) onJump(); };
    const onAttentionFocus = () => { requestDetailedView(); transition(0, true); };
    const unsubscribe = subscribeScrollIntent(onIntent);
    document.addEventListener("focusin", onFocus); document.addEventListener("click", onClick, true);
    document.addEventListener("pointerdown", onPointerDown, { passive: true }); document.addEventListener("pointerup", onPointerUp, { passive: true }); document.addEventListener("pointercancel", onPointerCancel, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true }); document.addEventListener("touchcancel", onTouchEnd, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize); window.addEventListener("hashchange", onJump); window.addEventListener("popstate", onJump);
    window.addEventListener("portfolio:attention-focus", onAttentionFocus); reduced.addEventListener("change", onJump);
    window.addEventListener("portfolio:attention-release", onJump);
    return () => {
      unsubscribe(); cancelAnimationFrame(frame); clearTimeout(activationTimer); if (boxes.length) restore(); hideEditors();
      document.removeEventListener("focusin", onFocus); document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("pointerup", onPointerUp); document.removeEventListener("pointercancel", onPointerCancel);
      document.removeEventListener("touchend", onTouchEnd); document.removeEventListener("touchcancel", onTouchEnd);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize); window.removeEventListener("hashchange", onJump); window.removeEventListener("popstate", onJump);
      window.removeEventListener("portfolio:attention-focus", onAttentionFocus); reduced.removeEventListener("change", onJump);
      window.removeEventListener("portfolio:attention-release", onJump);
    };
  }, [editorRef]);
}
