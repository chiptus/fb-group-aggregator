# TypeScript Rules

## No Barrel Exports

DO NOT create `index.ts` files that re-export from other modules.

```typescript
// BAD
import { useSubscriptions } from "@/lib/hooks";

// GOOD
import { useSubscriptions } from "@/lib/hooks/storage/useSubscriptions";
```

## Function Declarations

Use named function declarations, not arrow functions for handlers and regular functions.

```typescript
// BAD
const handleClick = (id: string) => { /* ... */ };
const processData = () => { /* ... */ };

// GOOD
function handleClick(id: string) { /* ... */ }
function processData() { /* ... */ }
```

## Destructure in Function Signature

Destructure props/parameters in the function signature, not the body.

```typescript
// BAD
function MyComponent(props: MyProps) {
  const { foo, bar = 'default' } = props;
}

// GOOD
function MyComponent({ foo, bar = 'default' }: MyProps) {
}
```

No biome rule enforces this — apply it by convention.

## Type Preferences

- Use `ReactNode` instead of `JSX.Element` for render prop types (React 19 compatibility)
- Avoid non-null assertions in production code - extract to variables or create helper components
