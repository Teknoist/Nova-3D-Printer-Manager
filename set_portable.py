import json

with open('package.json', 'r', encoding='utf-8') as f:
    pkg = json.load(f)

pkg['scripts']['package:win'] = "npm run build && electron-builder --win portable zip --publish never"
pkg['build']['win']['target'] = ["portable", "zip"]

with open('package.json', 'w', encoding='utf-8') as f:
    json.dump(pkg, f, indent=2)
