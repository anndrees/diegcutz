export const STORY_WIDTH = 360;
export const STORY_HEIGHT = 640;
export function storyFitScale(width: number, height: number) {
  return Math.max(0, Math.min(width / STORY_WIDTH, height / STORY_HEIGHT));
}