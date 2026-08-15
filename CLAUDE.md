# Renovate Config Repository Guidelines

## Repository Purpose
This repository contains shareable and reusable Renovate config presets for various ecosystems:
- PHP/Composer
- JavaScript/npm
- TypeScript
- GitHub Actions
- Docker
- WordPress plugins

## Commands
- No specific build/lint/test commands as this is a configuration-only repository
- Validate JSON/JSON5 files with appropriate schema validators
- To run schema validation: `npx --yes renovate-config-validator`

## Code Style Guidelines
- **Indentation**: 2 spaces
- **Line Endings**: LF (Unix-style)
- **Encoding**: UTF-8
- **File Format**: 
  - JSON with schema reference `"$schema": "https://docs.renovatebot.com/renovate-schema.json"`
  - JSON5 for more complex configurations with comments
- **Structure**: Organize presets by technology/ecosystem in dedicated folders
- **Naming Convention**: Use kebab-case for filenames and preset names
- **Documentation**: Include comments in JSON5 files to explain non-obvious configuration choices

## Best Practices
- Follow Renovate's official preset patterns
- Maintain semantic versioning for major configuration changes
- Test configuration changes on a test repository before wider adoption
- Keep presets focused and composable

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
