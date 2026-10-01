/** The poses: a kicker seen from behind, a keeper from the front, the ball and a trophy. */
import { SLOT, figure, type Canvas } from './grid';

const { BOOTS, DARK, EYE, GLOVES, HAIR, SHIRT, SHIRT2, SHORTS, SHORTS2, SKIN, SKIN2, SOCKS, TRIM, WHITE } = SLOT;

function head(c: Canvas, dx = 0, dy = 0, nape = true): void {
  c.rect(4 + dx, 0 + dy, 6, 4, HAIR);
  if (nape) c.rect(5 + dx, 4 + dy, 4, 1, SKIN2);
  c.set(3 + dx, 2 + dy, SKIN);
  c.set(10 + dx, 2 + dy, SKIN);
  c.rect(6 + dx, 5, 2, 1, SKIN);
}

function torso(c: Canvas, dx = 0): void {
  c.rect(2 + dx, 6, 10, 7, SHIRT);
  c.rect(11 + dx, 6, 1, 7, SHIRT2);
  c.rect(5 + dx, 6, 4, 1, TRIM);
}

function shorts(c: Canvas, dx = 0): void {
  c.rect(3 + dx, 13, 8, 3, SHORTS);
  c.rect(10 + dx, 13, 1, 3, SHORTS2);
  c.rect(6 + dx, 15, 2, 1, 0);
}

function leg(c: Canvas, x: number, lift = 0): void {
  const bottom = 24 - lift;
  c.rect(x, 16, 3, 2, SKIN);
  c.rect(x, 18, 3, 1, TRIM);
  c.rect(x, 19, 3, bottom - 21, SOCKS);
  c.rect(x, bottom - 2, 3, 2, BOOTS);
}

function arm(c: Canvas, x: number, top: number, len: number, cuff = true): void {
  c.rect(x, top, 2, 2, SHIRT);
  if (cuff) c.rect(x, top + 2, 2, 1, TRIM);
  c.rect(x, top + 3, 2, len, SKIN);
  c.rect(x, top + 3 + len, 2, 1, SKIN2);
}

export const kickerIdle = () =>
  figure(14, 24, (c) => {
    head(c);
    torso(c);
    arm(c, 0, 6, 3);
    arm(c, 12, 6, 3);
    shorts(c);
    leg(c, 3);
    leg(c, 8);
  });

export const kickerRun = () =>
  figure(14, 24, (c) => {
    head(c);
    torso(c);
    arm(c, 0, 6, 2);
    arm(c, 12, 7, 3);
    shorts(c);
    leg(c, 3, 3);
    leg(c, 8);
  });

export const kickerStrike = () =>
  figure(18, 24, (c) => {
    head(c, 2);
    torso(c, 2);
    c.rect(2, 6, 2, 2, SHIRT);
    c.rect(0, 7, 2, 2, SKIN);
    c.rect(14, 6, 2, 3, SHIRT);
    c.rect(16, 8, 2, 2, SKIN);
    shorts(c, 2);
    leg(c, 5);
    c.rect(10, 16, 3, 1, SKIN);
    c.rect(11, 17, 3, 1, SKIN);
    c.rect(12, 18, 3, 1, TRIM);
    c.rect(13, 19, 3, 1, SOCKS);
    c.rect(14, 20, 3, 1, SOCKS);
    c.rect(15, 21, 3, 2, BOOTS);
  });

export const kickerCheer = () =>
  figure(14, 24, (c) => {
    head(c);
    torso(c);
    c.rect(0, 4, 2, 3, SHIRT);
    c.rect(12, 4, 2, 3, SHIRT);
    c.rect(0, 1, 2, 3, SKIN);
    c.rect(12, 1, 2, 3, SKIN);
    c.rect(0, 0, 2, 1, SKIN2);
    c.rect(12, 0, 2, 1, SKIN2);
    shorts(c);
    leg(c, 2);
    leg(c, 9);
  });

export const kickerSad = () =>
  figure(14, 24, (c) => {
    head(c, 0, 1, false);
    torso(c);
    arm(c, 1, 7, 4, false);
    arm(c, 11, 7, 4, false);
    shorts(c);
    leg(c, 3);
    leg(c, 8);
  });

function face(c: Canvas, x: number, y: number): void {
  c.rect(x, y, 6, 2, HAIR);
  c.rect(x, y + 2, 6, 4, SKIN);
  c.set(x, y + 2, HAIR);
  c.set(x + 5, y + 2, HAIR);
  c.set(x + 1, y + 3, EYE);
  c.set(x + 4, y + 3, EYE);
  c.rect(x + 1, y + 5, 4, 1, SKIN2);
}

