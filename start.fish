#!/usr/bin/env fish
set -l project_dir (dirname (status --current-filename))
cd "$project_dir"
if not type -q node
    set -l bundled_node /home/mirai/.nvm/versions/node/v20.19.6/bin
    if test -x "$bundled_node/node"
        fish_add_path --path "$bundled_node"
    else
        echo 'Node.js 20+ is required / Требуется Node.js 20+'
        exit 1
    end
end
if not test -d node_modules
    echo 'Run npm ci once with Internet / Один раз выполните npm ci с интернетом'
    exit 1
end
if not test -f dist/index.html
    npm run build
    or exit 1
end
python scripts/server.py start
