import { Editor, FuzzySuggestModal, Notice, Plugin, type App, type FuzzyMatch } from "obsidian";
import { LANGS, LETTERS, type Letter } from "./letters";

/**
 * Accent Letters for Obsidian.
 *
 * Two commands: pick a letter from a searchable list and insert it at the cursor, and strip the
 * accents from the current selection.
 *
 * The accent rules are identical to the Accent Letters website, apps and every other add-on, so a
 * letter cannot strip one way here and another way there.
 */

/** Letters with no canonical decomposition: NFD leaves them untouched, so they need a table. */
const SPECIAL: Record<string, string> = {
	ø: "o", Ø: "O", ł: "l", Ł: "L", đ: "d", Đ: "D", ħ: "h", Ħ: "H", ı: "i", ŧ: "t", Ŧ: "T",
	ß: "ss", ẞ: "SS", æ: "ae", Æ: "AE", œ: "oe", Œ: "OE", þ: "th", Þ: "Th", ð: "d", Ð: "D",
};
const SPECIAL_RE = new RegExp(`[${Object.keys(SPECIAL).join("")}]`, "g");

/**
 * NFD, not NFKD: stripping accents must leave the rest of the text alone, and a compatibility
 * decomposition would also rewrite ﬁ to fi and ½ to 1⁄2.
 *
 * Deliberately no lookbehind anywhere in this file. This plugin is not desktop-only, and lookbehind
 * assertions are unsupported on older iOS versions — where the failure is a silent nothing.
 *
 * The table runs AFTER the decomposition, never instead of it: ǣ decomposes to æ plus a macron, and
 * æ itself has no plain form, so it still has to become "ae".
 */
const LATIN = /\p{Script=Latin}/u;

/**
 * A combining mark is not always an accent. In Devanagari the virama is a mark, so क्षत्रिय became
 * कषतरय; in Thai the vowels are marks, so สวัสดี became สวสด; and ❤️ lost its variation selector.
 * A character is only touched when its decomposition starts with a LATIN letter.
 */
function stripChar(c: string): string {
	const d = c.normalize("NFD");
	if (!LATIN.test(d[0])) return c;
	return d.replace(/\p{M}/gu, "").replace(SPECIAL_RE, (x) => SPECIAL[x]);
}

export function removeAccents(text: string): string {
	return Array.from(text.normalize("NFC")).map(stripChar).join("");
}

/** Everything a reader might type, flattened once so the fuzzy search has something to match. */
function searchTextFor(letter: Letter): string {
	const languages = Object.entries(LANGS)
		.filter(([code]) => letter.t.includes(code))
		.map(([, name]) => name)
		.join(" ");
	return `${letter.c} ${letter.d} ${letter.n} ${letter.t} ${languages} u+${letter.u}`.toLowerCase();
}

class LetterModal extends FuzzySuggestModal<Letter> {
	private readonly onPick: (letter: Letter) => void;
	private readonly haystack = new Map<string, string>();

	constructor(app: App, onPick: (letter: Letter) => void) {
		super(app);
		this.onPick = onPick;
		for (const letter of LETTERS) this.haystack.set(letter.u, searchTextFor(letter));
		this.setPlaceholder("Letter, name, language, accent mark or code point");
		// 682 items through the default limit would hide most matches for a broad query such as
		// "acute", which is exactly the kind of search this is for.
		this.limit = 200;
	}

	getItems(): Letter[] {
		return LETTERS;
	}

	getItemText(item: Letter): string {
		return this.haystack.get(item.u) ?? item.c;
	}

	renderSuggestion(match: FuzzyMatch<Letter>, el: HTMLElement): void {
		// createEl/createDiv rather than innerHTML: the plugin guidelines forbid assigning HTML, and
		// these letters would be fine but the habit is what keeps a reviewer happy.
		const row = el.createDiv({ cls: "accent-letters-row" });
		row.createSpan({ cls: "accent-letters-glyph", text: match.item.c });
		const text = row.createDiv({ cls: "accent-letters-text" });
		text.createDiv({ cls: "accent-letters-name", text: match.item.d });
		text.createDiv({ cls: "accent-letters-code", text: `U+${match.item.u}` });
	}

	onChooseItem(item: Letter): void {
		this.onPick(item);
	}
}

export default class AccentLettersPlugin extends Plugin {
	onload(): void {
		// Command ids carry no plugin id and names carry no plugin name: Obsidian prefixes both, and
		// the official linter fails a plugin that does it twice. UI text is sentence case.
		this.addCommand({
			id: "insert-letter",
			name: "Insert accented letter",
			editorCallback: (editor: Editor) => {
				new LetterModal(this.app, (letter) => {
					// One position, not two: replaceRange with a single position inserts rather than
					// replaces, which is how Obsidian documents inserting at the cursor.
					editor.replaceRange(letter.c, editor.getCursor());
					const to = editor.getCursor();
					editor.setCursor({ line: to.line, ch: to.ch + letter.c.length });
					editor.focus();
				}).open();
			},
		});

		this.addCommand({
			id: "remove-accents",
			name: "Remove accents from selection",
			editorCallback: (editor: Editor) => {
				// somethingSelected() rather than testing getSelection() for "": what the Editor API
				// does with an empty selection is not documented, and rewriting a whole note because
				// of an assumption is not a mistake worth risking.
				if (!editor.somethingSelected()) {
					new Notice("Select the text you want to change first.");
					return;
				}

				const selection = editor.getSelection();
				const stripped = removeAccents(selection);

				// Replacing a selection with an identical copy still costs an undo step and moves the
				// cursor, for no change.
				if (stripped === selection) {
					new Notice("There are no accents in the selected text.");
					return;
				}

				editor.replaceSelection(stripped);
			},
		});
	}
}
