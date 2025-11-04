#!/bin/bash

dir=$(realpath "$(dirname "$(realpath "$0")")/..")
sprite_resource_dir="$dir/resources/sprites"
sprite_public_dir="$dir/public/assets/sprites"
aseprite_paths=(
   "$HOME/Library/Application Support/Steam/steamapps/common/Aseprite/Aseprite.app/Contents/MacOS/aseprite"
   /Applications/Aseprite.app/Contents/MacOS/aseprite
   "$HOME/.steam/debian-installation/steamapps/common/Aseprite/aseprite"
   /usr/local/bin/aseprite
   /usr/bin/aseprite
)

# Find Aseprite binary
if [[ -n $ASEPRITE && -f $ASEPRITE ]]; then
   echo "Using Aseprite at: $ASEPRITE"
else
   for p in "${aseprite_paths[@]}"; do
      [[ -f $p ]] && ASEPRITE=$p && echo "Found Aseprite at: $ASEPRITE" && break
   done
fi

# Abort if Aseprite not found
if [[ -z $ASEPRITE || ! -f $ASEPRITE ]]; then
   echo "Error: Aseprite not found. Please install Aseprite or use the prebuilt sprites."
   exit 1
fi

for aseprite in "$sprite_resource_dir"/*.aseprite; do
   name=$(basename "$aseprite" .aseprite)
   # Get layers from file
   layers=()
   while IFS= read -r layer; do
      layers+=("$layer")
   done < <("$ASEPRITE" -b --list-layers "$aseprite" | tr $'\r' '\n')
   # Loop thru layers and export each one
   echo "Packing $name sprite (${#layers[@]} layers)"
   multi=true && [[ ${#layers[@]} -eq 1 ]] && multi=false
   for layer in "${layers[@]}"; do
      base_path="$sprite_public_dir/$name"
      filename_format='{title}-{frame}-{tag}'
      sheet_path="$base_path.png"
      data_path="$base_path.json"
      # Different naming convention for multi-layer aseprite files
      if $multi; then
         filename_format='{title}-{layer}-{frame}-{tag}'
         sheet_path="$base_path-$layer.png"
         data_path="$base_path-$layer.json"
      fi
      echo "  - Layer: $layer"
      echo "           $sheet_path"
      echo "           $data_path"
      # Run Aseprite export
      "$ASEPRITE" -b --layer "$layer" --list-tags "$aseprite" \
         --sheet "$sheet_path" \
         --data "$data_path" \
         --filename-format "$filename_format" \
         --sheet-pack --format json-array
      # Minify the json file
      jq -c . "$data_path" > "$data_path.tmp" && mv "$data_path.tmp" "$data_path"
   done
done
