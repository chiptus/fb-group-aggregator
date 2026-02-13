# Git Rules

## Commit Granularity

- One commit per logical change
- Do NOT combine: feature + refactor, multiple features, multiple fixes
- Each commit must be independently revertible
- Run tests before each commit

## Message Format

```
type(scope): imperative description under 72 chars

Optional body with detailed explanation.
```

**Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`

## Examples

```
# GOOD
feat(dashboard): add subscription filter dropdown
fix(scraper): handle missing author name gracefully
refactor(storage): extract post deduplication logic
test(background): add message handler coverage

# BAD
fix: various improvements              # Too vague
update: add features and fix bugs      # Multiple types
feat(dashboard): add spinner, fix XSS  # Multiple changes
```

## Workflow Note

When using `/speckit.implement`, update tasks.md as tasks complete - don't batch updates.
