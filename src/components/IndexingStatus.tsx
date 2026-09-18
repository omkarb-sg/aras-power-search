export interface IndexingState {
	/** Scope being indexed, e.g. "Parts". */
	title: string;
	loaded: number;
	/** Null until the first page reports pagemax. */
	total: number | null;
}

interface IndexingStatusProps {
	state: IndexingState;
}

const format = (n: number) => n.toLocaleString();

export function IndexingStatus({ state }: IndexingStatusProps) {
	const { title, loaded, total } = state;
	const percent = total && total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : null;

	return (
		<div className="indexing-status">
			<div className="indexing-bar">
				<div
					className={`indexing-bar-fill${percent === null ? " indeterminate" : ""}`}
					style={percent === null ? undefined : { width: `${percent}%` }}
				/>
			</div>
			<div className="indexing-line">
				<span>Indexing {title}</span>
				<span className="indexing-count">
					{total === null ? format(loaded) : `${format(loaded)} / ${format(total)}`}
				</span>
			</div>
			<span className="indexing-hint">
				First visit to this type &mdash; Escape to cancel
			</span>
		</div>
	);
}
