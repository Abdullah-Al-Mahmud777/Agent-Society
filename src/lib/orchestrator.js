import { extractAgentMentions, scoreAgentRelevance } from './utils';
import { executeAgent } from './agent-executor';
import { LLMProviderFactory } from './provider-factory';
import agentDatabase from './agent-database';

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
    // If agents not provided, fetch from database
    this.agents = agents || agentDatabase.getAll();
    this.selectedAgents = selectedAgents || [];
    this.apiKey = apiKey;
    this.defaultProvider = defaultProvider;
    this.defaultModel = defaultModel;
    this.executionStrategy = executionStrategy;
    this.agentMemories = agentMemories;
    this.useDatabase = !agents; // Track if we're using database or passed agents
  }

  // Step 1: Discover relevant agents
  discoverAgents(userRequest) {
    // Only refresh from database if we're in database mode
    if (this.useDatabase) {
      this.agents = agentDatabase.getAll();
      console.log("Using agents from database:", this.agents.length);
    } else {
      console.log("Using passed agents:", this.agents.length);
    }
    
    // If user has selected specific agents, use those directly
    if (this.selectedAgents && this.selectedAgents.length > 0) {
      console.log("Using user-selected agents:", this.selectedAgents.map(a => a.name));
      console.log("Available agents for matching:", this.agents.map(a => ({ id: a.id, name: a.name })));
      
      // Filter selected agents to ensure they're in the available agents list
      const availableSelectedAgents = this.selectedAgents.filter(selected => 
        this.agents.some(agent => agent.id === selected.id)
      );
      
      console.log("Matched selected agents:", availableSelectedAgents.map(a => a.name));
      
      if (availableSelectedAgents.length > 0) {
        console.log("Final selected agents count:", availableSelectedAgents.length);
        return availableSelectedAgents;
      } else {
        console.log("Selected agents not found in available agents, falling back to auto-discovery");
      }
    }
    
    // Get only enabled agents, if none, use all agents
    let enabledAgents = this.agents.filter(agent => agent.isEnabled);
    
    // If no enabled agents, use all available agents
    if (enabledAgents.length === 0) {
      console.log("No enabled agents found, using all agents");
      enabledAgents = this.agents;
    }
    
    if (enabledAgents.length === 0) {
      console.log("No agents available at all");
      return [];
    }

    console.log("Available agents:", enabledAgents.map(a => ({ name: a.name, enabled: a.isEnabled })));

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

    console.log("Agent scores:", scoredAgents.map(s => ({ name: s.agent.name, score: s.score })));

    // Filter agents with positive score, sort descending, take up to 5
    const relevantAgents = scoredAgents
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ agent }) => agent);
    
    // If no agents scored positively, return top agent anyway
    if (relevantAgents.length === 0 && scoredAgents.length > 0) {
      console.log("No agents scored positively, returning top agent");
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
      return Promise.all(
        relevantAgents.map(agent =>
          executeAgent({
            agent,
            userRequest,
            globalContext,
            apiKey: this.apiKey,
            agentMemory: this.agentMemories[agent.id],
          })
        )
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
    const finalResponse = await this.synthesizeFinalResponse(userRequest, agentOutputs);

    return {
      success: true,
      relevantAgents: relevantAgents.map(a => ({ id: a.id, name: a.name })),
      agentOutputs,
      finalResponse,
    };
  }
}
