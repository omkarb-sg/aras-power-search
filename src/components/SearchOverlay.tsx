import { useEffect, useRef, type PropsWithChildren } from "react";

interface SearchOverlayProps extends PropsWithChildren {
	isActive: boolean;
	/** Names the dialog for assistive tech; falls back to the product name. */
	label?: string;
}

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SearchOverlay({ isActive, label, children }: SearchOverlayProps) {
	const ref = useRef<HTMLDivElement>(null);

	// The overlay stays mounted and is hidden with display:none, so the input's
	// autoFocus only ever fires once at page load. Focus it on each open.
	useEffect(() => {
		if (isActive) ref.current?.querySelector<HTMLInputElement>(".search-input")?.focus();
	}, [isActive]);

	// Keep Tab inside the dialog. Without this, tabbing walks straight out into
	// the Innovator page underneath while the overlay is still covering it —
	// focus ends up somewhere the user cannot see.
	useEffect(() => {
		if (!isActive) return;
		const node = ref.current;
		if (!node) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Tab") return;
			const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
				(element) => element.offsetParent !== null,
			);
			if (focusable.length === 0) return;

			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			const active = node.ownerDocument.activeElement;

			if (event.shiftKey && (active === first || !node.contains(active))) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && active === last) {
				event.preventDefault();
				first.focus();
			}
		};

		node.addEventListener("keydown", onKeyDown);
		return () => node.removeEventListener("keydown", onKeyDown);
	}, [isActive]);

	return (
		<div
			ref={ref}
			className={`overlay ${isActive ? "active" : ""}`}
			aria-hidden={!isActive}
			role="dialog"
			aria-modal="true"
			aria-label={label || "Aras Power Search"}
		>
			{children}
		</div>
	);
}
