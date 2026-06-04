import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'profile/:username', renderMode: RenderMode.Server },
  { path: 'home', renderMode: RenderMode.Server },
  { path: 'admin', renderMode: RenderMode.Server },
  { path: 'messages', renderMode: RenderMode.Server },
  { path: 'messages/:username', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Prerender },
];
