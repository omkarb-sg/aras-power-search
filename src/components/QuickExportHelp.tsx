interface QuickExportHelpProps {
	onClose: () => void;
}

const STEPS: { title: string; detail: string; code?: string }[] = [
	{
		title: "Load the quick-export extension",
		detail:
			"In Chrome or Edge open chrome://extensions, turn on Developer mode, choose Load unpacked and pick the quick-export src/extension folder.",
	},
	{
		title: "Start the local export service",
		detail:
			"The extension hands the export to a helper service on 127.0.0.1:8737. Run it from the quick-export folder, or install it once so it starts with Windows.",
		code: "npm run service",
	},
	{
		title: "Reload this Aras tab",
		detail:
			"The extension attaches on page load, so this tab needs a refresh before power-search can reach it.",
	},
];

export function QuickExportHelp({ onClose }: QuickExportHelpProps) {
	return (
		<div className="search-overlay-content qe-help">
			<div className="qe-help-header">
				<span className="qe-help-icon" aria-hidden="true">
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
				</span>
				<h2 className="qe-help-title">Quick Export needs the quick-export extension</h2>
			</div>

			<p className="qe-help-lead">
				power-search didn't get a response from the extension, so export is turned off. Set it up
				and the export button comes back on every row.
			</p>

			<ol className="qe-help-steps">
				{STEPS.map((step) => (
					<li key={step.title}>
						<span className="qe-help-step-title">{step.title}</span>
						<span className="qe-help-step-detail">{step.detail}</span>
						{step.code && <code className="qe-help-code">{step.code}</code>}
					</li>
				))}
			</ol>

			<div className="qe-help-footer">
				<span className="qe-help-hint">
					Already set up? Reopen power-search — it re-checks each time.
				</span>
				<button className="qe-help-close" onClick={onClose}>
					Got it
				</button>
			</div>
		</div>
	);
}
