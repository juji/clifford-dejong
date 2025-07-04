#!/bin/zsh

# Read all of stdin, preserving newlines
message_from_stdin=$(cat -)

# Escape special characters for AppleScript, preserving newlines
# Double escape quotes and backslashes for AppleScript
escaped_message=$(echo "$message_from_stdin" | sed -e 's/\\/\\\\\\\\/g' -e 's/"/\\\\\\"/g' -e "s/'/\\\\\\'/g")

osascript <<EOF
tell application "iTerm2"
    activate
    # Ensure a window is open and active
    if not (exists current window) then
        create window with default profile
    end if
    
    tell current session of current window
        write text "$escaped_message" & linefeed
    end tell
end tell
EOF

# Explicitly send return key after the message has been written
osascript -e 'tell application "System Events" to keystroke return'