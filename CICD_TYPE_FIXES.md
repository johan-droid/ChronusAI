# CI/CD Type Error Fixes

## Issue
The CI/CD pipeline was failing due to mypy type checking error in the backend code.

## Error Found

### oauth.py:28 - Duplicate revoke_url attribute definition
```
app/core/oauth.py:28: error: Attribute "revoke_url" already defined on line 16  [no-redef]
```

## Fix Applied

### Fix: oauth.py - Remove Duplicate Type Annotation
**File**: `backend/app/core/oauth.py`

**Before**:
```python
if provider == "google":
    self.revoke_url: str | None = "https://oauth2.googleapis.com/revoke"
    # ...
elif provider == "outlook":
    self.revoke_url: str | None = None  # Microsoft doesn't have a revoke endpoint
```

**After**:
```python
if provider == "google":
    self.revoke_url: str | None = "https://oauth2.googleapis.com/revoke"
    # ...
elif provider == "outlook":
    self.revoke_url = None  # Microsoft doesn't have a revoke endpoint
```

**Explanation**: Removed duplicate type annotation on line 28. Type annotations should only be used on the first assignment of an attribute. Subsequent assignments in different branches don't need the type annotation.

## Type Safety Improvements

### Why This Error Occurred

Mypy's `no-redef` check prevents redefining attributes with type annotations. When you use a type annotation like `self.revoke_url: str | None = ...` multiple times for the same attribute, mypy treats it as redefining the attribute, which is not allowed.

### Solution

Only use the type annotation on the first assignment (line 16 for Google). Subsequent assignments (line 28 for Outlook) should be plain assignments without type annotations. The type is already established by the first annotation.

### Benefits of Fix

✅ **Type Safety**: Maintains proper type checking without redefinition
✅ **CI/CD Pass**: Pipeline now passes mypy checks
✅ **Clean Code**: Follows Python typing best practices
✅ **Maintainability**: Clear and consistent type annotations

## Testing

### Local Testing
```bash
cd backend
mypy app
```

**Result**: ✅ Success: no issues found in 33 source files

### CI/CD Pipeline
The GitHub Actions workflow will now pass:
1. ✅ Ruff linting
2. ✅ Mypy type checking
3. ✅ Pytest tests

## Files Modified

1. `backend/app/core/oauth.py` - Removed duplicate type annotation on line 28

## No Breaking Changes

This change is purely a type annotation fix. It does not change any runtime behavior or API contracts.

## Verification

Run the following commands to verify:

```bash
# Type checking
cd backend
mypy app

# Linting
ruff check app tests

# Tests (requires dependencies installed)
pytest tests/ -v
```

All checks pass successfully.
