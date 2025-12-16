# Button Component

A standardized button component with multiple variants and sizes, following shadcn/ui patterns.

## Import

```tsx
import { Button } from "@/components/ui/button";
```

## Variants

### Default
Standard button with dark background.
```tsx
<Button variant="default">Default Button</Button>
```

### Primary
Primary action button with blue background.
```tsx
<Button variant="primary">Primary Button</Button>
```

### Secondary
Secondary button with light gray background.
```tsx
<Button variant="secondary">Secondary Button</Button>
```

### Ghost
Transparent button with hover effect.
```tsx
<Button variant="ghost">Ghost Button</Button>
```

### Link
Link-style button with underline on hover.
```tsx
<Button variant="link">Link Button</Button>
```

### Destructive
Destructive action button with red background.
```tsx
<Button variant="destructive">Delete</Button>
```

### Outline
Button with border and white background.
```tsx
<Button variant="outline">Outline Button</Button>
```

## Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>
```

## Props

All standard button HTML attributes are supported:

```tsx
<Button
  variant="primary"
  size="md"
  onClick={() => console.log('clicked')}
  disabled={false}
  className="custom-class"
  type="button" // defaults to "button"
>
  Click me
</Button>
```

## Examples from Codebase

### Selection/Filter Buttons (SubscriptionSidebar)
```tsx
<Button
  onClick={() => onSelectSubscription(sub.id)}
  variant={selectedSubscriptionId === sub.id ? "primary" : "ghost"}
  className="w-full justify-start"
>
  {sub.name}
</Button>
```

### Action Buttons (BulkActionsBar)
```tsx
<Button onClick={onBulkAssign} disabled={!bulkSubscriptionId} variant="primary" size="sm">
  Assign
</Button>
<Button onClick={onBulkDelete} variant="destructive" size="sm">
  Delete
</Button>
```

### Link-style Buttons (PostCard)
```tsx
<Button onClick={() => onToggleSeen(post.id, post.seen)} variant="link" size="sm">
  {post.seen ? "Mark as unseen" : "Mark as seen"}
</Button>
```

### Destructive Link Button (GroupRow)
```tsx
<Button
  onClick={() => onDelete(group.id)}
  variant="link"
  size="sm"
  className="text-red-600 hover:text-red-800"
>
  Delete
</Button>
```

## Custom Styling

You can override styles with the `className` prop. The component uses `cn()` utility to merge classes properly:

```tsx
<Button
  variant="default"
  className="bg-green-600 hover:bg-green-700"
>
  Custom Green Button
</Button>
```

## Accessibility

- Type defaults to `"button"` to prevent accidental form submissions
- Supports all ARIA attributes
- Includes focus-visible ring for keyboard navigation
- Disabled state properly handles pointer events and opacity
