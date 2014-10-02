var svg = require('simplesvg');

module.exports = arrow;

arrow.intersectCircle = require('./lib/intersectCircle.js');

function arrow() {
  var dom = svg('path');
  var knownStrokes;
  var pendingStroke;
  var root;
  var defs;

  // svg element should have <defs> with all strokes defined in there.

  var api = {
    attr: attr,
    render: render,
    appendTo: appendTo
  };

  return api;

  function appendTo(svgDocument) {
    root = svgDocument;
    root.appendChild(dom);

    knownStrokes = root.arrowStroke;
    if (!root.arrowStroke) {
      // todo: this is not good. We are agumenting svg dom element
      knownStrokes = root.arrowStroke = {};
    }

    if (pendingStroke) {
      stroke(pendingStroke);
      pendingStroke = null;
    }
  }

  function attr(name, value) {
    // stroke requires special handling since we need to update defs as well
    if (name === 'stroke') {
      return stroke(value);
    }

    dom.attr(name, value);
    return api;
  }

  function render(from, to) {
    dom.attr('d', 'M ' + from.x + ' ' + from.y + ' L ' + to.x + ' ' + to.y);

    return api;
  }

  function stroke(color) {
    if (typeof color !== 'string' && typeof color !== 'number') {
      throw new Error('Storke color is expected to be a string or a number');
    }

    if (!root) {
      pendingStroke = color;
      return api;
    }

    var strokeDef = knownStrokes[color];
    if (!strokeDef) {
      knownStrokes[color] = strokeDef = defineStroke(color);
    }

    dom.attr('marker-end', 'url(#' + strokeDef + ')').attr('stroke', color);

    return api;
  }

  function defineStroke(color) {
    if (!defs) {
      defs = root.getElementsByTagName('defs')[0] || createDefs();
    }

    var id = 'triangle_' + normalizeColor(color);
    var marker = svg.compile([
      '<marker id="' + id + '"',
      '        viewBox="0 0 10 10"',
      '        refX="8" refY="5"',
      '        markerUnits="strokeWidth"',
      '        markerWidth="10" markerHeight="5"',
      '        orient="auto" style="fill: ' + color + '">',
      '  <path d="M 0 0 L 10 5 L 0 10 z"></path>',
      '</marker>'
    ].join('\n'));

    defs.appendChild(marker);

    return id;
  }

  function createDefs() {
    defs = svg('defs');
    root.appendChild(defs);
    return defs;
  }
}

function normalizeColor(color) {
  if (typeof color === 'number') {
    return color.toString(16);
  } else if (color[0] === '#') {
    return color.substr(1);
  }
  return color;
}
