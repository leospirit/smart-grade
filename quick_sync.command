#!/bin/bash
cd "$(dirname "$0")"

echo "=== Quick Sync to GitHub ==="
echo "Adding all files..."
git add .

echo "Enter a description of your changes (Press Enter for default 'Update'):"
read msg

if [ -z "$msg" ]; then
  msg="Update code"
fi

echo "Committing with message: '$msg'..."
git commit -m "$msg"

echo "Pushing to GitHub..."
git push

echo "✅ Success! Code is now on GitHub."
echo "Press any key to close..."
read -n 1
