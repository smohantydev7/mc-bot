const { findFoodInInventory, sleepUnlessCancelled } = require('./base');

module.exports = {
  name: 'eat',
  description: 'Eat food from inventory to restore hunger',
  usage: 'eat [food_name]',

  async execute(bot, args, io, ctx) {
    let food;

    if (args.length > 0) {
      const name = args.join('_');
      food = bot.inventory.items().find(i => i.name.includes(name));
      if (!food) {
        ctx.emitLog(`Don't have any ${args.join(' ')} to eat.`);
        return;
      }
    } else {
      food = findFoodInInventory(bot);
      if (!food) {
        ctx.emitLog('No food in inventory! Need to hunt or farm.');
        return;
      }
    }

    ctx.emitLog(`Eating ${food.name}…`);
    await bot.equip(food, 'hand');
    await bot.consume();
    ctx.emitLog(`Ate ${food.name}. Food level: ${bot.food}/20`);
  },

  cancel(bot) {
    try { bot.deactivateItem(); } catch (e) { /* ignore */ }
  }
};
