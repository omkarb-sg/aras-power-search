import {
	useRef,
	useLayoutEffect,
	type RefCallback,
	type CSSProperties,
} from "react";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface FlipAnimationConfig {
	/** Animation duration in milliseconds. Default: 300 */
	duration?: number;
	/**
	 * Any valid CSS easing string.
	 * Examples: 'linear', 'ease', 'ease-out', 'cubic-bezier(0.25, 0.1, 0.25, 1)'
	 * Default: 'ease'
	 */
	easing?: string;
	/**
	 * CSS properties applied while an item is animating to its new position.
	 * These are transitioned back to their default values as the animation completes.
	 * Example: { opacity: '0.6' }
	 *
	 * NOTE: Do not include 'transform' — it is reserved by the hook for FLIP.
	 */
	movingStyles?: CSSProperties;
}

export interface UseFlipAnimationResult {
	/**
	 * Returns a RefCallback for the given key. Attach it to the DOM element you
	 * want to animate. The type parameter `E` lets TypeScript match the ref type
	 * to the specific element (e.g. HTMLDivElement) without unsafe casts.
	 *
	 * Example:
	 *   <div ref={getRef<HTMLDivElement>(item.id)}>...</div>
	 *   // Or let TypeScript infer from context:
	 *   <div ref={getRef(item.id)}>...</div>
	 *
	 * The same key must be used consistently across renders for the same logical item.
	 */
	getRef: <E extends HTMLElement = HTMLElement>(key: string) => RefCallback<E>;
}

// ---------------------------------------------------------------------------
// Internal utilities
// ---------------------------------------------------------------------------

/** Converts a React camelCase CSS property name to CSS kebab-case. */
function camelToKebab(prop: string): string {
	if (prop.startsWith("--")) return prop;
	return prop.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
}

/**
 * Builds a CSS transition string covering `transform` plus every property
 * present in movingStyles.
 * Example: "transform 300ms ease, opacity 300ms ease"
 */
function buildTransitionString(
	duration: number,
	easing: string,
	movingStyles?: CSSProperties
): string {
	const parts: string[] = [`transform ${duration}ms ${easing}`];
	if (movingStyles) {
		for (const prop of Object.keys(movingStyles)) {
			if (prop === "transform") continue;
			parts.push(`${camelToKebab(prop)} ${duration}ms ${easing}`);
		}
	}
	return parts.join(", ");
}

/** Applies translate(dx, dy) + movingStyles as inline styles (no transition). */
function applyInvertStyles(
	el: HTMLElement,
	dx: number,
	dy: number,
	movingStyles?: CSSProperties
): void {
	el.style.transform = `translate(${dx}px, ${dy}px)`;
	if (movingStyles) {
		for (const [prop, value] of Object.entries(movingStyles)) {
			(el.style as unknown as Record<string, string>)[prop] = String(value ?? "");
		}
	}
}

