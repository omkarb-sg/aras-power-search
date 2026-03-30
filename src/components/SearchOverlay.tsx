import type { MouseEvent, PropsWithChildren } from "react";

interface SearchOverlayProps extends PropsWithChildren {
	isActive: boolean;
	onBackdropClick?: () => void;
}

export function SearchOverlay({
	isActive,
	onBackdropClick,
	children,
}: SearchOverlayProps) {
	const handleClick = (event: MouseEvent<HTMLDivElement>) => {
		if (event.target !== event.currentTarget) return;
		onBackdropClick?.();
	};

	return (
		<div
			className={`overlay ${isActive ? "active" : ""}`}
			role={isActive ? "dialog" : undefined}
			aria-modal={isActive || undefined}
			aria-label={isActive ? "Aras power search" : undefined}
			aria-hidden={!isActive}
			onClick={handleClick}
		>
			{children}
		</div>
	);
}
