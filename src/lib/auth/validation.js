import {
    addIssue,
    parseWithSchema,
    requiredString,
    validationFailure,
    validationSuccess,
} from "../validation.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

function emailError(value) {
    if (typeof value !== "string" || !value.trim()) return "Email is required";
    const email = value.trim().toLowerCase();
    if (email.length > 254) return "Email is too long";
    if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address";
    return null;
}

function passwordError(value) {
    if (typeof value !== "string" || value.length < PASSWORD_MIN) {
        return `Password must be at least ${PASSWORD_MIN} characters`;
    }
    if (value.length > PASSWORD_MAX) {
        return `Password must be ${PASSWORD_MAX} characters or fewer`;
    }
    if (!/[A-Za-z]/.test(value)) return "Password must include a letter";
    if (!/[0-9]/.test(value)) return "Password must include a number";
    return null;
}

function objectInput(input) {
    return input && typeof input === "object" && !Array.isArray(input) ? input : {};
}

export const registerSchema = {
    safeParse(input) {
        const source = objectInput(input);
        const issues = [];
        const displayName = requiredString(
            issues,
            source.displayName,
            "displayName",
            "Name",
            80
        );
        if (displayName && displayName.length < 2) {
            addIssue(issues, ["displayName"], "Name must be at least 2 characters");
        }

        const emailMessage = emailError(source.email);
        if (emailMessage) addIssue(issues, ["email"], emailMessage);

        const passwordMessage = passwordError(source.password);
        if (passwordMessage) addIssue(issues, ["password"], passwordMessage);

        if (issues.length) return validationFailure(issues);

        return validationSuccess({
            displayName,
            email: source.email.trim().toLowerCase(),
            password: source.password,
        });
    },
    parse(input) {
        return parseWithSchema(this, input);
    },
};

export const loginSchema = {
    safeParse(input) {
        const source = objectInput(input);
        const issues = [];
        const emailMessage = emailError(source.email);
        if (emailMessage) addIssue(issues, ["email"], emailMessage);

        if (typeof source.password !== "string" || !source.password) {
            addIssue(issues, ["password"], "Password is required");
        } else if (source.password.length > PASSWORD_MAX) {
            addIssue(issues, ["password"], `Password must be ${PASSWORD_MAX} characters or fewer`);
        }

        if (issues.length) return validationFailure(issues);

        return validationSuccess({
            email: source.email.trim().toLowerCase(),
            password: source.password,
        });
    },
    parse(input) {
        return parseWithSchema(this, input);
    },
};

export const settingsSchema = {
    safeParse(input) {
        const source = objectInput(input);
        const issues = [];
        const data = {};

        if (source.theme !== undefined) {
            if (!["dark", "light"].includes(source.theme)) {
                addIssue(issues, ["theme"], "Theme must be dark or light");
            } else {
                data.theme = source.theme;
            }
        }

        if (source.preferences !== undefined) {
            if (
                !source.preferences ||
                typeof source.preferences !== "object" ||
                Array.isArray(source.preferences)
            ) {
                addIssue(issues, ["preferences"], "Preferences must be an object");
            } else {
                data.preferences = source.preferences;
            }
        }

        return issues.length ? validationFailure(issues) : validationSuccess(data);
    },
    parse(input) {
        return parseWithSchema(this, input);
    },
};

export function firstValidationError(error) {
    if (!error?.issues?.length) return "Invalid input";
    return error.issues[0]?.message || "Invalid input";
}
