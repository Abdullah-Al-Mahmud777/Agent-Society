// Words too common to be useful for topic matching
const STOP_WORDS = new Set([
    "the", "and", "for", "that", "this", "with", "from", "have",
    "will", "want", "build", "make", "create", "idea", "about",
    "into", "more", "some", "been", "their", "they", "what",
]);

function topicKeywords(text) {
    return text
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
}

/**
 * Score and return the most relevant memories for an agent on a given topic.
 * Uses keyword overlap between the stored topic and the current business idea.
 */
export function retrieveRelevantMemories(memories, agentId, businessIdea, limit = 3) {
    const queryWords = new Set(topicKeywords(businessIdea));
    if (!queryWords.size) return [];

    return memories
        .filter((m) => m.agentId === agentId)
        .map((m) => ({
            ...m,
            score: topicKeywords(m.topic).filter((w) => queryWords.has(w)).length,
        }))
        .filter((m) => m.score > 0)
        .sort((a, b) => b.score - a.score || new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
}

/**
 * Format retrieved memories into a prompt-injectable block.
 * Prepended to the agent's system prompt so it reads its own past experience
 * before its role instructions.
 */
export function buildMemoryContext(memories) {
    if (!memories.length) return "";

    const lines = memories.map((m) => {
        if (m.type === "episodic") return `- Past debate: ${m.content}`;
        if (m.type === "relational") return `- About a colleague: ${m.content}`;
        return `- Prior conclusion: ${m.content}`;
    });

    return [
        "You have relevant memories from past debates. Draw on these when forming your analysis:",
        ...lines,
    ].join("\n");
}

/**
 * Extract new memory entries from a completed specialist agent result.
 * Returns 1-2 semantic memories per agent (recommendation + key risk).
 */
export function extractSpecialistMemories(agent, result, businessIdea, sessionId) {
    const entries = [];
    const topic = topicKeywords(businessIdea).join(" ");
    const now = new Date().toISOString();
    const snippet = businessIdea.slice(0, 80);

    if (result.recommendation && result.recommendation !== "N/A") {
        entries.push({
            id: `${sessionId}-${agent.id ?? agent.agentName}-rec`,
            agentId: agent.id ?? agent.agentName,
            agentName: agent.name ?? agent.agentName,
            type: "semantic",
            topic,
            content: `On "${snippet}": ${result.recommendation.slice(0, 300)}`,
            createdAt: now,
            sessionId,
        });
    }

    if (result.risks && result.risks !== "N/A") {
        entries.push({
            id: `${sessionId}-${agent.id ?? agent.agentName}-risk`,
            agentId: agent.id ?? agent.agentName,
            agentName: agent.name ?? agent.agentName,
            type: "semantic",
            topic,
            content: `Key risk I flagged for "${snippet}": ${result.risks.slice(0, 200)}`,
            createdAt: now,
            sessionId,
        });
    }

    return entries;
}

/**
 * Extract an episodic memory for the orchestrator after it synthesizes a debate.
 */
export function extractOrchestratorMemory(agent, final, businessIdea, sessionId) {
    const topic = topicKeywords(businessIdea).join(" ");
    const snippet = businessIdea.slice(0, 80);

    return {
        id: `${sessionId}-${agent.id ?? agent.agentName}-episodic`,
        agentId: agent.id ?? agent.agentName,
        agentName: agent.name ?? agent.agentName,
        type: "episodic",
        topic,
        content: `Led council on "${snippet}". Recommendation: ${(final.recommendation ?? "N/A").slice(0, 300)} Confidence: ${final.confidence ?? "unknown"}.`,
        createdAt: new Date().toISOString(),
        sessionId,
    };
}
