/**
 * The three photographs Beat 1 is built around.
 *
 * Until they exist, each slot falls back to physical artifacts — a flyposted
 * wall of Degens show posters that strips down to tape residue. The fallback is
 * honest: it is real printed matter from this artist's world, not an invented
 * photograph of a venue.
 *
 * To ship the photography, set the paths here. Nothing else changes: Beat 1
 * reads these three slots and renders a photograph wherever one is available.
 */
export interface RoomPlate {
  /** Path under `public/`, or `null` while the photograph does not exist. */
  src: string | null;
  alt: string;
  /** Bias the crop toward the part of the frame that carries the moment. */
  objectPosition: string;
}

export const ROOM_PLATES = {
  /** A. Packed room — dark intimate venue, hard flash, crowd energy. */
  packedRoom: {
    src: null,
    alt: "A packed, dark room during a Degens show",
    objectPosition: "50% 45%",
  },
  /** B. Show energy — stage light, hands, movement. */
  showEnergy: {
    src: null,
    alt: "Stage light and raised hands during a Degens show",
    objectPosition: "50% 40%",
  },
  /** C. After load-out — the same room once the audience has gone. */
  afterLoadOut: {
    src: null,
    alt: "The same venue after load-out, empty floor and stage glow",
    objectPosition: "50% 60%",
  },
} satisfies Record<string, RoomPlate>;

export type RoomPlateId = keyof typeof ROOM_PLATES;

export const ROOM_PHOTOGRAPHY_READY = Object.values(ROOM_PLATES).every(
  (plate) => plate.src !== null,
);
