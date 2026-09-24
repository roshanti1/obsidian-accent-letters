# Accent Letters for Obsidian

Insert any of **682 accented letters** from a searchable picker, and strip the accents from selected
text.

## Commands

**Insert accented letter** — a searchable list over all 682 letters. Search by the letter, its name,
the accent mark, the language that uses it, or its code point:

| You type | You get |
| --- | --- |
| `polish` | ą ć ę ł ń ó ś ź ż |
| `two dots` | ä ë ï ö ü ÿ |
| `00e9` | é |

**Remove accents from selection** — `Crème brûlée in São Paulo` becomes `Creme brulee in Sao Paulo`.
Letters Unicode cannot decompose — `ø ł đ ß æ œ þ ð` and Turkish dotless `ı` — are converted too.
It asks you to select something rather than rewriting the note, and does nothing when there are no
accents to remove, rather than costing you an undo step.

## Privacy

No network requests, no telemetry, no account. The letters are compiled into the plugin, generated
from the Unicode Character Database 16.0.0 and CLDR 48.2.0 — the same data as the
[Accent Letters](https://accentletters.wiki/) website and its other add-ons.

Works on mobile as well as desktop.

MIT licensed.
