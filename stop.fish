#!/usr/bin/env fish
set -l project_dir (dirname (status --current-filename))
cd "$project_dir"
python scripts/server.py stop
