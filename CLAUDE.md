# zeros

A 0-level funnel character generator for old-school fantasy RPGs. Hexagonal TypeScript: a pure domain core with ports, and a CLI adapter, so a UI can be added later on the same core.

## Sources

- The rules tables (ability modifiers, birth augur effects, equipment, weapons, hit points, saves) follow the standard 0-level funnel rules. Copy a rules table from the rules source, never from memory.
- The occupation table is `docs/tables/professions.md`, the name and nickname tables are `docs/tables/names.md`, and the description tables are `docs/tables/descriptions.md`. Each is mirrored in `src/domain/tables`, and a test keeps each pair in step.
- Never name a third party's product or trademark in the code, docs or output. Licensed material is credited only in `CREDITS.md` and `OGL.md`.

## Rules

- The domain never imports an adapter, Node API or the clock; randomness comes only through the dice port.
- Every roll is reproducible from a seed, and a change never alters what an existing seed rolls without an option: a new roll is either appended at the end or made only when its option is on.
- No comments or docstrings. Names and tests carry the why.
- kebab-case filenames.
- `npm run check` must pass before a commit.

## Layout

- `src/domain` - the pure core: the Dice port in `ports/`, the rules tables in `tables/`, and `rollZero`.
- `src/adapters` - implementations of ports, such as the seeded dice; `cli/` is the command-line adapter: argument parsing and rendering only, importing the domain through `src/domain/index.ts`.
- `tests` - vitest suites, including the architecture test that guards the domain's imports.

## Dice order

`rollZero` rolls in this fixed order:

1. `roll(100)` for the heroic chance, only when the chance is 1-99.
2. Each ability in turn (Strength, Agility, Stamina, Personality, Intelligence, Luck): three `roll(6)`, or four when heroic, keeping the highest three.
3. `roll(30)` birth augur.
4. `roll(4)` hit die, and a second `roll(4)` with survivors, keeping the higher.
5. `roll(100)` occupation, `roll(24)` equipment, five `roll(12)` copper.
6. `roll(6)` alignment, skipped when the caller fixes it.
7. `roll(2)` sex, `roll(100)` name, `roll(100)` nickname chance (1-40 takes one) and only then `roll(100)` nickname.
8. One die call per dice term in the trade goods.
9. Features, twice: `roll(10)` category (rerolled while it repeats the first) then `roll(20)` feature. A feature whose implied ability disagrees with that ability's modifier is replaced by the next allowed entry in the same table, with no extra roll.
