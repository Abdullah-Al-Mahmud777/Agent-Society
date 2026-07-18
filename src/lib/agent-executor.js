import { LLMProviderFactory } from './provider-factory';

// Executes a single agent with the given parameters
export async function executeAgent({
  agent,
  userRequest,
  globalContext,
  previousAgentOutputs = [],
  apiKey,
  agentMemory = null,
}) {
  try {
    // Build the system prompt for this agent
    const systemPromptParts = [
      agent.systemPrompt,
      `\n\n## Agent Identity`,
      `Name: ${agent.name}`,
      `Role: ${agent.role}`,
      `Expertise: ${agent.expertise}`,
      `Capabilities: ${(agent.capabilities || []).join(', ')}`,
      `Goal: ${agent.goal}`,
      `\n\n## Output Format`,
      `Respond with the following sections clearly labeled:`,
      `1. **Analysis**: A high-level analysis of the user request and context.`,
      `2. **Reasoning**: Detailed reasoning behind your analysis and recommendations.`,
      `3. **Recommendations**: Clear, actionable recommendations.`,
      `4. **Confidence Score**: A single number between 0-100 indicating your confidence level.`,
      `5. **Follow-Up Questions**: Optional clarifying questions for the user (if needed).`,
    ];

    if (agent.coreValues?.length > 0) {
      systemPromptParts.push(`\n\n## Core Values\n${agent.coreValues.join(', ')}`);
    }

    const fullSystemPrompt = systemPromptParts.join('\n');

    // Build user prompt with context
    const userPromptParts = [
      `## User Request`,
      userRequest,
      `\n## Global Conversation Context`,
      globalContext || 'No prior context available.',
    ];

    if (previousAgentOutputs.length > 0) {
      userPromptParts.push(`\n## Previous Agent Outputs`);
      previousAgentOutputs.forEach((output, i) => {
        userPromptParts.push(`\n--- Agent ${i + 1} (${output.agentName}): ---`);
        userPromptParts.push(output.content);
      });
    }

    // Add agent's private memory
    if (agentMemory) {
      if (agentMemory.conversationHistory?.length > 0) {
        userPromptParts.push(`\n## Your Private Conversation History`);
        agentMemory.conversationHistory.slice(-10).forEach((entry, i) => {
          userPromptParts.push(`\n- ${entry.role}: ${entry.content}`);
        });
      }

      if (agentMemory.notes) {
        userPromptParts.push(`\n## Your Private Notes`);
        userPromptParts.push(agentMemory.notes);
      }
    }

    const fullUserPrompt = userPromptParts.join('\n');

    // Use provider factory to get the client
    const factory = new LLMProviderFactory({
      provider: agent.aiProvider,
      model: agent.model,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      apiKey,
    });

    const client = factory.getClient();
    const response = await client.generateContent(fullUserPrompt, {
      systemPrompt: fullSystemPrompt,
    });

    return {
      success: true,
      agentId: agent.id,
      agentName: agent.name,
      content: response,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error executing agent ${agent.name}:`, error);
    return {
      success: false,
      agentId: agent.id,
      agentName: agent.name,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
