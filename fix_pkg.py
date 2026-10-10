import json
with open("package.json", "r") as f:
    pkg = json.load(f)

pkg["version"] = "0.8.0"
pkg["scripts"]["package:win"] = "npm run build && electron-builder --win nsis zip --publish never"
pkg["build"]["win"]["target"] = ["nsis", "zip"]
pkg["build"]["nsis"] = {
    "oneClick": True,
    "perMachine": False,
    "allowToChangeInstallationDirectory": False,
    "createDesktopShortcut": True,
    "createStartMenuShortcut": True,
    "runAfterFinish": False,
    "artifactName": "Nova-3D-Printer-Manager-Setup-${version}.${ext}"
}

with open("package.json", "w") as f:
    json.dump(pkg, f, indent=2)
print("Done")
