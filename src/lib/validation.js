export function validationFailure(issues) {
    const error = new Error(issues[0]?.message || "Invalid input");
    error.name = "ValidationError";
    error.issues = issues;
    error.flatten = () => {
        const fieldErrors = {};
        const formErrors = [];
        for (const issue of issues) {
            const field = issue.path?.[0];
            if (field) {
                if (!fieldErrors[field]) fieldErrors[field] = [];
                fieldErrors[field].push(issue.message);
            } else {
                formErrors.push(issue.message);
            }
        }
        return { formErrors, fieldErrors };
    };
    return { success: false, error };
}

export function validationSuccess(data) {
    return { success: true, data };
}

export function parseWithSchema(schema, value) {
    const result = schema.safeParse(value);
    if (!result.success) throw result.error;
    return result.data;
}

export function addIssue(issues, path, message) {
    issues.push({ path, message });
}

export function requiredString(issues, value, path, label, max, { trim = true } = {}) {
    if (typeof value !== "string") {
        addIssue(issues, [path], `${label} is required`);
        return null;
    }
    const next = trim ? value.trim() : value;
    if (!next) {
        addIssue(issues, [path], `${label} is required`);
        return null;
    }
    if (max && next.length > max) {
        addIssue(issues, [path], `${label} must be ${max} characters or less`);
        return null;
    }
    return next;
}

export function numberInRange(issues, value, path, label, min, max, { integer = false } = {}) {
    const next = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(next)) {
        addIssue(issues, [path], `${label} must be a number`);
        return null;
    }
    if (integer && !Number.isInteger(next)) {
        addIssue(issues, [path], `${label} must be a whole number`);
        return null;
    }
    if (next < min || next > max) {
        addIssue(issues, [path], `${label} must be between ${min} and ${max}`);
        return null;
    }
    return next;
}

export function optionalString(issues, value, path, label, max) {
    if (value === undefined || value === null) return undefined;
    return requiredString(issues, value, path, label, max);
}
