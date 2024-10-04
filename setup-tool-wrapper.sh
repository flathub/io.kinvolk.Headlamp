#!/bin/bash

# Check if the tool name is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <tool-name-or-tools-separated-by-semicolon>"
  exit 1
fi

function setup-tool() {
  # Get the tool name from the first argument
  TOOL_NAME=$1

  # Create the script content
  SCRIPT_CONTENT=$(cat <<EOF
#!/bin/bash
command="$TOOL_NAME \$@"
flatpak-spawn --host bash --login -c "\$command"
EOF
)

  # Create the new script file with the tool name
  echo "$SCRIPT_CONTENT" > "$TOOL_NAME"

  # Make the new script file executable
  chmod +x "$TOOL_NAME"

  echo "Wrapper script for $TOOL_NAME created successfully."
}

TOOLS=$1

# Check if the tools in $TOOLS is one or more tools
if [[ $TOOLS == *";"* ]]; then
  # Split the tools by semicolon
  IFS=';' read -ra TOOLS <<< "$TOOLS"
fi

# Iterate over each tool and create the wrapper script
for TOOL in "${TOOLS[@]}"; do
  # Create the script content
  setup-tool "$TOOL"
done
