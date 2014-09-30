var createArrow = require('../');
var scene = document.getElementById('scene');

var arrow = createArrow(scene);
arrow.stroke('deepskyblue')
     .render({x: 0, y: 0}, {x: 42, y: 42});

scene.appendChild(arrow);

