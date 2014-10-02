var createArrow = require('../');
var arrow = createArrow();

arrow.attr('stroke', 'deepskyblue')
     .render({x: 0, y: 0}, {x: 42, y: 42});

arrow.appendTo(document.getElementById('scene'));
