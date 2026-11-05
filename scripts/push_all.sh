#!/usr/bin/env bash
set -e
cd /app
source backend/.env
P=$(grep -oP "Passphrase: \K\S+" memory/test_credentials.md)
tar czf /tmp/env.tar.gz backend/.env frontend/.env
openssl enc -aes-256-cbc -pbkdf2 -salt -in /tmp/env.tar.gz -out handoff/env.enc -pass pass:"$P"
rm /tmp/env.tar.gz
git add -A
for s in "$GITHUB_TOKEN" "$EMERGENT_LLM_KEY" "$GUESTBOOK_ADMIN_KEY" "$P"; do
  if git grep --cached -q -F "$s"; then echo "SECRET FOUND, aborting"; git grep --cached -l -F "$s"; exit 1; fi
done
git -c user.name="Emergent Agent" -c user.email="agent@emergent.sh" commit -qm "$1" || true
git branch -f development HEAD
R="https://x-access-token:$GITHUB_TOKEN@github.com/ShrutiThakur1729/Shruti.git"
git push --force "$R" HEAD:development HEAD:main 2>&1 | sed "s/$GITHUB_TOKEN/***/g"
git ls-remote "$R" | sed "s/$GITHUB_TOKEN/***/g"
echo "FILES $(git ls-files | wc -l)"
