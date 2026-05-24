const { getBotState } = require('./bot');

let provider = null; // 'ollama' or 'anthropic'
let anthropicClient = null;
let ollamaModel = null;
let ollamaUrl = null;

function initAI() {
  // Priority 1: Ollama (free, local)
  const ollamaHost = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2';

  // Priority 2: Anthropic API (paid)
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (anthropicKey) {
    const Anthropic = require('@anthropic-ai/sdk');
    anthropicClient = new Anthropic({ apiKey: anthropicKey });
    provider = 'anthropic';
    console.log('[AI] Claude API enabled — natural language mode active.');
    return true;
  }

  // Default to Ollama — we'll verify connection on first use
  ollamaUrl = ollamaHost;
  ollamaModel = model;
  provider = 'ollama';
  console.log(`[AI] Ollama mode — using model "${model}" at ${ollamaHost}`);
  console.log('[AI] Make sure Ollama is running: ollama serve');
  console.log(`[AI] Make sure model is pulled: ollama pull ${model}`);
  return true;
}

function isEnabled() {
  return provider !== null;
}

const SYSTEM_PROMPT = `You are a friendly Minecraft bot named AIWorker. A human is controlling you through a remote console. You're actually inside the Minecraft world right now — you can see, move, fight, and explore.

Talk like a chill friend — casual, short replies, no formal language. Use humor when it fits. You're a buddy hanging out in Minecraft together.

You can perform these actions by returning them in your JSON response:
- say <message> — send a chat message in the Minecraft world
- jump — jump once
- goto <x> <y> <z> — walk to specific coordinates
- follow <player> — follow a player around
- stop — stop all movement
- look — look around randomly
- attack — attack the nearest mob
- status — check your own health/food/position
- players — see who's online
- inventory — check what items you have
- auto — toggle autonomous wandering mode

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code blocks, just raw JSON.

Response format:
{"action": "the command to execute, or null if just chatting", "reply": "your friendly response to the human"}

Examples:

User: "hey whats up"
{"action": null, "reply": "Hey! Just vibing in this world. What do you need?"}

User: "how are you doing"
{"action": "status", "reply": "Let me check... I'm at full health and feeling good!"}

User: "go to 100 64 200"
{"action": "goto 100 64 200", "reply": "On my way! Heading there now."}

User: "can you follow Steve"
{"action": "follow Steve", "reply": "Sure thing, I'll stick with Steve!"}

User: "stop right there"
{"action": "stop", "reply": "Alright, I'm staying put."}

User: "what do you have on you"
{"action": "inventory", "reply": "Lemme check my pockets..."}

User: "punch something"
{"action": "attack", "reply": "Time to throw hands!"}

User: "who else is here"
{"action": "players", "reply": "Let me see who's around..."}

User: "say hello to everyone"
{"action": "say hello everyone!", "reply": "Done! Said hi in chat for ya."}

User: "just walk around and explore"
{"action": "auto", "reply": "Cool, I'll just wander around and see what's out here."}

User: "do a little jump"
{"action": "jump", "reply": "Boing!"}

User: "look around you"
{"action": "look", "reply": "Looking around to see what's nearby..."}`;

async function interpretWithOllama(userMessage, stateContext) {
  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ollamaModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + stateContext },
        { role: 'user', content: userMessage }
      ],
      stream: false,
      format: 'json'
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return JSON.parse(data.message.content.trim());
}

async function interpretWithAnthropic(userMessage, stateContext) {
  const response = await anthropicClient.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: SYSTEM_PROMPT + stateContext,
    messages: [{ role: 'user', content: userMessage }]
  });

  return JSON.parse(response.content[0].text.trim());
}

async function interpret(userMessage) {
  if (!provider) return null;

  const botState = getBotState();
  const stateContext = botState.online
    ? `\n\nMy current state: HP ${botState.health}/20, Food ${botState.food}/20, Position: ${botState.position.x}, ${botState.position.y}, ${botState.position.z}, Dimension: ${botState.dimension}`
    : '\n\nI am currently not connected to any Minecraft server.';

  try {
    if (provider === 'ollama') {
      return await interpretWithOllama(userMessage, stateContext);
    } else {
      return await interpretWithAnthropic(userMessage, stateContext);
    }
  } catch (err) {
    console.error(`[AI] ${provider} error:`, err.message);
    return null;
  }
}

module.exports = { initAI, isEnabled, interpret };
