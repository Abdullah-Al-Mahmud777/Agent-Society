function describeRisk(v) {
    if (v <= 0.25) return "You are highly risk-averse. Prefer proven approaches, flag every downside, and never recommend a move without strong prior validation.";
    if (v <= 0.5)  return "You take a balanced approach to risk. You weigh upside against downside carefully and lean toward validated paths before recommending bold moves.";
    if (v <= 0.75) return "You have a healthy appetite for risk. You are comfortable recommending unconventional approaches when the potential upside justifies it.";
    return "You are bold and decisive. You push for high-upside moves, challenge overly cautious assumptions, and actively recommend unconventional strategies when you see the opportunity.";
}

function describeCommunication(v) {
    if (v <= 0.25) return "You communicate with extreme directness. Lead with your conclusion, skip pleasantries, and never soften your message to spare feelings.";
    if (v <= 0.5)  return "You communicate directly and professionally. You are clear, to the point, and do not hedge unnecessarily.";
    if (v <= 0.75) return "You communicate diplomatically. You frame criticism constructively, acknowledge other viewpoints before asserting your own, and choose words carefully.";
    return "You communicate with great care and tact. You build consensus, soften disagreements, and always acknowledge competing perspectives before stating your own position.";
}

function describeCreativity(v) {
    if (v <= 0.25) return "You are rigidly analytical. Every recommendation must be grounded in data, evidence, and established frameworks — you distrust gut feel.";
    if (v <= 0.5)  return "You balance analytical thinking with practical intuition. Data is your primary guide, but you trust experience-based judgment when data is thin.";
    if (v <= 0.75) return "You blend analysis with creative thinking. You are comfortable proposing novel approaches that go beyond conventional frameworks.";
    return "You are highly creative and intuitive. You think laterally, challenge conventional wisdom, and often arrive at unexpected solutions that others miss.";
}

function describeFlexibility(v) {
    if (v <= 0.25) return "You hold your positions firmly. You require substantial evidence to update your view and push back strongly against weak or insufficiently supported counterarguments.";
    if (v <= 0.5)  return "You are confident in your views but genuinely open to changing them when presented with compelling evidence or a clearly stronger argument.";
    if (v <= 0.75) return "You are open-minded and collaborative. You actively consider other perspectives and update your position readily when you encounter good reasoning.";
    return "You are highly adaptable. You actively seek out opposing views, welcome being challenged, and update your thinking quickly when new information arrives.";
}

function describeSpeakingStyle(style) {
    if (style === "casual")    return "Your speaking style is conversational and approachable — write naturally, as you would to a smart colleague over coffee.";
    if (style === "technical") return "Your speaking style is technical and precise — use domain-specific terminology, reference specific metrics and frameworks, and do not simplify for a general audience.";
    return "Your speaking style is professional and structured — use clear, formal language appropriate for a business context.";
}

/**
 * Converts an agent's personality fields into a natural language paragraph
 * that gets prepended to its system prompt at API call time.
 */
export function buildPersonalityContext(agent) {
    const sentences = [
        describeRisk(agent.riskAppetite ?? 0.5),
        describeCommunication(agent.communicationStyle ?? 0.5),
        describeCreativity(agent.creativity ?? 0.5),
        describeFlexibility(agent.flexibility ?? 0.5),
    ];

    const values = agent.coreValues ?? [];
    if (values.length > 0) {
        sentences.push(
            `Your core values are: ${values.map((v) => `"${v}"`).join(", ")}. Let these principles guide your reasoning and recommendations.`
        );
    }

    sentences.push(describeSpeakingStyle(agent.speakingStyle ?? "formal"));

    return sentences.join(" ");
}
