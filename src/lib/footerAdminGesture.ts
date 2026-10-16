export const FOOTER_ADMIN_SEQUENCE = ["year", "brand", "place"] as const;
export type FooterAdminPart = typeof FOOTER_ADMIN_SEQUENCE[number];

export class FooterAdminGesture {
  private step = 0;
  private pending: { part: FooterAdminPart; pointerId: number; x: number; y: number } | null = null;

  reset() {
    this.step = 0;
    this.pending = null;
  }

  down(part: FooterAdminPart | null, pointerId: number, x: number, y: number) {
    if (this.pending || part !== FOOTER_ADMIN_SEQUENCE[this.step]) {
      this.reset();
      return;
    }
    this.pending = { part, pointerId, x, y };
  }

  move(pointerId: number, x: number, y: number) {
    if (this.pending && (this.pending.pointerId !== pointerId || this.pending.x !== x || this.pending.y !== y)) {
      this.reset();
    }
  }

  up(part: FooterAdminPart | null, pointerId: number, x: number, y: number): boolean {
    const pending = this.pending;
    if (!pending || pending.part !== part || pending.pointerId !== pointerId || pending.x !== x || pending.y !== y) {
      this.reset();
      return false;
    }
    this.pending = null;
    this.step += 1;
    if (this.step !== FOOTER_ADMIN_SEQUENCE.length) return false;
    this.reset();
    return true;
  }
}