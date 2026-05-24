const { findFoodInInventory, getBestWeapon, sleepUnlessCancelled } = require('./base');

let surviveInterval = null;

module.exports = {
  name: 'survive',
  description: 'Toggle survival mode — auto-eat, auto-fight, auto-shelter',
  usage: 'survive',

  async execute(bot, args, io, ctx) {
    if (surviveInterval) {
      // Toggle off
      clearInterval(surviveInterval);
      surviveInterval = null;
      ctx.emitLog('Survival mode OFF.');
      return;
    }

    ctx.emitLog('Survival mode ON — monitoring health, food, and threats…');

    surviveInterval = setInterval(async () => {
      if (ctx.isCancelled() || !bot.entity) {
        clearInterval(surviveInterval);
        surviveInterval = null;
        return;
      }

      try {
        // Priority 1: Low health + has food → eat
        if (bot.health < 10 && bot.food > 6) {
          const food = findFoodInInventory(bot);
          if (food) {
            ctx.emitLog('Health low — eating…');
            await bot.equip(food, 'hand');
            await bot.consume();
          }
        }

        // Priority 2: Low food → eat if possible
        if (bot.food < 8) {
          const food = findFoodInInventory(bot);
          if (food) {
            ctx.emitLog('Getting hungry — eating…');
            await bot.equip(food, 'hand');
            await bot.consume();
          } else {
            ctx.emitLog('No food! Need to hunt.');
          }
        }

        // Priority 3: Hostile mob nearby → fight back
        const hostile = bot.nearestEntity((e) => {
          if (!e || e === bot.entity) return false;
          const dist = bot.entity.position.distanceTo(e.position);
          return dist < 8 && (e.type === 'hostile' || e.type === 'mob');
        });

        if (hostile) {
          const weapon = getBestWeapon(bot);
          if (weapon) await bot.equip(weapon, 'hand');

          const dist = bot.entity.position.distanceTo(hostile.position);
          if (dist < 4) {
            await bot.lookAt(hostile.position.offset(0, hostile.height * 0.5, 0));
            bot.attack(hostile);
            ctx.emitLog(`Fighting ${hostile.name}!`);
          }
        }
      } catch (err) {
        // Don't let errors kill the survival loop
      }
    }, 3000);

    // Keep the skill "running" so it can be cancelled
    while (!ctx.isCancelled()) {
      await sleepUnlessCancelled(2000, ctx);
    }

    clearInterval(surviveInterval);
    surviveInterval = null;
    ctx.emitLog('Survival mode OFF.');
  },

  cancel(bot) {
    if (surviveInterval) {
      clearInterval(surviveInterval);
      surviveInterval = null;
    }
  }
};
