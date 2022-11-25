#!/usr/bin/bash
#
# This script updates the Headlamp version and release in the flatpak
# manifest and appdata file, respectively.
#
# Author: Joaquim Rocha <joaquim@kinvolk.io>
#

set -eu

REPO="kinvolk/headlamp"
APP_DATA_FILE="io.kinvolk.Headlamp.appdata.xml"
MANIFEST_FILE="io.kinvolk.Headlamp.yaml"

token=${GITHUB_TOKEN:-""}

releases=$(curl \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $token" \
  https://api.github.com/repos/$REPO/releases \
)
echo $releases
if [ -z "$releases" ]; then
  echo Failed to get release info!
  exit 1
fi

latest_release=$(echo $releases |jq 'first(.[] | {tag_name, published_at} | select(.tag_name | startswith("v")))');

tag_name=$(echo $latest_release | jq -r '.tag_name')
publish_date=$(echo $latest_release | jq -r '.published_at')

new_version=${tag_name#v*}

has_version_already=0
grep "release version=\"${new_version}\"" $APP_DATA_FILE || has_version_already=$?

if [ $has_version_already -eq 0 ]; then
  echo Not updating appdata file: already has release ${new_version}
else
  sed -i "s!<releases>!<releases>\n    <release version=\"${new_version}\" date=\"${publish_date%T*}\" />!g" $APP_DATA_FILE
fi

sed -i "s!tag\: \"\?v[0-9]\+\.[0-9]\+\.[0-9]\+[a-zA-Z0-9\-]*\"\?!tag: \"${tag_name}\"!g" $MANIFEST_FILE

echo $tag_name