/** Clears movingStyles back to '' so stylesheet values take over. */
function applyMovingStylesClear(el: HTMLElement, movingStyles?: CSSProperties): void {
	if (!movingStyles) return;
	for (const prop of Object.keys(movingStyles)) {
		(el.style as unknown as Record<string, string>)[prop] = "";
	}
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Generic FLIP animation hook. When items change positions between renders,
 * matching elements animate from their old positions to their new ones.
 *
 * @param items   - The current array of items to render.
 * @param getKey  - Extracts a stable, unique string key from each item.
 *                  Must be consistent across renders for the same logical item.
 * @param config  - Animation options (duration, easing, movingStyles).
 *
 * @returns `getRef` — call once per key and attach the result as the `ref`
 *          prop on the element you want to animate.
 *
 * Example usage:
 *   const { getRef } = useFlipAnimation(items, (item) => item.id, {
 *     duration: 300,
 *     easing: 'ease',
 *     movingStyles: { opacity: '0.6' },
 *   });
 *   // In JSX:
 *   <div ref={getRef(item.id)}>...</div>
 */
export function useFlipAnimation<T>(
	items: T[],
	getKey: (item: T) => string,
	config: FlipAnimationConfig = {}
): UseFlipAnimationResult {
	const { duration = 300, easing = "ease", movingStyles } = config;

	// Positions captured at the end of the previous layout effect run.
	const prevRectsRef = useRef<Map<string, DOMRect>>(new Map());
	// Live map of key → DOM element, updated via RefCallbacks.
	const elemsRef = useRef<Map<string, HTMLElement>>(new Map());
	// In-flight animation handles keyed by item key.
	const animationsRef = useRef<Map<string, { cancel: () => void }>>(new Map());
	// Memoized RefCallbacks per key — same function reference returned for the
	// same key so React does not re-invoke the callback on every render.
	// If callbacks were recreated each render, React would call the old one
	// with null (wiping prevRectsRef) then the new one with the element,
	// destroying the position data needed for FLIP.
	const refCallbacksRef = useRef<Map<string, RefCallback<HTMLElement>>>(new Map());

	// Computed once per render from config primitives.
	const transitionString = buildTransitionString(duration, easing, movingStyles);

	// Run synchronously after every DOM commit so we always have fresh positions.
	// No dependency array is intentional: useLayoutEffect with deps would miss
	// layout changes unrelated to items and could skip position captures.
	useLayoutEffect(() => {
		const currentKeys = new Set(items.map(getKey));

		// ── 1. Remember which items were mid-animation. ─────────────────────────
		// We use this later to decide whether to start from the visual (interrupted)
		// position or from the saved previous-render position.
		const wasAnimating = new Set(animationsRef.current.keys());

		// ── 2. Snapshot VISUAL positions BEFORE cancelling. ────────────────────
		// If an animation is in flight, getBoundingClientRect() returns the
		// current on-screen position (transform included). Capturing this lets
		// interrupted animations continue smoothly from where the user last saw
		// the element rather than jumping back to the previous render's position.
		const visualRects = new Map<string, DOMRect>();
		for (const [key, el] of elemsRef.current) {
			if (currentKeys.has(key)) {
				visualRects.set(key, el.getBoundingClientRect());
			}
		}

		// ── 3. Cancel all in-flight animations (clears active transforms). ──────
		// This must happen BEFORE we snapshot layout positions below, otherwise
		// getBoundingClientRect() would still include the mid-animation transform
		// and we would compute incorrect FLIP deltas and corrupt prevRectsRef.
		for (const [key, handle] of animationsRef.current) {
			handle.cancel();
		}
		animationsRef.current.clear();

		// ── 4. Snapshot TRUE layout positions (no transforms active). ───────────
		const newRects = new Map<string, DOMRect>();
		for (const [key, el] of elemsRef.current) {
			if (currentKeys.has(key)) {
				newRects.set(key, el.getBoundingClientRect());
			}
		}

		// ── 5. INVERT + PLAY: animate items that moved. ─────────────────────────
		for (const [key, newRect] of newRects) {
			// For an interrupted animation start from the visual position the user
			// last saw, giving a seamless continuation. For a fresh move start from
			// the position saved at the end of the previous render.
			const fromRect = wasAnimating.has(key)
				? visualRects.get(key)
				: prevRectsRef.current.get(key);
			if (!fromRect) continue; // new item — no position to animate from

			const dx = fromRect.left - newRect.left;
			const dy = fromRect.top - newRect.top;
			if (dx === 0 && dy === 0) continue;

			const el = elemsRef.current.get(key)!;

			// Snap element to the starting position (no transition yet).
			el.style.transition = "none";
			applyInvertStyles(el, dx, dy, movingStyles);

			// Force reflow: commits the above styles before we set the transition,
			// giving the browser a discrete "start frame" to animate from.
			el.getBoundingClientRect();

			// Animate to final (new) position.
			el.style.transition = transitionString;
			el.style.transform = "";
			applyMovingStylesClear(el, movingStyles);

			// Cleanup after animation completes.
			const cleanup = () => {
				el.style.transition = "";
				animationsRef.current.delete(key);
			};

			// transitionend fires once per transitioned property; guard on
			// 'transform' so cleanup runs exactly once.
			const onEnd = (e: TransitionEvent) => {
				if (e.propertyName !== "transform") return;
				el.removeEventListener("transitionend", onEnd);
				clearTimeout(fallback);
				cleanup();
			};

			// Fallback in case transitionend never fires (e.g. element hidden).
			const fallback = window.setTimeout(() => {
				el.removeEventListener("transitionend", onEnd);
				cleanup();
			}, duration + 50);

			el.addEventListener("transitionend", onEnd);

			animationsRef.current.set(key, {
				cancel: () => {
					clearTimeout(fallback);
					el.removeEventListener("transitionend", onEnd);
					el.style.transition = "";
					el.style.transform = "";
					applyMovingStylesClear(el, movingStyles);
				},
			});
		}

		// ── 6. Save TRUE layout positions for the next render. ─────────────────
		// Always newRects (post-cancel, no transforms) — never visualRects.
		// Saving a mid-animation visual position would corrupt future FLIP deltas.
		prevRectsRef.current = newRects;
		for (const key of elemsRef.current.keys()) {
			if (!currentKeys.has(key)) {
				elemsRef.current.delete(key);
			}
		}
	});

	const getRef = <E extends HTMLElement = HTMLElement>(key: string): RefCallback<E> => {
		const cached = refCallbacksRef.current.get(key);
		if (cached) return cached as RefCallback<E>;

		const callback: RefCallback<HTMLElement> = (el: HTMLElement | null) => {
			if (el) {
				elemsRef.current.set(key, el);
			} else {
				// Element truly unmounted — delete the cached callback so a fresh
				// one is created if the same key reappears later.
				elemsRef.current.delete(key);
				prevRectsRef.current.delete(key);
				animationsRef.current.get(key)?.cancel();
				animationsRef.current.delete(key);
				refCallbacksRef.current.delete(key);
			}
		};

		refCallbacksRef.current.set(key, callback);
		return callback as RefCallback<E>;
	};

	return { getRef };
}
