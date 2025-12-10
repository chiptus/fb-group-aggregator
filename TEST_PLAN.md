# Test Plan for PR: Component Refactoring

## Overview
This PR introduces several new components and utilities as part of refactoring the popup UI. This test plan ensures all new code has adequate test coverage.

## Files Added/Modified

### New Components (UI)
1. **CreateSubscriptionForm.tsx** - Form for creating subscriptions
2. **EditSubscriptionForm.tsx** - Form for editing subscriptions
3. **DeleteButton.tsx** - Reusable delete button
4. **GroupToggle.tsx** - Enable/disable toggle
5. **GroupAssignSubscription.tsx** - Subscription selector dropdown
6. **GroupItem.tsx** - Container for group controls
7. **TabNavigationItem.tsx** - Individual tab button

### New Utilities
8. **subscriptionFormSchema.ts** - Zod validation schema
9. **queryClient.ts** - Query client factory
10. **queryKeys.ts** - Shared query keys
11. **useSubscriptions.ts** - Subscription hooks (split from useStorageData)
12. **useGroups.ts** - Group hooks (split from useStorageData)
13. **usePosts.ts** - Post hooks (split from useStorageData)

## Test Coverage Strategy

### ✅ Already Tested (Integration)
- GroupsTab.test.tsx - Tests GroupItem, GroupToggle, GroupAssignSubscription, DeleteButton indirectly
- SubscriptionsTab.test.tsx - Tests CreateSubscriptionForm, EditSubscriptionForm indirectly
- PopupHeader.test.tsx - Integration tests
- OverviewTab.test.tsx - Integration tests
- App.test.tsx - Integration tests

### ❌ Missing Unit Tests

#### High Priority - Complex Components
1. **CreateSubscriptionForm** - Form logic, validation, submission
2. **EditSubscriptionForm** - Form logic, validation, submission with initial values

#### Medium Priority - Reusable Components
3. **DeleteButton** - Click handler, accessibility
4. **GroupToggle** - Toggle state, onChange callback
5. **GroupAssignSubscription** - Selection change, options rendering
6. **GroupItem** - Integration of child components
7. **TabNavigationItem** - Active state, click handler

#### Low Priority - Utilities
8. **subscriptionFormSchema** - Zod validation rules
9. **queryClient** - Factory function returns correct config

## Test Implementation Plan

### 1. Form Components (CreateSubscriptionForm, EditSubscriptionForm)
**Test Cases:**
- ✅ Renders with empty/initial values
- ✅ Shows validation errors on invalid input
- ✅ Calls mutation on valid submission
- ✅ Calls onSuccess callback after successful mutation
- ✅ Calls onCancel callback when cancel is clicked
- ✅ Disables submit button when form is invalid
- ✅ Shows mutation error when mutation fails
- ✅ Disables buttons while mutation is pending

### 2. DeleteButton
**Test Cases:**
- ✅ Renders with correct label
- ✅ Calls onDelete when clicked
- ✅ Has proper ARIA label

### 3. GroupToggle
**Test Cases:**
- ✅ Renders checked when enabled=true
- ✅ Renders unchecked when enabled=false
- ✅ Calls onToggle with correct value when clicked
- ✅ Shows correct label (Enabled/Disabled)
- ✅ Has proper ARIA attributes

### 4. GroupAssignSubscription
**Test Cases:**
- ✅ Renders "No subscription" option
- ✅ Renders all provided subscriptions
- ✅ Selects correct subscription based on prop
- ✅ Calls onAssign with selected subscription ID
- ✅ Has proper ARIA label

### 5. GroupItem
**Test Cases:**
- ✅ Renders group name and URL
- ✅ Passes correct props to child components
- ✅ Calls onToggle when toggle changes
- ✅ Calls onAssign when subscription changes
- ✅ Calls onDelete when delete is clicked

### 6. TabNavigationItem
**Test Cases:**
- ✅ Renders with active styles when active
- ✅ Renders with inactive styles when not active
- ✅ Calls onTabChange when clicked
- ✅ Has proper ARIA attributes

### 7. subscriptionFormSchema
**Test Cases:**
- ✅ Validates minimum length (1 character)
- ✅ Validates minimum length (2 characters)
- ✅ Trims whitespace
- ✅ Returns proper error messages

### 8. queryClient
**Test Cases:**
- ✅ Returns QueryClient instance
- ✅ Has correct staleTime (5 minutes)
- ✅ Has refetchOnWindowFocus disabled
- ✅ Has retry set to 1

## Success Criteria
- All new components have unit tests
- Test coverage for new code is > 80%
- All tests pass
- No regressions in existing tests
- TypeScript compilation succeeds
