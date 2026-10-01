/** Scene geometry in SVG units (320×180). Overlays convert these to percentages. */
export const GOAL = { left: 102, right: 218, top: 58, bottom: 100 };

/**
 * How the 320×180 scene fills its box. Phones give it a box taller than 16:9, and the SVG then
 * covers it and crops the stands at the sides, so the goal, keeper and taker come out about
 * twice as big (see .scene in styles.css). Browsers without container queries, which the goal
 * overlay needs to follow that crop, keep the whole view instead.
 */
export const FRAMING = typeof CSS !== 'undefined' && CSS.supports?.('container-type', 'size') ? 'xMidYMax slice' : 'xMidYMid meet';
