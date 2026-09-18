export type SearchStatusKind = "empty" | "no-runtime" | "error";

export interface SearchStatusState {
	kind: SearchStatusKind;
	/** Scope title, used to name what came up empty. */
	scopeTitle?: string;
	/** The query that produced an empty result. */
	query?: string;
	/** Underlying failure text, when Aras gave us one. */
	message?: string;
}

interface SearchStatusProps {
	state: SearchStatusState;
	/** Formatted clearCache keybind, offered as a way out of an empty result. */
	reindexKeybind: string;
	onRetry: () => void;
}

const WarningIcon = () => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
		<line x1="12" y1="9" x2="12" y2="13" />
		<line x1="12" y1="17" x2="12.01" y2="17" />
	</svg>
);

export function SearchStatus({ state, reindexKeybind, onRetry }: SearchStatusProps) {
	if (state.kind === "empty") {
		return (
			<div className="search-status">
				<p className="search-status-title">
					No {state.scopeTitle} match &ldquo;{state.query}&rdquo;
				</p>
				<div className="search-status-options">
					<div className="search-status-option">
						<kbd>Escape</kbd>
						<span>search all ItemTypes instead</span>
					</div>
					<div className="search-status-option">
						<kbd>{reindexKeybind}</kbd>
						<span>reindex &mdash; the item may be newer than the cache</span>
					</div>
				</div>
			</div>
		);
	}

	const isRuntime = state.kind === "no-runtime";
	return (
		<div className="search-status">
			<span className="search-status-icon">
				<WarningIcon />
			</span>
			<p className="search-status-title">
				{isRuntime ? "Aras session not ready" : "That search failed"}
			</p>
			<p className="search-status-detail">
				{isRuntime
					? "The search could not run. This usually clears once Innovator finishes loading, or after signing back in."
					: state.message || "Innovator rejected the query."}
			</p>
			<button className="search-status-retry" onClick={onRetry}>
				Retry
			</button>
		</div>
	);
}
