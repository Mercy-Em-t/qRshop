# AGENT_GUIDELINES.md

## Purpose

This document defines rules for AI agents and contributors working in this repository.

---

## Development Principles

Agents must:

* write modular code
* follow React best practices
* keep components reusable
* avoid unnecessary dependencies

---

## Coding Standards

React guidelines

* functional components only
* use hooks for state management
* separate UI and logic

Naming conventions

```
Components: PascalCase
Functions: camelCase
Files: kebab-case
```

---

## Folder Rules

Components must go in:

```
src/components
```

Pages must go in:

```
src/pages
```

Utility functions must go in:

```
src/utils
```

---

## Performance Rules

Agents must ensure:

* minimal API calls
* lazy loading where possible
* efficient rendering

---

## Security Rules

Agents must implement:

QR session verification before menu access.

Menu page must not render if:

```
qrSession == null
```

---

## Dependency Rules

Agents should prioritize:

* lightweight libraries
* open-source tools
* stable packages

Avoid:

* heavy UI frameworks
* unnecessary SDKs

---

## Pull Request Requirements

All contributions must include:

* clear commit messages
* documentation updates if needed
* code comments for complex logic
