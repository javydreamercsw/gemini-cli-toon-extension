import { describe, it, expect } from 'vitest';
import { encodeToon, decodeToon } from '../index.js';

describe('TOON Encoder/Decoder', () => {
  describe('Tabular Arrays', () => {
    it('should encode a uniform array of objects into tabular TOON', () => {
      const data = [
        { id: 1, name: "Alice", active: true },
        { id: 2, name: "Bob", active: false }
      ];
      const encoded = encodeToon(data);
      expect(encoded).toContain('[2]{id,name,active}:');
      expect(encoded).toContain('1,Alice,true');
      expect(encoded).toContain('2,Bob,false');
    });

    it('should decode a tabular TOON string back to objects', () => {
      const toon = `[2]{id,name,active}:
  1,Alice,true
  2,Bob,false`;
      const decoded = decodeToon(toon);
      expect(decoded).toEqual([
        { id: 1, name: "Alice", active: true },
        { id: 2, name: "Bob", active: false }
      ]);
    });

    it('should handle quoted strings with commas', () => {
      const data = [{ text: "Hello, world", val: 1 }];
      const encoded = encodeToon(data);
      expect(encoded).toContain('"Hello, world",1');
      
      const decoded = decodeToon(encoded);
      expect(decoded).toEqual(data);
    });

    it('should handle escaped quotes', () => {
      const data = [{ text: 'He said "Hello"', val: 1 }];
      const encoded = encodeToon(data);
      expect(encoded).toContain('"He said ""Hello""",1');
      
      const decoded = decodeToon(encoded);
      expect(decoded).toEqual(data);
    });
  });

  describe('Simple Arrays', () => {
    it('should encode a simple array of primitives', () => {
      const data = [1, "two", true, null];
      const encoded = encodeToon(data);
      expect(encoded).toBe('[4]: 1,two,true,null');
    });

    it('should decode a simple array of primitives', () => {
      const toon = '[4]: 1,two,true,null';
      const decoded = decodeToon(toon);
      expect(decoded).toEqual([1, "two", true, null]);
    });
  });

  describe('Objects', () => {
    it('should encode a simple object', () => {
      const data = { a: 1, b: "two" };
      const encoded = encodeToon(data);
      expect(encoded).toContain('a: 1');
      expect(encoded).toContain('b: two');
    });

    it('should decode a simple object', () => {
      const toon = `a: 1
b: two`;
      const decoded = decodeToon(toon);
      expect(decoded).toEqual({ a: 1, b: "two" });
    });
  });
});
