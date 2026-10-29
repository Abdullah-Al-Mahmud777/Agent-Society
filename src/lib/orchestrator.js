import { extractAgentMentions, scoreAgentRelevance } from './utils';
import { executeAgent } from './agent-executor';
import { LLMProviderFactory } from './provider-factory';

const DEFAULT_AGENT_CONCURRENCY = 3;

function agentConcurrency() {
  const configured = Number.parseInt(process.env.AI_MAX_CONCURRENT_AGENTS || "", 10);
  if (!Number.isFinite(configured)) return DEFAULT_AGENT_CONCURRENCY;
  return Math.min(8, Math.max(1, configured));
}

export async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  const workerCount = Math.min(Math.max(1, limit), items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

// Orchestrator class to handle the flow
export class Orchestrator {
  constructor({
    agents = null, // Optional: if not provided, will fetch from database
    apiKey,
    defaultProvider = 'openrouter',
    defaultModel = 'qwen/qwen3.7-plus',
    executionStrategy = 'parallel', // parallel or sequential
    agentMemories = {},
    selectedAgents = [], // User-selected agents to prioritize
  }) {
    this.agents = agents || [];
    this.selectedAgents = selectedAgents || [];
    this.apiKey = apiKey;
    this.defaultProvider = defaultProvider;
    this.defaultModel = defaultModel;
    this.executionStrategy = executionStrategy;
    this.agentMemories = agentMemories;
  }

  // Step 1: Discover relevant agents
  discoverAgents(userRequest) {
    // If user has selected specific agents, use those directly
    if (this.selectedAgents && this.selectedAgents.length > 0) {
      // Filter selected agents to ensure they're in the available agents list
      const selectedIds = this.selectedAgents
        .map((selected) => (typeof selected === "string" ? selected : selected?.id))
        .filter(Boolean);
      const availableSelectedAgents = this.agents.filter((agent) =>
        selectedIds.includes(agent.id)
      );
      
      if (availableSelectedAgents.length > 0) {
        return availableSelectedAgents;
      }
    }
    
    // Get only enabled agents, if none, use all agents
    let enabledAgents = this.agents.filter(agent => agent.isEnabled);
    
    // If no enabled agents, use all available agents
    if (enabledAgents.length === 0) {
      enabledAgents = this.agents;
    }
    
    if (enabledAgents.length === 0) {
      return [];
    }

    // First check for direct mentions
    const mentionedAgentIds = extractAgentMentions(userRequest, enabledAgents);
    if (mentionedAgentIds.length > 0) {
      return enabledAgents.filter(agent => mentionedAgentIds.includes(agent.id));
    }

    // Otherwise, score agents for relevance
    const scoredAgents = enabledAgents.map(agent => ({
      agent,
      score: scoreAgentRelevance(userRequest, agent),
    }));

    // Filter agents with positive score, sort descending, take up to 5
    const relevantAgents = scoredAgents
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ agent }) => agent);
    
    // If no agents scored positively, return top agent anyway
    if (relevantAgents.length === 0 && scoredAgents.length > 0) {
      return [scoredAgents[0].agent];
    }
    
    return relevantAgents;
  }

  // Step 2: Build execution plan
  buildExecutionPlan(relevantAgents) {
    return {
      strategy: this.executionStrategy,
      agents: relevantAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        order: this.executionStrategy === 'sequential' ? 0 : 0,
      })),
    };
  }

  // Step 3: Execute agents
  async executeAgents(relevantAgents, userRequest, globalContext = '') {
    if (this.executionStrategy === 'parallel') {
      return mapWithConcurrency(
        relevantAgents,
        agentConcurrency(),
        (agent) =>
          executeAgent({
            agent,
            userRequest,
            globalContext,
            apiKey: this.apiKey,
            agentMemory: this.agentMemories[agent.id],
          })
      );
    } else { // sequential
      const outputs = [];
      for (const agent of relevantAgents) {
        const output = await executeAgent({
          agent,
          userRequest,
          globalContext,
          previousAgentOutputs: outputs,
          apiKey: this.apiKey,
          agentMemory: this.agentMemories[agent.id],
        });
        outputs.push(output);
      }
      return outputs;
    }
  }

  // Step 4: Synthesize final response
  async synthesizeFinalResponse(userRequest, agentOutputs) {
    const systemPrompt = `You are an orchestrator agent. Your job is to synthesize the responses from multiple specialist agents into a single coherent answer.

Consider:
- The original user request
- The analysis and recommendations from each agent
- Combine the insights in a logical way
- Do NOT mention the agents by name (unless the user specifically asked)
- Make the final response clear and actionable`;

    const userPromptParts = [
      `## Original User Request`,
      userRequest,
      `\n## Agent Responses`,
    ];

    agentOutputs.forEach((output, i) => {
      if (output.success) {
        userPromptParts.push(`\n--- ${output.agentName} ---`);
        userPromptParts.push(output.content);
      }
    });

    const fullUserPrompt = userPromptParts.join('\n');

    const factory = new LLMProviderFactory({
      provider: this.defaultProvider,
      model: this.defaultModel,
      temperature: 0.7,
      maxTokens: 2048,
      apiKey: this.apiKey,
    });

    const client = factory.getClient();
    return client.generateContent(fullUserPrompt, {
      systemPrompt,
    });
  }

  // Main orchestration flow
  async run(userRequest, globalContext = '') {
    const relevantAgents = this.discoverAgents(userRequest);

    if (relevantAgents.length === 0) {
      return {
        success: false,
        error: 'No relevant agents found. Please create some agents first!',
      };
    }

    const agentOutputs = await this.executeAgents(relevantAgents, userRequest, globalContext);
    const successfulOutputs = agentOutputs.filter((output) => output.success);

    if (successfulOutputs.length === 0) {
      return {
        success: false,
        error:
          agentOutputs.map((output) => output.error).filter(Boolean).join(" | ") ||
          "All agents failed to produce a response.",
        relevantAgents: relevantAgents.map(a => ({ id: a.id, name: a.name })),
        agentOutputs,
      };
    }

    const finalResponse = await this.synthesizeFinalResponse(userRequest, successfulOutputs);

    return {
      success: true,
      relevantAgents: relevantAgents.map(a => ({ id: a.id, name: a.name })),
      agentOutputs,
      finalResponse,
    };
  }
}
