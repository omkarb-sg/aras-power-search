import { useEffect, useRef, type PropsWithChildren } from "react";

interface SearchOverlayProps extends PropsWithChildren {
	isActive: boolean;
}

export function SearchOverlay({ isActive, children }: SearchOverlayProps) {
	const ref = useRef<HTMLDivElement>(null);

	// The overlay stays mounted and is hidden with display:none, so the input's
	// autoFocus only ever fires once at page load. Focus it on each open.
	useEffect(() => {
		if (isActive) ref.current?.querySelector<HTMLInputElement>(".search-input")?.focus();
	}, [isActive]);

	return (
		<div ref={ref} className={`overlay ${isActive ? "active" : ""}`} aria-hidden={!isActive}>
			{children}
		</div>
	);
}
