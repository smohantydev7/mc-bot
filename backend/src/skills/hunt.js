const { goals } = require('mineflayer-pathfinder');
const { getBestWeapon, sleepUnlessCancelled } = require('./base');

module.exports = {
  name: 'hunt',
  description: 'Find and kill mobs for food or XP (e.g., hunt cow, hunt zombie)',
  usage: 'hunt [mob_type] [count]',

  async execute(bot, args, io, ctx) {
    const mobType = args[0]?.toLowerCase() || null;
    const count = parseInt(args[1]) || 1;
    let killed = 0;

    // Equip best weapon
    const weapon = getBestWeapon(bot);
    if (weapon) {
      await bot.equip(weapon, 'hand');
      ctx.emitLog(`Equipped ${weapon.name}`);
    }

    for (let i = 0; i < count; i++) {
      if (ctx.isCancelled()) break;

      // Find target
      const target = bot.nearestEntity((entity) => {
        if (entity === bot.entity) return false;
        if (mobType) {
          return entity.name?.toLowerCase() === mobType;
        }
        // Default: hunt passive mobs for food
        return ['cow', 'pig', 'sheep', 'chicken', 'rabbit'].includes(entity.name?.toLowerCase());
      });

      if (!target) {
        ctx.emitLog(mobType ? `No ${mobType} found nearby.` : 'No animals found nearby.');
        break;
      }

      ctx.emitLog(`Hunting ${target.name}…`);

      // Chase and attack loop
      let targetDead = false;
      const onDeath = () => { targetDead = true; };
      target.once?.('death', onDeath);

      while (!targetDead && !ctx.isCancelled()) {
        if (!target.isValid) break;

        const dist = bot.entity.position.distanceTo(target.position);

        if (dist > 3.5) {
          // Move closer
          bot.pathfinder.setGoal(new goals.GoalFollow(target, 2), true);
          await sleepUnlessCancelled(500, ctx);
        } else {
          // In range — attack
          bot.pathfinder.setGoal(null);
          await bot.lookAt(target.position.offset(0, target.height * 0.5, 0));
          bot.attack(target);
          await sleepUnlessCancelled(600, ctx); // attack cooldown
        }
      }

      target.removeListener?.('death', onDeath);
      bot.pathfinder.setGoal(null);

      if (!ctx.isCancelled()) {
        killed++;
        ctx.emitLog(`Killed ${target.name}! (${killed}/${count})`);
        // Wait a moment to pick up drops
        await sleepUnlessCancelled(1000, ctx);
      }
    }

    ctx.emitLog(`Hunt done. Killed ${killed}.`);
  },

  cancel(bot) {
    bot.pathfinder.setGoal(null);
  }
};
