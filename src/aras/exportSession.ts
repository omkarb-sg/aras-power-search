import {
	ENGINES,
	VersionRefusal,
	connect,
	type ArasVersion,
	type ConnectOptions,
	type Session,
} from "import-export-libs-js/browser";

/**
 * An Aras version as people name it: `12.0 SP9` below Aras 14, `14.0.9.36073` from 14 on.
 * The build of an older server is left out because the 12.0 engine never reads it.
 */
export function arasVersionText(version: ArasVersion): string {
	return version.major < 14
		? `${version.major}.${version.minor} SP${version.servicePack}`
		: version.fullString;
}

/** The open Aras server is of a version that none of the export engines supports. */
export class UnsupportedArasVersionError extends Error {
	override name = "UnsupportedArasVersionError";
	/** The server's version, as {@link arasVersionText} writes it. */
	readonly serverVersion: string;

	constructor(serverVersion: string) {
		super(
			`Aras ${serverVersion} is not supported: no export engine fits it (engines: ${ENGINES.join(", ")}).`,
		);
		this.serverVersion = serverVersion;
	}
}

/**
 * Opens the export session on the engine that fits the open Aras server.
 *
 * import-export-libs-js reproduces three builds of Aras's export engine, and an item exported
 * by the wrong one is not the file the server's own Package Export would write. So the engine
 * follows the server: `engine: "auto"` has the library read the server's version as it logs in
 * (its `engineForServer`) and run the engine of that release:
 *
 * | Aras server            | engine   |
 * | ---------------------- | -------- |
 * | 10, 11, 12             | `12.0`   |
 * | 13, and 14.0 to 14.34  | `14.0.7` |
 * | 14.35 and later 14.x   | `14.35`  |
 * | 9 and below, 15 and up | none     |
 *
 * The last row is the engines' own version gate (the library's `engineAcceptsServer`): an engine
 * takes a server of its major version or at most two below. A server outside every engine's
 * window is refused with {@link UnsupportedArasVersionError}, and nothing is exported.
 *
 * `session.engine` and `session.serverVersion` say what was chosen and for which server.
 */
export async function connectForExport(
	options: Pick<
		ConnectOptions,
		"url" | "database" | "tokenProvider" | "transport"
	>,
): Promise<Session> {
	try {
		return await connect({ ...options, engine: "auto" });
	} catch (e) {
		if (e instanceof VersionRefusal)
			throw new UnsupportedArasVersionError(
				arasVersionText(e.serverVersion),
			);
		throw e;
	}
}
