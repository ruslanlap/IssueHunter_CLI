# IssueHunter CLI

A CLI tool to find GitHub issues relevant for contribution based on your developer profile.

## Features

- 🔍 Search GitHub issues globally across public repositories
- 🏷️ Filter by labels (bug, enhancement, help wanted, etc.)
- 💻 Filter by programming language
- 🤖 Automatically excludes bot-created issues
- 📊 Multiple output formats (table, list, JSON)
- ⚡ Preset commands for common searches

## Installation

```bash
npm install
```

## Usage

### Basic Search

```bash
# Show help
node cli.js --help

# Search with default profile settings
node cli.js search

# Search with specific language
node cli.js search --language typescript

# Search with keyword
node cli.js search --keyword "cli automation"

# Output as JSON
node cli.js search --format json

# Show direct URLs
node cli.js search --urls
```

### Preset Commands

```bash
# Developer tools related issues
node cli.js devtools

# CLI tools related issues
node cli.js cli

# Plugin-related issues (PowerToys, VS Code, etc.)
node cli.js plugins

# .NET related issues
node cli.js dotnet

# Automation tools related issues
node cli.js automation
```

### Options

| Option | Description |
|--------|-------------|
| `-u, --username <username>` | GitHub username to exclude own repos (default: ruslanlap) |
| `-l, --language <language>` | Filter by programming language |
| `-k, --keyword <keyword>` | Search keyword |
| `--labels <labels>` | Comma-separated labels to filter |
| `-n, --per-page <number>` | Number of results (default: 30) |
| `-f, --format <format>` | Output format: table, list, json (default: list) |
| `--include-own` | Include issues from your own repositories |
| `--no-exclude-bots` | Include bot-created issues |
| `--urls` | Show direct URLs at the end |
| `-t, --token <token>` | GitHub personal access token |

### Authentication

For higher rate limits, set your GitHub token:

```bash
export GITHUB_TOKEN=your_token_here
```

Or pass it directly:

```bash
node cli.js search --token your_token_here
```

## Search Query Details

The tool builds GitHub search queries with:
- `is:issue is:open is:public` - Only open issues
- `-user:ruslanlap` - Excludes your own repositories
- Label filters with OR logic
- Language and keyword filters

## Output Formats

### List (default)
```
📋 Found 15 issues:

1. microsoft/PowerToys
   [Bug] Run plugin not loading on startup
   https://github.com/microsoft/PowerToys/issues/12345
   Labels: bug, help wanted | Comments: 3 | Updated: 2025-12-29
```

### Table
Formatted ASCII table with columns for Repository, Title, Labels, Comments, Updated.

### JSON
```json
[
  {
    "repository": "microsoft/PowerToys",
    "title": "[Bug] Run plugin not loading on startup",
    "url": "https://github.com/microsoft/PowerToys/issues/12345",
    "labels": ["bug", "help wanted"],
    "comments": 3,
    "updated": "2025-12-29"
  }
]
```

## License

MIT
# IssueHunter_CLI
