import { NextResponse } from 'next/server';
import { Orchestrator } from '../../../../lib/orchestrator';
import { decryptApiKey } from '../../../../lib/encryption';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userRequest, agents, globalContext = '', executionStrategy = 'parallel', apiKey, encryptedApiKey, agentMemories = {}, selectedAgents = [] } = body;
    
    console.log("=== ORCHESTRATOR API DEBUG ===");
    console.log("User request:", userRequest);
    console.log("Agents received:", Array.isArray(agents) ? agents.length : "Not an array");
    console.log("Selected agents:", Array.isArray(selectedAgents) ? selectedAgents.length : "Not an array");
    console.log("Agents data:", agents);
    console.log("Execution strategy:", executionStrategy);
    
    // #region debug-point A:route-entry
    fetch("http://127.0.0.1:7777/event",{method:"POST",body:JSON.stringify({sessionId:"orchestrator-500",runId:"post-fix",hypothesisId:"A",location:"src/app/api/orchestrator/chat/route.js:8",msg:"[DEBUG] Orchestrator route received request",data:{hasUserRequest:Boolean(userRequest),agentCount:Array.isArray(agents)?agents.length:-1,selectedAgentCount:Array.isArray(selectedAgents)?selectedAgents.length:-1,executionStrategy,hasApiKey:Boolean(apiKey),hasEncryptedApiKey:Boolean(encryptedApiKey),agentProviders:Array.isArray(agents)?agents.map((agent)=>agent?.aiProvider??null):[]},ts:Date.now()})}).catch(()=>{});
    // #endregion

    // Validate required fields
    if (!userRequest) {
      return NextResponse.json({ error: 'User request is required' }, { status: 400 });
    }
    if (!Array.isArray(agents)) {
      return NextResponse.json({ error: 'Agents array is required' }, { status: 400 });
    }
    
    if (agents.length === 0) {
      console.log("WARNING: Empty agents array received");
      return NextResponse.json({ error: 'No agents provided. Please create agents first.' }, { status: 400 });
    }

    // Get API key from env or body (decrypt if needed)
    let finalApiKey = apiKey;
    if (!finalApiKey && encryptedApiKey) {
      finalApiKey = decryptApiKey(encryptedApiKey);
      // #region debug-point B:decryption-result
      fetch("http://127.0.0.1:7777/event",{method:"POST",body:JSON.stringify({sessionId:"orchestrator-500",runId:"post-fix",hypothesisId:"B",location:"src/app/api/orchestrator/chat/route.js:22",msg:"[DEBUG] Decrypted API key in orchestrator route",data:{decryptedLength:finalApiKey?.length??0,decryptedPrefix:finalApiKey?finalApiKey.slice(0,8):null},ts:Date.now()})}).catch(()=>{});
      // #endregion
    }
    if (!finalApiKey) {
      finalApiKey = process.env.OPENROUTER_API_KEY || process.env.QWEN_API_KEY;
    }
    if (!finalApiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const orchestrator = new Orchestrator({
      agents,
      apiKey: finalApiKey,
      executionStrategy,
      agentMemories,
      selectedAgents,
    });

    console.log("Starting orchestrator run...");
    const result = await orchestrator.run(userRequest, globalContext);
    console.log("Orchestrator run completed:", result);

    return NextResponse.json(result);
  } catch (error) {
    // #region debug-point E:route-error
    fetch("http://127.0.0.1:7777/event",{method:"POST",body:JSON.stringify({sessionId:"orchestrator-500",runId:"post-fix",hypothesisId:"E",location:"src/app/api/orchestrator/chat/route.js:45",msg:"[DEBUG] Orchestrator route threw error",data:{name:error?.name??null,message:error?.message??null,stackTop:error?.stack?.split("\n").slice(0,3).join(" | ")??null},ts:Date.now()})}).catch(()=>{});
    // #endregion
    console.error('Orchestrator API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
