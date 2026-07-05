// Tiny classnames joiner — filters falsy values and joins with spaces.
// No external dependency; sufficient for token-based styling where
// class conflicts are rare by design.
export function cn(...classes) {
    return classes.filter(Boolean).join(" ");
}
