# ChronosAI Changelog

All notable changes to ChronosAI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Enhanced AI scheduling capabilities
- Improved calendar integration
- Better error handling and logging

### Changed
- Updated dependencies
- Improved performance optimizations
#### Workflows
- **Breaking:** Promoted workflows commands from `render ea` to `render workflows`
- **Breaking:** Moved `taskruns start` to `tasks start`
- **Breaking:** Renamed `taskruns` command to `runs`
- Moved local development `dev` command from `workflows tasks` to `workflows`
- Skip version selection step in interactive task navigation (use most recent version)
- Use compact tables for workflows task and task run lists
- Improved `tasks dev` startup output

### Fixed

#### General
- Show loading spinner in content pane only, keeping header and footer visible

#### Workflows
- Fixed `--wait` on `versions release` to poll until completion
- Fixed `tasks dev` hang when start command is invalid or crashes
- Fixed local task run input display and interactive mode bugs
- Fixed local `taskruns list` when no task id specified or id is a slug
- Fixed local dev server generating UUIDs instead of XIDs for task IDs
- Fixed local dev server logs endpoint returning incorrect response format
- Fixed referencing local dev server tasks by slug only
- Fixed malformed format string in `taskruns show -o text`
- Fixed "service id" error typo when validating TaskRunInput
- Fixed missing parent and root task ids in local task runs
- Fixed local dev server returning task runs with `attempts: null`
- Fixed error message when starting a task run for a nonexistent task in local dev
