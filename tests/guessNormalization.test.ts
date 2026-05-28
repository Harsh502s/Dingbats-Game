import { describe, it, expect } from 'vitest';

describe('Guess Normalization', () => {
  function normalize(s: string): string {
    return s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  }

  it('should normalize basic strings', () => {
    expect(normalize('Hello')).toBe('hello');
    expect(normalize('WORLD')).toBe('world');
  });

  it('should trim whitespace', () => {
    expect(normalize('  hello  ')).toBe('hello');
    expect(normalize('\thello\n')).toBe('hello');
  });

  it('should remove special characters', () => {
    expect(normalize('hello-world')).toBe('helloworld');
    expect(normalize('hello_world')).toBe('helloworld');
    expect(normalize('hello.world')).toBe('helloworld');
  });

  it('should handle punctuation', () => {
    expect(normalize('hello!')).toBe('hello');
    expect(normalize('hello?')).toBe('hello');
    expect(normalize('hello, world')).toBe('helloworld');
  });

  it('should keep numbers', () => {
    expect(normalize('hello123')).toBe('hello123');
    expect(normalize('123')).toBe('123');
  });

  it('should handle complex cases', () => {
    expect(normalize('  Hello, World!  ')).toBe('helloworld');
    expect(normalize('Test-Case_123')).toBe('testcase123');
    expect(normalize('UPPER-lower_MiXeD')).toBe('upperlowermixed');
  });

  it('should match equivalent guesses', () => {
    const guess1 = normalize('Hello World');
    const guess2 = normalize('hello-world');
    expect(guess1).toBe(guess2);
  });

  it('should handle empty strings', () => {
    expect(normalize('')).toBe('');
    expect(normalize('   ')).toBe('');
  });
});
