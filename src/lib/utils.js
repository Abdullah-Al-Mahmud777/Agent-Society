// Extracts agent mentions from a message (like @AgentName)
export function extractAgentMentions(message, agents) {
  const mentionRegex = /@([a-zA-Z0-9_ ]+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(message)) !== null) {
    const mention = match[1].trim();
    const matchedAgent = agents.find(agent =>
      agent.name.toLowerCase().includes(mention.toLowerCase())
    );
    if (matchedAgent) {
      mentions.push(matchedAgent.id);
    }
  }

  return [...new Set(mentions)];
}

// Builds a simple relevance score for an agent given a user request
export function scoreAgentRelevance(userRequest, agent) {
  let score = 0;
  const requestLower = userRequest.toLowerCase();

  // Check expertise match
  if (agent.expertise?.toLowerCase().includes(requestLower)) {
    score += 50;
  } else {
    // Check for partial matches in expertise
    const expertiseWords = agent.expertise?.toLowerCase().split(/\s+/) || [];
    const requestWords = requestLower.split(/\s+/).filter(word => word.length > 3);
    expertiseWords.forEach(ew => {
      if (requestWords.includes(ew)) {
        score += 10;
      }
    });
  }

  // Check capabilities
  (agent.capabilities || []).forEach(cap => {
    if (requestLower.includes(cap.toLowerCase())) {
      score += 25;
    }
  });

  // Check description and role
  if (agent.description?.toLowerCase().includes(requestLower)) score += 20;
  if (agent.role?.toLowerCase().includes(requestLower)) score += 15;

  return score;
}
