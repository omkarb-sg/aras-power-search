import type { PropsWithChildren } from "react";

interface SearchOverlayProps extends PropsWithChildren {
	isActive: boolean;
}

export function SearchOverlay({ isActive, children }: SearchOverlayProps) {
	return (
		<div className={`overlay ${isActive ? "active" : ""}`} aria-hidden={!isActive}>
			{children}
		</div>
	);
}
