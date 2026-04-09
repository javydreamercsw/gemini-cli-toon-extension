# TOON Extension for Gemini CLI

[![CI](https://github.com/javydreamercsw/gemini-cli-toon-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/javydreamercsw/gemini-cli-toon-extension/actions/workflows/ci.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

**TOON (Token-Oriented Object Notation)** is a lossless, indentation-based encoding of the JSON data model, specifically optimized for LLM context windows. This extension integrates TOON into the Gemini CLI, allowing the AI to handle large datasets while saving up to **45-60% in token usage**.

## Why use TOON?

- **Token Efficiency**: Reduces the character count of large arrays by omitting redundant brackets, braces, and property names.
- **Improved Context Management**: Fit more data (logs, database results, search results) into the same context window.
- **Human & AI Readable**: Combines YAML-style indentation with CSV-style tabular layouts.

## Installation

1. Clone this repository or download the source.
2. Build the project:
   ```bash
   npm install
   npm run build
   ```
3. Link it to your Gemini CLI:
   ```bash
   gemini extensions link .
   ```

## Available Tools

### `toon_encode`
Encodes a JSON array or object into TOON format.
- **Input**: `{ "data": [...] }`
- **Output**: A TOON-encoded string.

### `toon_decode`
Decodes a TOON string back into a standard JSON array/object.
- **Input**: `{ "toon": "..." }`
- **Output**: A standard JSON structure.

## Usage Example

**Standard JSON (Verbose):**
```json
[
  {"id": 1, "name": "Alice", "role": "admin"},
  {"id": 2, "name": "Bob", "role": "user"}
]
```

**TOON Tabular (Compact):**
```toon
[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user
```

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
