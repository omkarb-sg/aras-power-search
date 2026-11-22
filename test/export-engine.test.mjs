// Quick Export runs the export engine that fits the open Aras server. These tests log in to
// fake servers of each Aras version through the real library and check the engine the session
// ends up on, and that a server no engine supports is refused with a readable message.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
	ENGINES,
	engineAcceptsServer,
	engineForServer,
} from "import-export-libs-js/browser";
import {
	UnsupportedArasVersionError,
	arasVersionText,
	connectForExport,
} from "../src/aras/exportSession.ts";

const BASE = "http://aras.example/InnovatorServer";
const SOAP_OPEN =
	'<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Body>';
const SOAP_CLOSE = "</SOAP-ENV:Body></SOAP-ENV:Envelope>";

function respond(body) {
	return {
		status: 200,
		reason: "OK",
		headers: [],
		body: new TextEncoder().encode(body),
	};
}

function header(request, name) {
	return request.headers.find(
		([n]) => n.toLowerCase() === name.toLowerCase(),
	)?.[1];
}

/**
 * A fake Aras server of one version: OAuth discovery and the SOAP answers of a login, the
 * version probe (the `Version*` Variable items) and the logoff. `actions` collects the SOAP
 * actions it was sent.
 */
function fakeAras({
	major,
	minor,
	servicePack = "0",
	build = "40000",
	serviceUpdate = "0",
}) {
	const variables = {
		VersionMajor: String(major),
		VersionMinor: String(minor),
		VersionServicePack: servicePack,
		VersionBuild: build,
		VersionServiceUpdate: serviceUpdate,
	};
	const actions = [];
	const send = async (request) => {
		const url = request.url;
		if (url.endsWith("/OAuthServerDiscovery.aspx")) {
			return respond(
				JSON.stringify({
					locations: [{ uri: `${BASE}/OAuthServer/` }],
				}),
			);
		}
		if (url.endsWith("/.well-known/openid-configuration")) {
			return respond(
				JSON.stringify({
					issuer: "OAuthServer",
					jwks_uri: `${BASE}/OAuthServer/.well-known/openid-configuration/jwks`,
					authorization_endpoint: `${BASE}/OAuthServer/connect/authorize`,
					token_endpoint: `${BASE}/OAuthServer/connect/token`,
					end_session_endpoint: `${BASE}/OAuthServer/connect/endsession`,
					protocol_version: "1.0",
					protocol_info: {
						protocol_type: "Standard",
						authorization_header: "Authorization",
						www_authenticate_header: "WWW-Authenticate",
						unauthorized_status_code: "401",
					},
				}),
			);
		}
		if (url.endsWith("/jwks")) return respond('{"keys":[]}');

		const action = header(request, "SOAPAction");
		actions.push(action);
		const body = new TextDecoder().decode(request.body ?? new Uint8Array());
		switch (action) {
			case "ValidateUser":
				return respond(
					`${SOAP_OPEN}<Result><id>USER1</id><login_name>admin</login_name><database>db</database>` +
						"<i18nsessioncontext><locale>en-US</locale><time_zone>UTC</time_zone></i18nsessioncontext>" +
						`</Result>${SOAP_CLOSE}`,
				);
			case "GetCurrentUserID":
				return respond(
					`${SOAP_OPEN}<GetCurrentUserIDResponse><Result>USER1</Result></GetCurrentUserIDResponse>${SOAP_CLOSE}`,
				);
			case "ApplyItem":
				return respond(
					`${SOAP_OPEN}<Result><Item type="User" id="USER1"><default_vault keyed_name="Default" type="Vault">V1</default_vault></Item></Result>${SOAP_CLOSE}`,
				);
			case "ApplyAML": {
				const names = [...body.matchAll(/<name>(\w+)<\/name>/g)].map(
					(m) => m[1],
				);
				const items = names
					.filter((n) => variables[n] !== undefined)
					.map(
						(n) =>
							`<Item type="Variable" id="${n}"><id keyed_name="${n}" type="Variable">${n}</id><value>${variables[n]}</value><name>${n}</name></Item>`,
					);
				return respond(
					`${SOAP_OPEN}<Result>${items.join("")}</Result>${SOAP_CLOSE}`,
				);
			}
			case "Logoff":
				return respond(
					`${SOAP_OPEN}<LogOffResponse><Result>ok</Result></LogOffResponse>${SOAP_CLOSE}`,
				);
			default:
				throw new Error(`unexpected request ${url} ${action}`);
		}
	};
	return { transport: { send }, actions };
}

