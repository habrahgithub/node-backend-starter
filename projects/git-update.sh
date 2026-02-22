#!/bin/bash

# --- Configuration ---
# Update this path if your repository is in a different location.
REPO_PATH="/home/habib/workspace/projects/swd-docsmith-sif-extension"
# The primary branch you are working on (commonly "main" or "master").
PRIMARY_BRANCH="main"


# --- Script Steps ---

# 1. Navigate to the repository directory.
echo "📂 Navigating to your repository..."
if ! cd "$REPO_PATH"; then
    echo "❌ Error: The directory '$REPO_PATH' was not found."
    exit 1
fi
echo "✅  Successfully changed directory to $(pwd)"
echo ""

# 2. Fetch the latest information from the remote repository.
# This command downloads commits, files, and refs from the remote, but
# it doesn't modify your local working files yet. It's a safe way to
# "check the github repo" for changes.
echo "⬇️  Fetching all updates from the 'origin' remote..."
git fetch origin
echo "✅  Fetch complete."
echo ""

# 3. Check the status of your local branch against the remote.
# This will tell you if your branch is behind, ahead, or has diverged.
echo "📊 Checking your local status against origin/$PRIMARY_BRANCH..."
git status
echo ""

# 4. Pull the changes into your local branch.
# We use 'git pull --rebase' to apply your local changes on top of the
# new changes from the remote. This creates a cleaner, more linear history.
echo "🔄 Integrating remote changes into your local '$PRIMARY_BRANCH' branch..."
git pull origin "$PRIMARY_BRANCH" --rebase
echo ""
echo "🎉 Your local repository is now up-to-date!"

