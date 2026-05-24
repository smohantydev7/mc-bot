// Skill registry — loads, manages, and executes skills

const fs = require('fs');
const path = require('path');
const { setMcData } = require('./base');

const skills = new Map();
let currentSkill = null;     // { name, cancelled }
let currentPromise = null;

// Load all skill modules from this directory
function loadSkills(mcData) {
  setMcData(mcData);

  const dir = __dirname;
  const files = fs.readdirSync(dir).filter(
    f => f.endsWith('.js') && f !== 'index.js' && f !== 'base.js'
  );

  for (const file of files) {
    try {
      const skill = require(path.join(dir, file));
      if (skill.name && skill.execute) {
        skills.set(skill.name, skill);
        console.log(`[Skills] Loaded: ${skill.name}`);
      }
    } catch (err) {
      console.error(`[Skills] Failed to load ${file}: ${err.message}`);
    }
  }

  console.log(`[Skills] ${skills.size} skills ready.`);
}

// Execute a skill by name
async function executeSkill(skillName, bot, args, io) {
  const skill = skills.get(skillName);
  if (!skill) throw new Error(`Unknown skill: ${skillName}`);

  // Cancel any currently running skill
  cancelCurrentSkill(bot);

  // Set up cancellation context
  const state = { cancelled: false };
  currentSkill = { name: skillName, state };

  const ctx = {
    isCancelled: () => state.cancelled,
    getSkill: (name) => skills.get(name),
    emitLog: (message) => {
      const entry = { timestamp: new Date().toISOString(), message, type: 'log' };
      console.log(`[Skill:${skillName}] ${message}`);
      io.emit('bot:log', entry);
    },
    executeSubSkill: async (name, subArgs) => {
      const sub = skills.get(name);
      if (!sub) throw new Error(`Unknown sub-skill: ${name}`);
      // Sub-skills share the same cancellation state
      await sub.execute(bot, subArgs, io, ctx);
    }
  };

  try {
    currentPromise = skill.execute(bot, args, io, ctx);
    await currentPromise;
  } finally {
    if (currentSkill?.state === state) {
      currentSkill = null;
      currentPromise = null;
    }
  }
}

// Cancel the currently running skill
function cancelCurrentSkill(bot) {
  if (currentSkill) {
    currentSkill.state.cancelled = true;
    const skill = skills.get(currentSkill.name);
    if (skill?.cancel) {
      try { skill.cancel(bot); } catch (e) { /* ignore */ }
    }
    currentSkill = null;
    currentPromise = null;
  }
}

// Check if a skill is currently running
function isSkillRunning() {
  return currentSkill !== null;
}

// Get the name of the running skill
function currentSkillName() {
  return currentSkill?.name || null;
}

// Check if a name is a registered skill
function hasSkill(name) {
  return skills.has(name);
}

// Generate a prompt section describing all available skills for the AI
function getSkillsPrompt() {
  if (skills.size === 0) return '';

  const lines = ['You also have advanced skills:'];
  for (const [, skill] of skills) {
    const usage = skill.usage || skill.name;
    lines.push(`- ${usage} — ${skill.description}`);
  }
  return lines.join('\n');
}

module.exports = {
  loadSkills, executeSkill, cancelCurrentSkill,
  isSkillRunning, currentSkillName, hasSkill, getSkillsPrompt
};
