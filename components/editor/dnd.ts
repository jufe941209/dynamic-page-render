/** What is being dragged in the editor (native HTML5 drag & drop, no library). */
export type DragItem =
  | { kind: "new"; blockType: string }
  | { kind: "move"; from: number };

/** Required by Firefox to start a drag; the payload itself is read from React state. */
export function startDrag(event: React.DragEvent, payload: string, effect: "copy" | "move") {
  event.dataTransfer?.setData("text/plain", payload);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = effect;
}
