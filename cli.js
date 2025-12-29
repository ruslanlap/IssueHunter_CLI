#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import boxen from 'boxen';
import terminalLink from 'terminal-link';
import stringWidth from 'string-width';

const program = new Command();

// GitHub API base URL
const GITHUB_API = 'https://api.github.com';

// Default search configuration
const DEFAULT_CONFIG = {
    username: 'ruslanlap',
    labels: ['bug', 'enhancement', 'help wanted', 'good first issue', 'documentation'],
    languages: ['javascript', 'typescript', 'python', 'csharp'],
    keywords: ['cli', 'developer-tools', 'automation', 'plugin', 'powertoys', 'ui', 'ux'],
    perPage: 30,
    excludeBots: true
};

/**
 * Build GitHub search query
 */
function buildSearchQuery(options) {
    const parts = ['is:issue', 'is:open', 'archived:false'];

    // Search in specific user's repositories
    if (options.user) {
        parts.push(`user:${options.user}`);
    }
    // Exclude issues from user's own repos (only if not searching for specific user)
    else if (!options.includeOwn && options.username && !options.author && !options.involves) {
        parts.push(`-user:${options.username}`);
    }

    // Add repo filter (specific repository)
    if (options.repo) {
        parts.push(`repo:${options.repo}`);
    }

    // Add author filter (issues created by user)
    if (options.author) {
        parts.push(`author:${options.author}`);
    }

    // Add involves filter (author, assignee, mentions, or commenter)
    if (options.involves) {
        parts.push(`involves:${options.involves}`);
    }

    // Add mentions filter
    if (options.mentions) {
        parts.push(`mentions:${options.mentions}`);
    }

    // Add assignee filter
    if (options.assignee) {
        parts.push(`assignee:${options.assignee}`);
    }

    // Add single label filter
    if (options.label) {
        parts.push(`label:"${options.label}"`);
    }

    // Add language filter
    if (options.language) {
        parts.push(`language:${options.language}`);
    }

    // Add keyword search
    if (options.keyword) {
        parts.push(options.keyword);
    }

    return parts.join(' ');
}

/**
 * Fetch issues from GitHub API
 */
async function fetchIssues(query, options) {
    const params = new URLSearchParams({
        q: query,
        sort: options.sort || 'updated',
        order: options.order || 'desc',
        per_page: options.perPage || DEFAULT_CONFIG.perPage
    });

    const url = `${GITHUB_API}/search/issues?${params}`;

    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'issuehunter-cli'
    };

    // Use token if available
    if (options.token || process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${options.token || process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`GitHub API error: ${error.message || response.statusText}`);
    }

    return response.json();
}

/**
 * Filter out bot-created issues
 */
