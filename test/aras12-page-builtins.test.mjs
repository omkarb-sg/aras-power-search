// Regression test for issue #30: Quick Export failed in Aras 12 with
// "Name cannot begin with the '/' character, hexadecimal value 0x2F. Line 2, position 17."
//
// The Aras 12 client loads MicrosoftAjax, which replaces String.prototype.startsWith with a
// version that ignores the position argument. import-export-libs-js runs in that page, and its
// XML parser used text.startsWith("</", index), so every end tag failed to parse. This test
// installs the Aras 12 replacement and parses the response the export reads first.
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { ResponseDocument } from "import-export-libs-js/browser";

// Copied from the Aras 12.0 SP9 client page.
function aras12StartsWith(a) {
	return !a.length
		? true
		: a.length > this.length
			? false
			: this.substr(0, a.length) == a;
}

// The ValidateUser response of an Aras 12.0 SP9 server, as the export's login receives it.
const VALIDATE_USER_RESPONSE =
	'<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Body><Result>' +
	"<id>AD30A6D8D3B642F5A2AFED1A4B02BEFA</id><user_type>admin</user_type><login_name>root</login_name>" +
	"<database>arashouse_12sp9_02</database><password_hash_algorithm>MD5</password_hash_algorithm>" +
	"<authentication_type>local</authentication_type><i18nsessioncontext>" +
	"<corporate_to_local_offset>0</corporate_to_local_offset><default_language_suffix></default_language_suffix>" +
	"<locale>en-US</locale><language_code>en</language_code><default_language_code>en</default_language_code>" +
	"<time_zone>India Standard Time</time_zone><language_suffix></language_suffix></i18nsessioncontext>" +
	"</Result></SOAP-ENV:Body></SOAP-ENV:Envelope>";

const nativeStartsWith = String.prototype.startsWith;

beforeEach(() => {
	String.prototype.startsWith = aras12StartsWith;
});

afterEach(() => {
	String.prototype.startsWith = nativeStartsWith;
});

test("the Aras 12 startsWith replacement ignores the position argument", () => {
	assert.equal("a</b".startsWith("</", 1), false);
});

test("the export library parses a ValidateUser response in an Aras 12 page", () => {
	const response = ResponseDocument.parse(VALIDATE_USER_RESPONSE);
	assert.equal(response.isError, false);
	assert.match(
		response.outerXml,
		/<time_zone>India Standard Time<\/time_zone>/,
	);
});
