import { Pipe, PipeTransform } from '@angular/core';
import { Marked } from 'marked';

const marked = new Marked({ gfm: true, breaks: true });
marked.use({
  renderer: {
    html() {
      return '';
    }
  }
});

@Pipe({ name: 'markdown', standalone: true })
export class MarkdownPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value?.trim()) return '';
    return marked.parse(value, { async: false }) as string;
  }
}
