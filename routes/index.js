var router = require('koa-router')();

router.get('/', async function (ctx, next) {
  ctx.state = {
    title: '啊，这个苍茫的世界！'
  };

  await ctx.render('index', {
  });
})

router.get('/foo', async function (ctx, next) {
  await ctx.render('index', {
    title: 'koa2 foo'
  });
});

module.exports = router;
