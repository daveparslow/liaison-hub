# Branch Protection Configuration

To require pull requests for the `main` branch:

## Setup Instructions

1. Go to: https://github.com/daveparslow/liaison-hub/settings/branches
2. Click "Add branch protection rule"
3. Configure the following:

### Branch name pattern
```
main
```

### Protection Rules

#### ✅ Require a pull request before merging
- ✅ Require approvals: 1 (or 0 if you're working solo)
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ⬜ Require review from Code Owners (optional)

#### ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- **Required status checks:**
  - `CI` (from ci.yml workflow)

#### ✅ Require conversation resolution before merging

#### ✅ Require linear history
- Prevents merge commits, enforces rebase or squash

#### ⬜ Include administrators (optional)
- If checked, rules apply to repository admins too

#### ⬜ Allow force pushes (recommended: disabled)

#### ⬜ Allow deletions (recommended: disabled)

## Alternative: Use GitHub CLI

You can also configure branch protection using the GitHub CLI:

```bash
gh api repos/daveparslow/liaison-hub/branches/main/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=CI \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true \
  --field required_pull_request_reviews[required_approving_review_count]=0 \
  --field required_conversation_resolution=true \
  --field required_linear_history=true \
  --field enforce_admins=false \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

## Workflow After Setup

Once configured, all changes to `main` must:
1. Be made in a feature branch
2. Create a pull request
3. Pass all CI checks
4. Be merged via PR (can't push directly to main)

### Creating a feature branch:
```bash
git checkout -b feature/my-feature
# make changes
git add .
git commit -m "feat: add feature"
git push -u origin feature/my-feature
# Then create PR on GitHub
```
