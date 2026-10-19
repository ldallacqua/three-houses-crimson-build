#!/usr/bin/env bash
# Rebuilds img/portraits from the in-game face portraits on the Fire Emblem Wiki
# ("Small portrait <name> fe16.png", 512×512 with a transparent background): crops to the face,
# scales to 224 px and saves WebP. Only Part 1 portraits — the "_02" files show the Part 2 look.
# Needs curl and an ffmpeg built with libwebp.
#   tools/portraits.sh            all of them
#   tools/portraits.sh petra hapi only these
set -euo pipefail
cd "$(dirname "$0")/.."

ALL=(alois anna annette balthus bernadetta byleth catherine constance dorothea edelgard flayn gilbert
  hanneman hapi ingrid jeralt leonie lorenz lysithea manuela marianne mercedes petra rhea seteth shamir yuri)
ids=("$@")
[ ${#ids[@]} -eq 0 ] && ids=("${ALL[@]}")

UA="three-houses-crimson-build (github.com/ldallacqua/three-houses-crimson-build)"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
mkdir -p img/portraits

for id in "${ids[@]}"; do
  name=$id
  [ "$id" = byleth ] && name=byleth_m
  api="https://fireemblemwiki.org/w/api.php?action=query&titles=File:Small_portrait_${name}_fe16.png&prop=imageinfo&iiprop=url&format=json"
  url=$(curl -fsS -A "$UA" "$api" | grep -o '"url":"[^"]*' | head -1 | cut -d'"' -f4)
  if [ -z "$url" ]; then
    echo "$id: not found on the wiki" >&2
    continue
  fi
  curl -fsS --retry 3 --max-time 180 -A "$UA" -o "$tmp/$id.png" "$url"
  ffmpeg -v error -y -i "$tmp/$id.png" -vf "crop=448:448:32:16,scale=224:224:flags=lanczos" \
    -c:v libwebp -quality 82 -compression_level 6 -pix_fmt yuva420p "img/portraits/$id.webp"
  echo "$id"
done
