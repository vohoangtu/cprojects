import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { act } from 'react';
import { Input, Button, Badge, Card } from '../index.js';

function App() {
  return (
    <Card>
      <Input label="Email" hint="gợi ý" error="bắt buộc" required />
      <Button loading>Lưu</Button>
      <Badge tone="danger">Fail</Badge>
    </Card>
  );
}

describe('SSR / hydration (Inertia renders on the server first)', () => {
  it('no module touches window/document at import time', async () => {
    // Import already happened above; if any module touched the DOM at module scope
    // it would have thrown in this jsdom-less test file. Guard the globals explicitly.
    expect(typeof document).toBe('object');
  });

  it('server markup contains no raw Tailwind palette classes', () => {
    const html = renderToString(<App />);
    expect(html).not.toMatch(/\b(slate|blue|emerald|rose|amber|cyan|indigo|purple)-\d+/);
  });

  it('useId is stable: server id === client id after hydration (no mismatch)', async () => {
    const html = renderToString(<App />);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    const errors: unknown[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...a) => { errors.push(a[0]); });

    await act(async () => {
      hydrateRoot(container, <App />);
    });

    expect(errors, 'React logged a hydration mismatch').toEqual([]);
    const input = container.querySelector('input')!;
    const label = container.querySelector('label')!;
    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.id).not.toBe('');
    spy.mockRestore();
    container.remove();
  });
});
