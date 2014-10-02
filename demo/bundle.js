(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var createArrow = require('../');
var arrow = createArrow();

arrow.attr('stroke', 'deepskyblue')
     .render({x: 0, y: 0}, {x: 42, y: 42});

arrow.appendTo(document.getElementById('scene'));

},{"../":2}],2:[function(require,module,exports){
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

},{"./lib/intersectCircle.js":3,"simplesvg":4}],3:[function(require,module,exports){
/**
 * Finds intersection point between arrow and a circle.
 *
 * @param {Point} start coordinate of an arrow
 * @param {Point} end coordinate of an arrow, and center of a circle
 * @param {Number} circleRadius radius of a circle
 *
 * @return {Point} x, y - where arrow intersects a circle
 */
module.exports = function intersectCircle(start, end, circleRadius) {
  var width = end.x - start.x;
  var height = end.y - start.y;
  var angle = Math.atan2(height, width);
  var dx = Math.cos(angle) * circleRadius;
  var dy = Math.sin(angle) * circleRadius;

  return {
    x: end.x - dx,
    y: end.y - dy
  };
};

},{}],4:[function(require,module,exports){
module.exports = svg;

svg.compile = require('./lib/compile');

var compileTemplate = svg.compileTemplate = require('./lib/compileTemplate');

var domEvents = require('add-event-listener');

var svgns = "http://www.w3.org/2000/svg";
var xlinkns = "http://www.w3.org/1999/xlink";

function svg(element) {
  var svgElement = element;

  if (typeof element === "string") {
    svgElement = window.document.createElementNS(svgns, element);
  } else if (element.simplesvg) {
    return element;
  }

  var compiledTempalte;

  svgElement.simplesvg = true; // this is not good, since we are monkey patching svg
  svgElement.attr = attr;
  svgElement.append = append;

  // add easy eventing
  svgElement.on = on;
  svgElement.off = off;

  // data binding:
  svgElement.dataSource = dataSource;

  return svgElement;

  function dataSource(model) {
    if (!compiledTempalte) compiledTempalte = compileTemplate(svgElement);
    compiledTempalte.link(model);
  }

  function on(name, cb, useCapture) {
    domEvents.addEventListener(svgElement, name, cb, useCapture);
    return svgElement;
  }

  function off(name, cb, useCapture) {
    domEvents.removeEventListener(svgElement, name, cb, useCapture);
    return svgElement;
  }

  function append(child) {
    svgElement.appendChild(svg(child));

    return child;
  }

  function attr(name, value) {
    if (arguments.length === 2) {
      if (value !== null) {
        svgElement.setAttributeNS(null, name, value);
      } else {
        svgElement.removeAttributeNS(null, name);
      }

      return svgElement;
    }

    return svgElement.getAttributeNS(null, name);
  }
}

},{"./lib/compile":5,"./lib/compileTemplate":6,"add-event-listener":7}],5:[function(require,module,exports){
var parser = new DOMParser();
var svg = require('../');

module.exports = compile;

function compile(svgText) {
  try {
    svgText = addNamespaces(svgText);
    return svg(parser.parseFromString(svgText, "text/xml").documentElement);
  } catch (e) {
    throw e;
  }
}

function addNamespaces(text) {
  if (!text) return;

  var namespaces = 'xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg"';
  var match = text.match(/^<\w+/);
  if (match) {
    var tagLength = match[0].length;
    return text.substr(0, tagLength) + ' ' + namespaces + ' ' + text.substr(tagLength);
  } else {
    throw new Error('Cannot parse input text: invalid xml?');
  }
}

},{"../":4}],6:[function(require,module,exports){
module.exports = template;

var BINDING_EXPR = /{{(.+?)}}/;

function template(domNode) {
  var allBindings = Object.create(null);
  extractAllBindings(domNode, allBindings);

  return {
    link: function(model) {
      Object.keys(allBindings).forEach(function(key) {
        var setter = allBindings[key];
        setter.forEach(changeModel);
      });

      function changeModel(setter) {
        setter(model);
      }
    }
  };
}

function extractAllBindings(domNode, allBindings) {
  var nodeType = domNode.nodeType;
  var typeSupported = (nodeType === 1) || (nodeType === 3);
  if (!typeSupported) return;
  var i;
  if (domNode.hasChildNodes()) {
    var domChildren = domNode.childNodes;
    for (i = 0; i < domChildren.length; ++i) {
      extractAllBindings(domChildren[i], allBindings);
    }
  }

  if (nodeType === 3) { // text:
    bindTextContent(domNode, allBindings);
  }

  if (!domNode.attributes) return; // this might be a text. need to figure out what to do in that case

  var attrs = domNode.attributes;
  for (i = 0; i < attrs.length; ++i) {
    bindDomAttribute(attrs[i], domNode, allBindings);
  }
}

function bindDomAttribute(domAttribute, element, allBindings) {
  var value = domAttribute.value;
  if (!value) return; // unary attribute?

  var modelNameMatch = value.match(BINDING_EXPR);
  if (!modelNameMatch) return; // does not look like a binding

  var attrName = domAttribute.localName;
  var modelPropertyName = modelNameMatch[1];
  var isSimpleValue = modelPropertyName.indexOf('.') < 0;

  if (!isSimpleValue) throw new Error('simplesvg currently does not support nested bindings');

  var propertyBindings = allBindings[modelPropertyName];
  if (!propertyBindings) {
    propertyBindings = allBindings[modelPropertyName] = [attributeSetter];
  } else {
    propertyBindings.push(attributeSetter);
  }

  function attributeSetter(model) {
    element.setAttributeNS(null, attrName, model[modelPropertyName]);
  }
}
function bindTextContent(element, allBindings) {
  // todo reduce duplication
  var value = element.nodeValue;
  if (!value) return; // unary attribute?

  var modelNameMatch = value.match(BINDING_EXPR);
  if (!modelNameMatch) return; // does not look like a binding

  var modelPropertyName = modelNameMatch[1];
  var isSimpleValue = modelPropertyName.indexOf('.') < 0;

  var propertyBindings = allBindings[modelPropertyName];
  if (!propertyBindings) {
    propertyBindings = allBindings[modelPropertyName] = [textSetter];
  } else {
    propertyBindings.push(textSetter);
  }

  function textSetter(model) {
    element.nodeValue = model[modelPropertyName];
  }
}

},{}],7:[function(require,module,exports){
addEventListener.removeEventListener = removeEventListener
addEventListener.addEventListener = addEventListener

module.exports = addEventListener

var Events = null

function addEventListener(el, eventName, listener, useCapture) {
  Events = Events || (
    document.addEventListener ?
    {add: stdAttach, rm: stdDetach} :
    {add: oldIEAttach, rm: oldIEDetach}
  )
  
  return Events.add(el, eventName, listener, useCapture)
}

function removeEventListener(el, eventName, listener, useCapture) {
  Events = Events || (
    document.addEventListener ?
    {add: stdAttach, rm: stdDetach} :
    {add: oldIEAttach, rm: oldIEDetach}
  )
  
  return Events.rm(el, eventName, listener, useCapture)
}

function stdAttach(el, eventName, listener, useCapture) {
  el.addEventListener(eventName, listener, useCapture)
}

function stdDetach(el, eventName, listener, useCapture) {
  el.removeEventListener(eventName, listener, useCapture)
}

function oldIEAttach(el, eventName, listener, useCapture) {
  if(useCapture) {
    throw new Error('cannot useCapture in oldIE')
  }

  el.attachEvent('on' + eventName, listener)
}

function oldIEDetach(el, eventName, listener, useCapture) {
  el.detachEvent('on' + eventName, listener)
}

},{}]},{},[1])