function connectTo(server) {
	return connectForExport({
		url: BASE,
		database: "db",
		tokenProvider: { getAccessToken: async () => "token" },
		transport: server.transport,
	});
}

// [server version, the engine Quick Export must run, the version as Quick Export names it]
const SUPPORTED = [
	[
		{ major: 10, minor: 0, servicePack: "SP4", build: "5846" },
		"12.0",
		"10.0 SP4",
	],
	[
		{ major: 11, minor: 0, servicePack: "SP15", build: "6920" },
		"12.0",
		"11.0 SP15",
	],
	[
		{ major: 12, minor: 0, servicePack: "SP9", build: "24090" },
		"12.0",
		"12.0 SP9",
	],
	[
		{ major: 12, minor: 0, servicePack: "SP18", build: "30155" },
		"12.0",
		"12.0 SP18",
	],
	[{ major: 13, minor: 0, build: "33000" }, "14.0.7", "13.0 SP0"],
	[
		{ major: 14, minor: 0, build: "36073", serviceUpdate: "9" },
		"14.0.7",
		"14.0.9.36073",
	],
	[{ major: 14, minor: 34, build: "43000" }, "14.0.7", "14.34.0.43000"],
	[{ major: 14, minor: 35, build: "43890" }, "14.35", "14.35.0.43890"],
	[{ major: 14, minor: 36, build: "44000" }, "14.35", "14.36.0.44000"],
];

for (const [version, engine, text] of SUPPORTED) {
	test(`an Aras ${text} server is exported by engine ${engine}`, async () => {
		const server = fakeAras(version);
		const session = await connectTo(server);
		assert.equal(session.engine, engine);
		assert.equal(arasVersionText(session.serverVersion), text);
		assert.equal(session.versionGate?.accepted, true);
		assert.equal(
			session.versionGate?.fittingEngines.includes(engine),
			true,
		);
		await session.close();
		assert.equal(server.actions.at(-1), "Logoff");
	});
}

// [server version, the version text the error names]
const UNSUPPORTED = [
	[{ major: 9, minor: 4, build: "6000" }, "9.4 SP0"],
	[
		{ major: 15, minor: 0, build: "50000", serviceUpdate: "1" },
		"15.0.1.50000",
	],
	[{ major: 31, minor: 0, build: "60000" }, "31.0.0.60000"],
];

for (const [version, text] of UNSUPPORTED) {
	test(`an Aras ${text} server is refused: no engine fits it`, async () => {
		const server = fakeAras(version);
		await assert.rejects(connectTo(server), (error) => {
			assert.ok(error instanceof UnsupportedArasVersionError);
			assert.equal(error.serverVersion, text);
			assert.equal(
				error.message,
				`Aras ${text} is not supported: no export engine fits it (engines: 12.0, 14.0.7, 14.35).`,
			);
			return true;
		});
	});
}

test("a login the server refuses is not reported as an unsupported version", async () => {
	const server = fakeAras({ major: 14, minor: 0 });
	const send = server.transport.send;
	server.transport.send = async (request) =>
		header(request, "SOAPAction") === "ValidateUser"
			? respond(
					`${SOAP_OPEN}<SOAP-ENV:Fault><faultcode>SOAP-ENV:Server.Authentication.FailedException</faultcode>` +
						`<faultstring>Authentication failed for admin</faultstring><detail></detail></SOAP-ENV:Fault>${SOAP_CLOSE}`,
				)
			: send(request);
	await assert.rejects(connectTo(server), (error) => {
		assert.equal(error instanceof UnsupportedArasVersionError, false);
		assert.match(error.message, /Authentication failed/);
		return true;
	});
});

test("the engines are the three the mapping names", () => {
	assert.deepEqual([...ENGINES], ["12.0", "14.0.7", "14.35"]);
});

test("every Aras version the library maps to an engine is one that engine accepts, or none does", () => {
	for (let major = 0; major <= 40; major++) {
		for (const minor of [0, 7, 34, 35, 36]) {
			const engine = engineForServer({ major, minor });
			const supported = major >= 10 && major <= 14;
			assert.equal(
				engineAcceptsServer(engine, major),
				supported,
				`Aras ${major}.${minor} on ${engine}`,
			);
		}
	}
});
