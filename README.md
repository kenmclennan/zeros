# zeros

A 0-level funnel character generator for old-school fantasy RPGs, with a sword-and-sorcery occupation table, name and nickname tables and two descriptive features per character. It rolls a funnel of zeros from the command line as plain text, JSON or boxed ASCII character sheets ready to print.

## Requirements

- Node.js 24 or later, with npm.
- git, to clone the repository.

## Setup

Clone the repository, install the dependencies and build:

```text
git clone https://github.com/kenmclennan/zeros.git
cd zeros
npm ci
npm run build
```

Run it from the repository with `npx`:

```text
npx zeros roll
```

Or link it once so `zeros` is on your PATH from any directory:

```text
npm link
zeros roll --count 4
```

After pulling new changes, run `npm ci && npm run build` again. `npm unlink -g zeros` removes the link.

## Rolling characters

`zeros roll` rolls one zero and prints it. Each zero has ability scores and modifiers, a birth augur (the lucky roll), hit points, saves, attack bonuses, an occupation with its weapon and trade goods, a piece of equipment, copper, languages, a name (sometimes with a nickname) and two descriptive features. Features that imply an ability, such as a muscled back or a limp, only appear when that ability's modifier agrees.

```text
Seed: 1

Pashai - female, Lawful Lotus-Eater
Features: a bone pin through the ear; a kilt of woven grass
STR  9 (+0)  AGI 14 (+1)  STA 12 (+0)
PER 12 (+0)  INT  6 (-1)  LCK  5 (-2)
HP 4  AC 11  Init +1  Speed 30
Attack: melee +0, missile +1
Saves: Ref +1  Fort +0  Will +0
Lucky roll: 12 (-2) Born in a smuggler's tunnel: Find secret doors
Weapon: Razor (dagger), 1d4
Trade goods: Pouch of lotus leaves
Equipment: Empty chest
Copper: 29
Languages: Common (reads and writes)
XP: 0
```

Every run prints the seed it used on its first line, with any options that change the dice, such as `Seed: 1 (heroic 50%, survivors)`. Run the same command with `--seed <n>` and the same options to roll exactly the same characters again.

## Options

| Option | Value | Default | What it does |
| --- | --- | --- | --- |
| `--count N` | integer 1-100 | 1 | How many zeros to roll. A funnel usually starts with three or four per player. |
| `--seed S` | integer 0-4294967295 | a fresh random seed | Seeds the dice so a roll can be reproduced. |
| `--alignment A` | `lawful`, `neutral` or `chaotic` | rolled for each zero | Gives every zero the same alignment. |
| `--heroic [P]` | optional integer 1-100 | off: abilities are 3d6 | Rolls abilities as 4d6, dropping the lowest die. With a number, each zero has that percent chance of being rolled this way; bare `--heroic` means 100. Which zeros were rolled this way is never shown. |
| `--survivors` | none | off | Rolls the hit die twice and keeps the higher result. |
| `--format F` | `text`, `json` or `ascii` | `text` | `text` prints the compact card above, `json` prints the seed, the settings and every zero's full record, and `ascii` prints each zero as a 64-column boxed character sheet. |
| `--layout L` | `1-up` or `4-up` | `1-up` | `4-up` prints ASCII sheets four to a page on a 2x2 grid, 130 columns wide, with a form feed between pages and blank sheets filling the last page. Needs `--format ascii`. |
| `--help`, `-h` | none | - | Prints the usage. |

Examples:

```text
zeros roll --count 4 --alignment chaotic
zeros roll --count 8 --heroic 25 --survivors
zeros roll --count 4 --format ascii --layout 4-up > funnel.txt
zeros roll --seed 1234 --format json
```

Exit codes: 0 on success, 2 on a bad invocation. On a bad invocation the message goes to stderr as `zeros: <message>` and nothing is printed to stdout.

## Development

`npm run check` runs the type check, lint, tests, markdown checks and build, and must pass before a commit. The rules tables live in `src/domain/tables`, with the occupation, name and description tables mirrored as markdown in `docs/tables`; a test keeps each pair in step.

## Licence

The code is released under the MIT licence in `LICENSE`. The name and nickname tables are Open Game Content under the Open Game License in `OGL.md`, and the description tables are adapted under the ORC License; `CREDITS.md` has the details.
