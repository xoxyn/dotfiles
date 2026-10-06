#!/usr/bin/env bash
# Create a local bin command and use rofi to run, it stops and reruns hyprpaper afte wallpaper switch
DIR="$HOME/Pictures/wallpapers"
CONF="$HOME/.config/hypr/hyprpaper.conf"

choice=$(ls "$DIR" | rofi -dmenu -p "Wallpaper") || exit
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
