"""
High Abyss Mira - Unreal-Editor-Skript 3/3: 1:1 uebernehmbare Assets stapelweise importieren.   *** ENTWURF, in Unreal noch nie ausgefuehrt ***

Zweck: die Teile aus ASSET_PLAN.md, die als Datei vorliegen (GLB/FBX/PNG/JPG/WAV/OGG), mit festen Namen in /Game/HAM importieren.
NICHT importiert werden: .ktx2 (GPU-Container fuers Web; neben jeder .ktx2 liegt die Quell-.jpg/.png - die nehmen wir), .json, .bin.
GLB: je nach UE-Version ueber Interchange (UE 5.5+ Standard) - sonst vorher in Blender nach FBX wandeln. Rueckfall siehe unten.

Aufruf (Editor-Python):  Umgebungsvariablen setzen oder unten LISTE editieren, dann `py ue_import_assets.py`
   HAM_REPO   Repo-Wurzel (Standard: relativ zu diesem Skript)
   HAM_SET    Name einer Liste aus LISTEN (Standard: "kapitel1_props")
Namenskonvention (NAECHSTE_SCHRITTE.md §3): SM_ (StaticMesh), SK_ (SkeletalMesh), T_<Name>_BC/_N/_ORM (Texturen), MI_ (Material-Instanz), SW_/MS_/A_ (Audio).
"""
import os
import re
import unreal

REPO = os.environ.get("HAM_REPO") or os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
ASSETS = os.path.join(REPO, "game", "assets")
AUDIO = os.path.join(REPO, "game", "audio")
DEST_ROOT = "/Game/HAM"

# Listen: (Quellordner relativ zu game/assets, Zielordner unter /Game/HAM, Praefix)
LISTEN = {
    "kapitel1_props": [
        ("ms/rekorder", "Chapters/K01_KellerBleibtZu/Props/Rekorder", "SM_"),
        ("ms/bed_keypad", "Chapters/K01_KellerBleibtZu/Props/Keypad", "SM_"),
        ("ms/messer", "Items/Meshes/Messer", "SM_"),
        ("ms/w_alarm", "Chapters/K01_KellerBleibtZu/Props/Feuermelder", "SM_"),
    ],
    "figuren_rohmodelle": [   # nur als Referenz/Proxy - Zielzustand sind MetaHumans, siehe ASSET_PLAN.md §5
        ("chars", "Characters/Children", "SK_"),
    ],
}
MESH_EXT = (".fbx", ".glb", ".gltf")
TEX_EXT = (".png", ".jpg", ".jpeg", ".tga")
SKIP_DIRS = {"__pycache__"}


def clean(name):
    name = re.sub(r"[^A-Za-z0-9_]+", "_", os.path.splitext(name)[0]).strip("_")
    return name or "Asset"


def make_task(src, dest_path, dest_name):
    t = unreal.AssetImportTask()
    t.set_editor_property("filename", src)
    t.set_editor_property("destination_path", dest_path)
    t.set_editor_property("destination_name", dest_name)
    t.set_editor_property("automated", True)
    t.set_editor_property("replace_existing", False)
    t.set_editor_property("save", True)
    return t


def import_folder(rel_src, rel_dest, prefix):
    src_dir = os.path.join(ASSETS, rel_src)
    if not os.path.isdir(src_dir):
        unreal.log_warning("Quellordner fehlt: " + src_dir)
        return 0
    dest = "%s/%s" % (DEST_ROOT, rel_dest)
    tasks = []
    for dirpath, dirs, files in os.walk(src_dir):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in sorted(files):
            ext = os.path.splitext(f)[1].lower()
            sub = os.path.basename(dirpath) if dirpath != src_dir else ""
            base = clean(f)
            if ext in MESH_EXT:
                tasks.append(make_task(os.path.join(dirpath, f), dest, prefix + clean(sub + "_" + base if sub else base)))
            elif ext in TEX_EXT:
                tasks.append(make_task(os.path.join(dirpath, f), dest + "/Textures", "T_" + clean(sub + "_" + base if sub else base)))
    if tasks:
        unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks(tasks)
    unreal.log("%s -> %s: %d Dateien" % (rel_src, dest, len(tasks)))
    return len(tasks)


def import_audio(prefix_filter, rel_dest):
    """OGG -> SoundWave. prefix_filter z. B. 'amb_' (Klangbetten), 'mu_' (Musik), 'fx_' (Einzelgeraeusche)."""
    tasks = []
    dest = "%s/%s" % (DEST_ROOT, rel_dest)
    for f in sorted(os.listdir(AUDIO)):
        if f.startswith(prefix_filter) and f.lower().endswith((".ogg", ".wav")):
            tasks.append(make_task(os.path.join(AUDIO, f), dest, "SW_" + clean(f)))
    if tasks:
        unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks(tasks)
    unreal.log("Audio %s*: %d Dateien -> %s" % (prefix_filter, len(tasks), dest))


def main():
    name = os.environ.get("HAM_SET", "kapitel1_props")
    total = 0
    for rel_src, rel_dest, prefix in LISTEN.get(name, []):
        total += import_folder(rel_src, rel_dest, prefix)
    if name == "kapitel1_props":
        import_audio("amb_", "Audio/Ambience")
    unreal.log("HAM-Import '%s' fertig: %d Dateien (Materialien/Instanzen danach manuell bzw. per ue_make_materials - TODO)" % (name, total))


main()
