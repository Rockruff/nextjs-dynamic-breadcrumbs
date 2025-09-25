# Breadcrumbs Made Simple

A lightweight and flexible way to create dynamic breadcrumbs in Next.js.

## Features

- **Per-Page Breadcrumbs:** Define a separate breadcrumb for each page instead of maintaining a full breadcrumb list manually; breadcrumbs are automatically chained based on your current location.

- **Automatic Link Generation:** Links are generated automatically, so restructuring your project won’t require manually updating breadcrumbs.

- **Dynamic Content:** Fetch and display dynamic data in your breadcrumbs using route parameters, just like in your pages.

- **Unstyled:** This library provides a hook instead of a prebuilt component, giving you full control over the appearance of your breadcrumbs.

## Installation

This package requires your Next.js project to use the **App Router** and be written in **TypeScript**, with pages and layouts defined as `page.tsx` and `layout.tsx`.

The package is currently under development and may not be fully stable. It is hosted on GitHub rather than npm.

```bash
npm install github:Rockruff/nextjs-dynamic-breadcrumbs
```

If you encounter dependency version issues, try updating Next.js and React:

```bash
npm install next react react-dom
```

## Usage

### 1. Update Next Config

Assume you want breadcrumbs for all pages under `/dashboard`. In `next.config.ts`:

```ts
import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";
import BreadcrumbGenerator from "nextjs-dynamic-breadcrumbs/generator";

function generateBreadCrumbs(phase: string, path: string) {
  // Run only in dev or build phases
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    // Prevent duplicate execution when Next.js reloads config multiple times
    if (process.env.__BREADCRUMBS_GENERATED__) return;
    const generator = new BreadcrumbGenerator(path);
    // Remove previously generated breadcrumb files to ensure a clean state
    generator.clean();
    // Generate new breadcrumb files (and watch for changes)
    generator.start();
    // Mark as executed so this runs only once per process
    process.env.__BREADCRUMBS_GENERATED__ = "true";
  }
}

export default (phase: string): NextConfig => {
  generateBreadCrumbs(phase, "app/dashboard");

  return {
    /* config options here */
  };
};
```

> ⚠️ **Warning:** This package uses [parallel routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes). Do **not** have a parallel route at `app/dashboard/@breadcrumbs`. The generator will overwrite this folder. Backup your code if unsure.

### 2. Update Layout

In `app/dashboard/layout.tsx`, accept the `breadcrumbs` parallel route:

```tsx
export default function ({
  children,
  breadcrumbs,
}: Readonly<{
  children: React.ReactNode;
  breadcrumbs: React.ReactNode;
}>) {
  return (
    <>
      <div className="flex items-center gap-2">{breadcrumbs}</div>
      {children}
    </>
  );
}
```

### 3. Create Breadcrumb for a Page

For any page you want a breadcrumb, create a `breadcrumb.tsx` alongside your `page.tsx`:

```tsx
"use client";

import Link from "next/link";
import useBreadcrumb from "nextjs-dynamic-breadcrumbs";

export default function (/* { params } */) {
  // You can accept `params` here just like in a regular page component.
  // This allows you to fetch data or render content dynamically based on route parameters.
  // Refer to: https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes
  // const { id } = React.use(params);

  // `href` contains the URL for the current page.
  const [href, isActive] = useBreadcrumb();

  // `isActive` is true if the current pathname matches `href`
  // This allows you to customize styles for active breadcrumbs
  const className = isActive ? "pointer-events-none underline" : "hover:underline";

  return (
    <div className="group contents text-sm">
      <Link href={href} className={className}>
        Display your link text here
      </Link>
      <span className="select-none group-last:hidden">&gt;</span>
    </div>
  );
}
```

### 4. Run Dev Server

```bash
npm run dev
```

The package watches for route changes with [chokidar](https://github.com/paulmillr/chokidar). Editing, moving, or deleting files in your app will trigger updates automatically. If something breaks, restarting the dev server usually resolves issues. Please report bugs to help improve the library.

## Example

A real project example can be found [here](https://github.com/Rockruff/easyread).

## Implementation Details

Next.js App Router layouts are inherited along route paths, making them ideal for chaining breadcrumbs.

This package works by:

1. Creating a parallel route named `@breadcrumbs` in the target directory.
2. Scanning for all `breadcrumb.tsx` files.
3. Automatically generating corresponding `layout.tsx` files that mirror your route structure.

Example:

```
app/dashboard/breadcrumb.tsx
  → app/dashboard/@breadcrumbs/layout.tsx

app/dashboard/settings/breadcrumb.tsx
  → app/dashboard/@breadcrumbs/settings/layout.tsx
```

When accessing `/dashboard/settings`, both the `layout.tsx` and `settings/layout.tsx` in `@breadcrumbs` are applied, resulting in a breadcrumb trail.

> You can inspect the generated code for a deeper understanding of the mechanism.
