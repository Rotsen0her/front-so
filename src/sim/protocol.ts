/** Mensajes hilo principal -> hilo del proceso. */
export type ToThread =
  | { type: 'init'; text: string; th: number }
  | { type: 'run'; chars: number }
  | { type: 'pause' }
  | { type: 'resume' }

/** Mensajes hilo del proceso -> hilo principal. */
export type FromThread =
  | { type: 'char'; copied: number; char: string }
  | { type: 'slice'; copied: number }