function filterBotIssues(issues) {
    const botPatterns = ['[bot]', '-bot', 'dependabot', 'renovate', 'greenkeeper', 'snyk'];
    return issues.filter(issue => {
        const author = issue.user?.login?.toLowerCase() || '';
        return !botPatterns.some(pattern => author.includes(pattern.toLowerCase()));
    });
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

/**
 * Extract repo name from URL
 */
function extractRepo(url) {
    const match = url.match(/repos\/([^/]+\/[^/]+)/);
    return match ? match[1] : 'Unknown';
}

/**
 * Get activity level based on comments
 */
function getActivityLevel(comments) {
    if (comments > 20) return 'high';
    if (comments > 5) return 'medium';
    return 'low';
}

/**
 * Get emoji for common labels
 */
function getLabelEmoji(labelName) {
    const name = labelName.toLowerCase();
    if (name.includes('bug')) return '🐛';
    if (name.includes('enhancement') || name.includes('feature')) return '✨';
    if (name.includes('documentation') || name.includes('docs')) return '📝';
    if (name.includes('help wanted')) return '🙋';
    if (name.includes('good first issue')) return '🌱';
    return '';
}

/**
 * Format labels for display with emojis
 */
function formatLabels(labels) {
    if (!labels || labels.length === 0) return chalk.dim('-');

    const formatted = labels.slice(0, 3).map(l => {
        const emoji = getLabelEmoji(l.name);
        return emoji ? `${emoji} ${l.name}` : l.name;
    });

    return formatted.join(', ');
}

/**
 * Display results in professional format
 */
function displayTable(issues, totalCount, options = {}) {
    if (issues.length === 0) {
        console.log('\n' + chalk.dim('  No issues found matching your criteria.') + '\n');
        return;
    }

    // header
    const termWidth = process.stdout.columns || 44;

    // ASCII art logo
    const statsText = `Found ${issues.length} issues · ${totalCount} total matches`;

    const logo = [
        '',
        chalk.bold.white('        ██╗███████╗███████╗██╗   ██╗███████╗'),
        chalk.bold.white('        ██║██╔════╝██╔════╝██║   ██║██╔════╝'),
        chalk.bold.cyan('        ██║███████╗███████╗██║   ██║█████╗'),
        chalk.bold.blue('        ██║╚════██║╚════██║██║   ██║██╔══╝'),
        chalk.bold.blue('        ██║███████║███████║╚██████╔╝███████╗'),
        chalk.bold.blue('        ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚══════╝'),
        '',
        chalk.bold.magenta('                H U N T E R') + chalk.dim('  v1.0.0'),
        '',
        chalk.dim('            ' + statsText),
        '',
    ];

    console.log('');
    logo.forEach(line => console.log(line));
    console.log('');

    issues.forEach((issue, index) => {
        const repo = extractRepo(issue.repository_url);
        const activityLevel = getActivityLevel(issue.comments);

        // Status indicator with color
        let status;
        if (activityLevel === 'high') {
            status = chalk.red('●');
        } else if (activityLevel === 'medium') {
            status = chalk.yellow('●');
        } else {
            status = chalk.green('●');
        }

        // Repository in cyan
        console.log(`  ${status}  ${chalk.cyan.bold(repo)}`);

        // Title in white/blue
        console.log(`      ${chalk.blueBright(issue.title)}`);

        // Metadata line
        const parts = [];

        // Labels in magenta (only show if present)
        if (issue.labels && issue.labels.length > 0) {
            const labelNames = issue.labels.slice(0, 2).map(l => l.name);
            parts.push(chalk.magenta(labelNames.join(', ')));
        }

        // Comments with icon
        parts.push(chalk.dim(`💬 ${issue.comments}`));

        // Date
        parts.push(chalk.dim(`📅 ${formatDate(issue.updated_at)}`));

        console.log(`      ${parts.join(chalk.dim(' · '))}`);

        // URL in dim underline
        console.log(`      ${chalk.gray.underline(issue.html_url)}`);

        console.log('');
    });

    // Footer
    console.log(chalk.dim('  ' + '─'.repeat(60)));
    console.log('');
}

/**
 * Display results in JSON format
 */
function displayJson(issues) {
    const formatted = issues.map(issue => ({
        repository: extractRepo(issue.repository_url),
        title: issue.title,
        url: issue.html_url,
        labels: issue.labels.map(l => l.name),
        comments: issue.comments,
        updated: formatDate(issue.updated_at)
    }));

    console.log(JSON.stringify(formatted, null, 2));
}

/**
 * Display results in simple list format
 */
function displayList(issues) {
    if (issues.length === 0) {
        console.log(chalk.yellow('\nNo issues found matching your criteria.\n'));
        return;
    }

    console.log(chalk.bold(`\n📋 Found ${issues.length} issues:\n`));

    issues.forEach((issue, index) => {
        const repo = extractRepo(issue.repository_url);
        const labels = formatLabels(issue.labels);

        console.log(chalk.cyan(`${index + 1}. ${repo}`));
        console.log(`   ${chalk.white(issue.title)}`);
        console.log(`   ${chalk.gray(issue.html_url)}`);
        console.log(`   ${chalk.yellow('Labels:')} ${labels} | ${chalk.yellow('Comments:')} ${issue.comments} | ${chalk.yellow('Updated:')} ${formatDate(issue.updated_at)}`);
        console.log();
    });
}

/**
 * Main search function
 */
async function searchIssues(options) {
    const spinner = ora('Searching GitHub issues...').start();

    try {
        const query = buildSearchQuery({
            ...DEFAULT_CONFIG,
            ...options
        });

        spinner.text = `Query: ${query}`;

        const result = await fetchIssues(query, options);

        let issues = result.items || [];

        // Filter bot issues
        if (options.excludeBots !== false) {
            const beforeCount = issues.length;
            issues = filterBotIssues(issues);
            if (beforeCount !== issues.length) {
                spinner.info(`Filtered ${beforeCount - issues.length} bot-created issues`);
            }
        }

        spinner.stop();

        // Display based on format
        switch (options.format) {
            case 'json':
                displayJson(issues);
                break;
            case 'list':
                displayList(issues);
                break;
            case 'table':
            default:
                displayTable(issues, result.total_count, options);
                break;
        }

        // Show URLs in list mode
        if (options.format !== 'json' && options.urls) {
            console.log(chalk.bold('\n🔗 Direct URLs:\n'));
            issues.forEach(issue => {
                console.log(issue.html_url);
            });
        }

    } catch (error) {
        spinner.fail(`Error: ${error.message}`);
        process.exit(1);
    }
}

// CLI setup
program
    .name('issuehunter')
    .description('Find GitHub issues relevant for contribution')
    .version('1.0.0');

program
    .command('search')
    .description('Search for open issues across GitHub')
    .option('--user <user>', 'Search issues in this user\'s repositories')
    .option('--repo <owner/repo>', 'Search issues in specific repository (e.g., microsoft/vscode)')
    .option('-u, --username <username>', 'GitHub username to exclude own repos', DEFAULT_CONFIG.username)
    .option('-a, --author <author>', 'Find issues created by this user')
    .option('-i, --involves <user>', 'Find issues where user is involved (author/assignee/mentioned/commenter)')
    .option('--mentions <user>', 'Find issues that mention this user')
    .option('--assignee <user>', 'Find issues assigned to this user')
    .option('-l, --language <language>', 'Filter by programming language (javascript, typescript, python, csharp)')
    .option('-k, --keyword <keyword>', 'Search keyword (e.g., cli, automation, plugin)')
    .option('--label <label>', 'Filter by single label (e.g., bug, enhancement, help wanted)')
    .option('-n, --per-page <number>', 'Number of results', parseInt, DEFAULT_CONFIG.perPage)
    .option('-f, --format <format>', 'Output format: table, list, json', 'table')
    .option('--include-own', 'Include issues from your own repositories')
    .option('--no-exclude-bots', 'Include bot-created issues')
    .option('--urls', 'Show direct URLs at the end')
    .option('-t, --token <token>', 'GitHub personal access token (or use GITHUB_TOKEN env)')
    .action(searchIssues);

program
    .command('devtools')
    .description('Search for developer tools related issues')
    .option('-f, --format <format>', 'Output format: table, list, json', 'table')
    .option('-n, --per-page <number>', 'Number of results', parseInt, 30)
    .option('-t, --token <token>', 'GitHub token')
    .action((options) => {
        searchIssues({
            ...options,
            keyword: 'developer tools OR devtools OR developer-tools',
            labels: ['bug', 'enhancement', 'help wanted']
        });
    });

program
    .command('cli')
    .description('Search for CLI tools related issues')
    .option('-f, --format <format>', 'Output format: table, list, json', 'table')
    .option('-n, --per-page <number>', 'Number of results', parseInt, 30)
    .option('-t, --token <token>', 'GitHub token')
    .action((options) => {
        searchIssues({
            ...options,
            keyword: 'cli OR command-line',
            labels: ['bug', 'enhancement', 'help wanted']
        });
    });

program
    .command('plugins')
    .description('Search for plugin-related issues (PowerToys, VS Code, etc.)')
    .option('-f, --format <format>', 'Output format: table, list, json', 'table')
    .option('-n, --per-page <number>', 'Number of results', parseInt, 30)
    .option('-t, --token <token>', 'GitHub token')
    .action((options) => {
        searchIssues({
            ...options,
            keyword: 'plugin OR extension OR PowerToys',
            labels: ['bug', 'enhancement', 'help wanted']
        });
    });

program
    .command('dotnet')
    .description('Search for .NET related issues')
    .option('-f, --format <format>', 'Output format: table, list, json', 'table')
    .option('-n, --per-page <number>', 'Number of results', parseInt, 30)
    .option('-t, --token <token>', 'GitHub token')
    .action((options) => {
        searchIssues({
            ...options,
            language: 'csharp',
            labels: ['bug', 'enhancement', 'help wanted']
        });
    });

program
    .command('automation')
    .description('Search for automation tools related issues')
    .option('-f, --format <format>', 'Output format: table, list, json', 'table')
    .option('-n, --per-page <number>', 'Number of results', parseInt, 30)
    .option('-t, --token <token>', 'GitHub token')
    .action((options) => {
        searchIssues({
            ...options,
            keyword: 'automation OR workflow OR scripting',
            labels: ['bug', 'enhancement', 'help wanted']
        });
    });

// Default command - run search with default profile
program
    .action(() => {
        program.help();
    });

program.parse();
