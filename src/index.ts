/**
 * TOON Extension for Gemini CLI
 * Copyright (C) 2026 Javier Ortiz Bultron
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const server = new Server(
  {
    name: "toon-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Helper to escape TOON string values
 */
function escapeValue(val: any): string {
  if (val === null) return "null";
  if (typeof val === "boolean" || typeof val === "number") return String(val);
  const s = String(val);
  if (s.includes(",") || s.includes("\"") || s.startsWith(" ") || s.endsWith(" ") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Helper to unescape TOON string values
 */
function unescapeValue(s: string): any {
  s = s.trim();
  if (s === "null") return null;
  if (s === "true") return true;
  if (s === "false") return false;
  if (!isNaN(Number(s)) && s !== "") return Number(s);
  
  if (s.startsWith("\"") && s.endsWith("\"")) {
    return s.slice(1, -1).replace(/""/g, '"');
  }
  return s;
}

/**
 * Split a comma-separated line, respecting quotes
 */
function splitLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * TOON Encoder
 */
export function encodeToon(data: any, indent = 0): string {
  const spaces = " ".repeat(indent);
  
  if (Array.isArray(data)) {
    if (data.length === 0) return "[]";
    
    // Check if it's a uniform array of objects for tabular format
    const isUniform = data.every(item => 
      typeof item === "object" && item !== null && !Array.isArray(item)
    );
    
    if (isUniform && data.length > 0) {
      const allKeys = Array.from(new Set(data.flatMap(item => Object.keys(item))));
      // For simplicity, we only use tabular if ALL items have SAME keys
      const sameKeys = data.every(item => 
        Object.keys(item).length === allKeys.length && 
        allKeys.every(k => k in item)
      );
      
      if (sameKeys) {
        const header = `[${data.length}]{${allKeys.join(",")}}:`;
        const rows = data.map(item => {
          return " ".repeat(indent + 2) + allKeys.map(k => escapeValue(item[k])).join(",");
        });
        return [header, ...rows].join("\n");
      }
    }
    
    // Fallback for non-uniform or primitive arrays
    return `[${data.length}]: ` + data.map(item => escapeValue(item)).join(",");
  } else if (typeof data === "object" && data !== null) {
    const lines: string[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "object" && value !== null) {
        const encoded = encodeToon(value, indent + 2);
        if (encoded.includes("\n")) {
          lines.push(`${spaces}${key}:\n${encoded}`);
        } else {
          lines.push(`${spaces}${key}: ${encoded}`);
        }
      } else {
        lines.push(`${spaces}${key}: ${escapeValue(value)}`);
      }
    }
    return lines.join("\n");
  }
  
  return escapeValue(data);
}

/**
 * TOON Decoder (Simplified version for the MCP tool)
 */
export function decodeToon(toon: string): any {
  const lines = toon.split("\n").filter(l => l.trim().length > 0);
  if (lines.length === 0) return null;

  // This is a complex task to implement a full TOON parser.
  // For the MVP, we'll focus on the tabular format and basic objects.
  
  const line = lines[0].trim();
  
  // Tabular Array: [N]{k1,k2}:
  const tabularMatch = line.match(/^\[(\d+)\]\{(.+)\}:$/);
  if (tabularMatch) {
    const keys = tabularMatch[2].split(",");
    return lines.slice(1).map(l => {
      const values = splitLine(l.trim());
      const obj: any = {};
      keys.forEach((k, i) => {
        obj[k] = unescapeValue(values[i]);
      });
      return obj;
    });
  }

  // Simple Array: [N]: v1,v2
  const simpleArrayMatch = line.match(/^\[(\d+)\]: (.*)$/);
  if (simpleArrayMatch) {
    return splitLine(simpleArrayMatch[2]).map(v => unescapeValue(v));
  }

  // Object
  const result: any = {};
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const indent = l.search(/\S/);
    const content = l.trim();
    const colonIndex = content.indexOf(":");
    if (colonIndex === -1) continue;

    const key = content.slice(0, colonIndex).trim();
    const valueStr = content.slice(colonIndex + 1).trim();

    if (valueStr === "" && i + 1 < lines.length) {
      // Nested object or array might follow
      // Basic recursive descent would be needed here.
      // For MVP, we handle simple key-values.
    } else {
      result[key] = unescapeValue(valueStr);
    }
  }
  
  return result;
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "toon_encode",
        description: "Encode a JSON array of objects or an object into TOON (Token Oriented Object Notation) for context efficiency.",
        inputSchema: {
          type: "object",
          properties: {
            data: { 
              anyOf: [
                { type: "array", items: { type: "object" } },
                { type: "object" }
              ]
            },
          },
          required: ["data"],
        },
      },
      {
        name: "toon_decode",
        description: "Decode a TOON string back into a standard JSON object or array.",
        inputSchema: {
          type: "object",
          properties: {
            toon: { type: "string" },
          },
          required: ["toon"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "toon_encode") {
      const { data } = z.object({ data: z.any() }).parse(args);
      return {
        content: [{ type: "text", text: encodeToon(data) }],
      };
    }

    if (name === "toon_decode") {
      const { toon } = z.object({ toon: z.string() }).parse(args);
      return {
        content: [{ type: "text", text: JSON.stringify(decodeToon(toon), null, 2) }],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: "text", text: error.message }],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
