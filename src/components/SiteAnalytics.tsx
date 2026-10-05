"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { analyticsEnabled, analyticsSession, flushAnalytics, track } from "@/lib/analytics-client";
import type { EventName } from "@/lib/analytics-shared";

export function SiteAnalytics() {
  const path = usePathname();
  useEffect(() => {
    if (!analyticsEnabled()) return;
    let lastActivity = Date.now(), tickAt = Date.now(), activeMs = 0, currentSection = "", depth = 0;
    const seen = new Set<string>(), milestones = new Set<number>();
    let started = new WeakSet<HTMLFormElement>(), activeSession = analyticsSession()?.id;
    const times = new Map<string, number>();
    const emit = (name: EventName, opts: { section?: string; target?: string; value?: number } = {}) => track(name, { path, ...opts });
    const sections = () => Array.from(document.querySelectorAll<HTMLElement>("section, [data-analytics-section]"));
    const sectionId = (el: HTMLElement) => el.dataset.analyticsSection || el.id || `section-${sections().indexOf(el) + 1}`;
    const parentSection = (el: Element) => { const parent = el.closest<HTMLElement>("[data-analytics-section], section"); return parent ? sectionId(parent) : "navigation"; };
    const targetId = (el: HTMLElement) => el.dataset.analyticsId || `${el.tagName.toLowerCase()}-${Array.from(document.querySelectorAll(el.tagName)).indexOf(el) + 1}`;
    const activity = () => { lastActivity = Date.now(); };
    const measure = () => {
      const now = Date.now();
      const delta = document.visibilityState === "visible" ? Math.max(0, Math.min(now, lastActivity + 60000) - tickAt) : 0;
      tickAt = now;
      if (!delta) return;
      const sessionId = analyticsSession()?.id;
      if (sessionId && sessionId !== activeSession) {
        activeSession = sessionId; seen.clear(); milestones.clear(); started = new WeakSet<HTMLFormElement>(); depth = 0;
        emit("page_view");
      }
      activeMs += Math.min(delta, 2000);
      let best = 0;
      for (const el of sections()) {
        const rect = el.getBoundingClientRect();
        const visible = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
        const id = sectionId(el);
        if (rect.height > 0 && visible >= Math.min(rect.height * .5, innerHeight * .35)) {
          times.set(id, (times.get(id) || 0) + Math.min(delta, 2000));
          if (!seen.has(id)) { seen.add(id); emit("section_view", { section: id }); }
          if (visible > best) { best = visible; currentSection = id; }
        }
      }
      const scrollable = document.documentElement.scrollHeight - innerHeight;
      depth = Math.max(depth, scrollable > 0 ? Math.min(100, Math.round(scrollY / scrollable * 100)) : 100);
      for (const value of [25, 50, 75, 90, 100]) if (depth >= value && !milestones.has(value)) { milestones.add(value); emit("scroll_depth", { value }); }
    };
    const checkpoint = () => {
      if (activeMs) { emit("heartbeat", { value: activeMs, section: currentSection }); activeMs = 0; }
      times.forEach((value, section) => { if (value) emit("section_time", { section, value }); });
      times.clear();
    };
    const click = (event: MouseEvent) => {
      activity();
      const el = event.target instanceof Element ? event.target.closest<HTMLElement>("a,button,[role=button]") : null;
      if (!el) return;
      emit("click", { section: parentSection(el), target: targetId(el) });
    };
    const field = (event: Event) => {
      const el = event.target;
      if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) || el.type === "hidden" || ("readOnly" in el && el.readOnly) || el.type === "checkbox") return;
      measure();
      const form = el.form;
      const section = el.closest<HTMLElement>("[data-analytics-section], section");
      // A direct jump/focus can happen before the one-second visibility sample.
      if (section && !seen.has(sectionId(section))) { seen.add(sectionId(section)); emit("section_view", { section: sectionId(section) }); }
      if (form && !started.has(form)) { started.add(form); emit("form_start", { target: targetId(form), section: parentSection(el) }); }
      const names = ["name", "email", "birthDate", "crushName", "crushBirthDate"];
      const target = names.includes(el.name) ? el.name : targetId(el);
      if (event.type === "focusin") emit("field_focus", { target, section: parentSection(el) });
      else if (event.type === "invalid") emit("field_invalid", { target, section: parentSection(el) });
      else if (el.value.trim()) emit("field_complete", { target, value: el.validity.valid ? 1 : 0, section: parentSection(el) });
    };
    const toggle = (event: Event) => { const el = event.target; if (el instanceof HTMLDetailsElement) emit(el.open ? "faq_open" : "faq_close", { section: parentSection(el), target: targetId(el) }); };
    const submit = (event: Event) => { const el = event.target; if (el instanceof HTMLFormElement) emit("form_submit", { target: targetId(el), section: parentSection(el) }); };
    const error = () => emit("client_error", { target: "unhandled" });
    const leave = () => { measure(); checkpoint(); emit("page_exit", { section: currentSection, value: depth }); void flushAnalytics(true); };
    const visibility = () => { if (document.hidden) leave(); else { tickAt = Date.now(); activity(); } };
    emit("page_view");
    const timer = setInterval(measure, 1000);
    const sender = setInterval(() => { checkpoint(); void flushAnalytics(); }, 10000);
    document.addEventListener("click", click, true);
    document.addEventListener("focusin", field, true);
    document.addEventListener("focusout", field, true);
    document.addEventListener("invalid", field, true);
    document.addEventListener("toggle", toggle, true);
    document.addEventListener("submit", submit, true);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", leave);
    window.addEventListener("error", error);
    window.addEventListener("unhandledrejection", error);
    const activityEvents = ["pointerdown", "keydown", "scroll", "touchstart"];
    activityEvents.forEach(name => window.addEventListener(name, activity, { passive: true }));
    let observer: PerformanceObserver | undefined;
    try {
      observer = new PerformanceObserver(list => { const last = list.getEntries().at(-1); if (last) emit("web_vital", { target: "lcp_ms", value: last.startTime }); });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    } catch { /* Browser does not expose LCP. */ }
    return () => {
      leave(); clearInterval(timer); clearInterval(sender); observer?.disconnect();
      document.removeEventListener("click", click, true); document.removeEventListener("focusin", field, true); document.removeEventListener("focusout", field, true); document.removeEventListener("invalid", field, true); document.removeEventListener("toggle", toggle, true); document.removeEventListener("submit", submit, true); document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", leave); window.removeEventListener("error", error); window.removeEventListener("unhandledrejection", error);
      activityEvents.forEach(name => window.removeEventListener(name, activity));
    };
  }, [path]);
  return null;
}
