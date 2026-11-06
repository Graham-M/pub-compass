#!/bin/sh
# Rebuilds data/ from fresh Geofabrik extracts. Needs osmium-tool and node.
# Usage: tools/build-pubs.sh [workdir]   (default workdir: .osm, git-ignored, ~3 GB)
set -eu
cd "$(dirname "$0")/.."
W=${1:-.osm}
mkdir -p "$W"

REGIONS="great-britain"  # Geofabrik europe/<region>; add more to widen coverage
for r in $REGIONS; do
  f="$W/$r.osm.pbf"
  echo "== $r"
  # -z: only re-download if Geofabrik has a newer file than ours
  if [ -f "$f" ]; then z="-z $f"; else z=""; fi
  curl -fL $z -o "$f" "https://download.geofabrik.de/europe/$r-latest.osm.pbf"
  osmium tags-filter -O -o "$W/$r-pubs.osm.pbf" "$f" nwr/amenity=pub
  osmium export -O -f geojsonseq --add-unique-id=type_id -o "$W/$r-pubs.geojsonseq" "$W/$r-pubs.osm.pbf"
done

node tools/build-tiles.js "$W"/*-pubs.geojsonseq