export const keeperReady = () =>
  figure(16, 24, (c) => {
    face(c, 5, 0);
    c.rect(7, 6, 2, 1, SKIN);
    c.rect(4, 7, 8, 7, SHIRT);
    c.rect(11, 7, 1, 7, SHIRT2);
    c.rect(6, 7, 4, 1, TRIM);
    c.rect(2, 7, 2, 3, SHIRT);
    c.rect(12, 7, 2, 3, SHIRT);
    c.rect(1, 9, 2, 3, SHIRT);
    c.rect(13, 9, 2, 3, SHIRT);
    c.rect(0, 12, 3, 2, GLOVES);
    c.rect(13, 12, 3, 2, GLOVES);
    c.rect(5, 14, 6, 2, SHORTS);
    c.rect(10, 14, 1, 2, SHORTS2);
    c.rect(4, 16, 2, 2, SKIN);
    c.rect(10, 16, 2, 2, SKIN);
    c.rect(3, 18, 3, 4, SOCKS);
    c.rect(10, 18, 3, 4, SOCKS);
    c.rect(2, 22, 4, 2, BOOTS);
    c.rect(10, 22, 4, 2, BOOTS);
  });

export const keeperStretch = () =>
  figure(16, 26, (c) => {
    c.rect(0, 0, 3, 2, GLOVES);
    c.rect(13, 0, 3, 2, GLOVES);
    c.rect(1, 2, 2, 5, SHIRT);
    c.rect(13, 2, 2, 5, SHIRT);
    face(c, 5, 2);
    c.rect(7, 8, 2, 1, SKIN);
    c.rect(3, 7, 10, 2, SHIRT);
    c.rect(4, 9, 8, 7, SHIRT);
    c.rect(11, 9, 1, 7, SHIRT2);
    c.rect(6, 9, 4, 1, TRIM);
    c.rect(5, 16, 6, 2, SHORTS);
    c.rect(5, 18, 2, 2, SKIN);
    c.rect(9, 18, 2, 2, SKIN);
    c.rect(5, 20, 2, 4, SOCKS);
    c.rect(9, 20, 2, 4, SOCKS);
    c.rect(4, 24, 3, 2, BOOTS);
    c.rect(9, 24, 3, 2, BOOTS);
  });

/** Full-stretch dive to the keeper's left (screen right). Mirrored for the other side. */
export const keeperDive = () =>
  figure(27, 11, (c) => {
    c.rect(0, 1, 2, 3, BOOTS);
    c.rect(0, 6, 2, 3, BOOTS);
    c.rect(2, 1, 4, 3, SOCKS);
    c.rect(2, 6, 4, 3, SOCKS);
    c.rect(6, 2, 1, 2, SKIN);
    c.rect(6, 6, 1, 2, SKIN);
    c.rect(7, 2, 3, 6, SHORTS);
    c.rect(10, 2, 8, 7, SHIRT);
    c.rect(10, 8, 8, 1, SHIRT2);
    c.rect(18, 4, 1, 3, SKIN);
    c.rect(19, 3, 3, 5, SKIN);
    c.rect(22, 3, 2, 5, HAIR);
    c.set(20, 4, EYE);
    c.set(20, 6, EYE);
    c.rect(18, 1, 6, 2, SHIRT);
    c.rect(18, 8, 6, 2, SHIRT);
    c.rect(24, 0, 3, 3, GLOVES);
    c.rect(24, 8, 3, 3, GLOVES);
  });

export const ball = () =>
  figure(7, 7, (c) => {
    c.rect(2, 0, 3, 1, WHITE);
    c.rect(1, 1, 5, 1, WHITE);
    c.rect(0, 2, 7, 3, WHITE);
    c.rect(1, 5, 5, 1, WHITE);
    c.rect(2, 6, 3, 1, WHITE);
    // centre pentagon
    c.rect(2, 1, 3, 2, DARK);
    c.set(3, 3, DARK);
    // edge patches
    c.rect(0, 3, 1, 2, DARK);
    c.rect(6, 3, 1, 2, DARK);
    c.set(2, 5, DARK);
    c.set(4, 5, DARK);
  });

export const trophy = () =>
  figure(12, 20, (c) => {
    c.rect(2, 0, 8, 1, WHITE);
    c.rect(2, 1, 8, 6, SHIRT);
    c.rect(3, 7, 6, 1, SHIRT);
    c.rect(4, 8, 4, 1, SHIRT);
    c.rect(5, 9, 2, 4, SHIRT);
    c.rect(3, 13, 6, 2, SHIRT);
    c.rect(2, 15, 8, 3, SHORTS);
    c.rect(0, 1, 2, 1, SHIRT);
    c.rect(0, 2, 1, 3, SHIRT);
    c.rect(0, 5, 2, 1, SHIRT);
    c.rect(10, 1, 2, 1, SHIRT);
    c.rect(11, 2, 1, 3, SHIRT);
    c.rect(10, 5, 2, 1, SHIRT);
    c.rect(8, 1, 2, 6, SHIRT2);
    c.rect(6, 9, 1, 4, SHIRT2);
    c.rect(3, 1, 1, 4, WHITE);
    c.rect(3, 16, 6, 1, SHIRT);
  });
