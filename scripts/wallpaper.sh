#!/usr/bin/env bash
DIR="$HOME/Pictures/wallpapers"
CONF="$HOME/.config/hypr/hyprpaper.conf"

# build rofi entries: "filename\0icon\x1f/path/to/file"
choice=$(
  find "$DIR" -maxdepth 1 -type f \
    \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \) \
    -printf '%f\n' | sort | while IFS= read -r name; do
      printf '%s\0icon\x1f%s\n' "$name" "$DIR/$name"
    done | rofi -dmenu -show-icons -p "Wallpaper" \
-theme-str 'element-icon { size: 3em; } listview { lines: 8; columns: 4; }'
) || exit

[ -z "$choice" ] && exit
img="$DIR/$choice"

cat > "$CONF" <<EOF
wallpaper {
  monitor =
  path = $img
}

splash = false
EOF

# stop hyprpaper and wait until it has fully exited
pkill -x hyprpaper
while pgrep -x hyprpaper >/dev/null; do
    sleep 0.1
done

# start it again so it loads the new config on all screens
setsid -f hyprpaper >/dev/null 2>&1
