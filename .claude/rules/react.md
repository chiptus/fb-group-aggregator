# React Rules

## React Query Hook Usage

DO NOT destructure query results. Access properties via dot notation.

```typescript
// BAD
const { data: posts = [], isLoading, error } = usePosts();

// GOOD
const postsQuery = usePosts();
const posts = postsQuery.data ?? [];
const isLoading = postsQuery.isLoading;
```

## Naming Conventions

- Queries: `subscriptionsQuery`, `postsQuery` (suffix with `Query`)
- Mutations: `createSubscriptionMutation`, `updateGroupMutation` (suffix with `Mutation`)
- Extract data with nullish coalescing: `query.data ?? []`

## Component Guidelines

- Max ~150 lines per component - extract if larger
- Extract repeated JSX patterns (2+ occurrences)
- Use `<output>` element for status messages (semantic HTML)

## Mutation Pattern

```typescript
function handleCreate() {
  createSubscriptionMutation.mutate('New Sub', {
    onSuccess: () => { /* close form, reset state */ },
    onError: (err) => { console.error('Failed:', err); },
  });
}
```
