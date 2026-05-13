---
name: design-system-admin-dashboard
description: Creates implementation-ready design-system guidance with tokens, component behavior, and accessibility standards. Use when creating or updating UI rules, component specifications, or design-system documentation.
---

<!-- TYPEUI_SH_MANAGED_START -->

# Admin Dashboard

## Mission
Deliver implementation-ready design-system guidance for Admin Dashboard that can be applied consistently across dashboard web app interfaces.

## Brand
- Product/brand: Admin Dashboard
- URL: https://homeed-web.vercel.app/admin/dashboard
- Audience: authenticated users and operators
- Product surface: dashboard web app

## Style Foundations
- Visual style: structured, accessible, implementation-first
- Main font style: `font.family.primary=JetBrains Mono`, `font.family.stack=JetBrains Mono, JetBrains Mono Fallback, ui-monospace, Consolas, monospace`, `font.size.base=13px`, `font.weight.base=400`, `font.lineHeight.base=20px`
- Typography scale: `font.size.xs=10px`, `font.size.sm=11px`, `font.size.md=12px`, `font.size.lg=13px`, `font.size.xl=20px`
- Color palette: `color.text.primary=#25241d`, `color.text.secondary=#6a685c`, `color.text.tertiary=#92400e`, `color.text.inverse=#ffffff`, `color.surface.base=#000000`, `color.surface.muted=#f3f1ed`, `color.surface.raised=#faf9f5`, `color.surface.strong=#f59e0b`, `color.border.default=#e1ded6`, `color.border.muted=rgb(225, 222, 214) rgb(225, 222, 214) rgb(225, 222, 214) rgba(0, 0, 0, 0)`
- Spacing scale: `space.1=1px`, `space.2=4px`, `space.3=6px`, `space.4=8px`, `space.5=10px`, `space.6=12px`, `space.7=16px`, `space.8=24px`
- Radius/shadow/motion tokens: `radius.xs=6px`, `radius.sm=8px`, `radius.md=9999px` | `shadow.1=rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(38, 37, 30, 0.043) 0px 8px 24px 0px`, `shadow.2=rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(243, 241, 237) 0px 12px 32px 0px, rgb(243, 241, 237) 0px 0px 0px 1px`, `shadow.3=rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(245, 78, 0, 0.18) 0px 0px 0px 3px`, `shadow.4=rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px` | `motion.duration.instant=150ms`, `motion.duration.fast=200ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
concise, confident, implementation-focused

## Rules: Do
- Use semantic tokens, not raw hex values in component guidance.
- Every component must define required states: default, hover, focus-visible, active, disabled, loading, error.
- Responsive behavior and edge-case handling should be specified for every component family.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and tokens.
3. Define component anatomy, variants, and interactions.
4. Add accessibility acceptance criteria.
5. Add anti-patterns and migration notes.
6. End with QA checklist.

## Required Output Structure
- Context and goals
- Design tokens and foundations
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- QA checklist

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Prefer system consistency over local visual exceptions.

<!-- TYPEUI_SH_MANAGED_END -->
