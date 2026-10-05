import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button, Card, Badge, Input, FluentProvider, DEFAULT_LABELS } from '../index.js';

describe('Button', () => {
  it('defaults to type="button" (never submit)', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)('maps variant %s to its public class', (v) => {
    render(<Button variant={v}>x</Button>);
    expect(screen.getByRole('button')).toHaveClass(`fluent-button-${v}`);
  });

  it('loading: aria-busy, no click, still labelled for SR', () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Save</Button>);
    const b = screen.getByRole('button');
    expect(b).toHaveAttribute('aria-busy', 'true');
    expect(b).toBeDisabled();
    fireEvent.click(b);
    expect(onClick).not.toHaveBeenCalled();
    expect(b).toHaveTextContent('Save');
    expect(screen.getByRole('button')).toHaveTextContent(DEFAULT_LABELS.loading);
  });

  it('disabled does not fire onClick', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('warns when icon-only button has no aria-label', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Button icon={<span />} />);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('className from the app is preserved (className wins last)', () => {
    render(<Button className="my-override">x</Button>);
    const b = screen.getByRole('button');
    expect(b.className.indexOf('my-override')).toBeGreaterThan(b.className.indexOf('fluent-button'));
  });
});

describe('Card', () => {
  it('size=compact -> fluent-compact-card', () => {
    const { container } = render(<Card size="compact">c</Card>);
    expect(container.firstChild).toHaveClass('fluent-compact-card');
  });
  it('default -> fluent-card and no hover class', () => {
    const { container } = render(<Card>c</Card>);
    expect(container.firstChild).toHaveClass('fluent-card');
    expect(container.firstChild).not.toHaveClass('fluent-card-interactive');
  });
  it('interactive exposes role + tabIndex', () => {
    render(<Card interactive>c</Card>);
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0');
  });
});

describe('Badge', () => {
  it('size=sm -> fluent-badge-sm, tone sets data-tone', () => {
    render(<Badge tone="danger" size="sm">Fail</Badge>);
    const b = screen.getByText('Fail');
    expect(b).toHaveClass('fluent-badge-sm', 'fluent-badge-danger');
    expect(b).toHaveAttribute('data-tone', 'danger');
  });
  it('dot without label warns (a11y)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Badge dot />);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('Input', () => {
  it('label htmlFor points at the input id', () => {
    render(<Input label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
  });

  it('hint AND error -> aria-describedby contains both ids', () => {
    render(<Input label="Email" hint="we never share it" error="required field" />);
    const input = screen.getByLabelText(/Email/);
    const ids = (input.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids).toHaveLength(2);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('required field');
    for (const id of ids) expect(document.getElementById(id)).toBeTruthy();
  });

  it('required renders a visible asterisk plus SR text', () => {
    const { container } = render(<Input label="Email" required />);
    expect(container.querySelector('.fluent-label-required')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText(DEFAULT_LABELS.required)).toBeInTheDocument();
  });

  it('accepts an explicit id and uses it for label/for + aria-describedby', () => {
    render(<Input id="email" label="Email" error="Lỗi" />);
    const input = screen.getByLabelText('Email');
    expect(input.id).toBe('email');
    expect(input.getAttribute('aria-describedby')).toBe('email-error');
  });
});

describe('i18n via provider', () => {
  it('provider labels replace defaults', () => {
    render(
      <FluentProvider value={{ ...DEFAULT_LABELS, loading: 'Đang tải' }}>
        <Button loading>Save</Button>
      </FluentProvider>,
    );
    expect(screen.getByText('Đang tải')).toBeInTheDocument();
  });
});

describe('BR-1: no raw Tailwind palette in rendered output', () => {
  it('components emit only fluent-* classes', () => {
    const { container } = render(
      <div>
        <Button variant="primary" size="lg" block>Lưu</Button>
        <Card size="compact"><Input label="Tên" error="Lỗi" /></Card>
        <Badge tone="success">OK</Badge>
      </div>,
    );
    const bad = container.innerHTML.match(/\b(slate|blue|emerald|rose|amber|cyan|indigo|purple|neutral)-\d+/g);
    expect(bad).toBeNull();
  });
});
