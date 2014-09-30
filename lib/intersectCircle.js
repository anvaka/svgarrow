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
