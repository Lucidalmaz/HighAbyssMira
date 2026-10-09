"""
High Abyss Mira - Unreal-Editor-Skript 1/3: Ordnerstruktur anlegen.   *** ENTWURF, in Unreal noch nie ausgefuehrt ***

Start (im Editor): Output Log -> Python -> `py "C:/.../HighAbyssMira-Repo/app/tools/ue_export/ue_setup_project.py"`
oder headless:  UnrealEditor-Cmd.exe HighAbyssMira.uproject -ExecutePythonScript="...ue_setup_project.py"
(Python-Editor-Plugin "Python Editor Script Plugin" muss in Edit > Plugins aktiv sein.)

Legt unter /Game/HAM die Struktur aus docs/unreal/NAECHSTE_SCHRITTE.md an. Legt nur Ordner an, ueberschreibt nichts.
"""
import unreal

ROOT = "/Game/HAM"
KAPITEL = ["K01_KellerBleibtZu", "K02_Amt", "K03_Nimmerheim", "K04_Villa", "K05_IssAufBruder", "K06_Wendigo", "K07_Reserve"]
FOLDERS = [
    "Core/Blueprints", "Core/GameFramework", "Core/Input", "Core/UI", "Core/Data/Structs", "Core/Data/Tables", "Core/Save",
    "Characters/MetaHuman", "Characters/Children", "Characters/Creatures", "Characters/Animation", "Characters/Voice",
    "Items/Meshes", "Items/Icons", "Items/Data",
    "Audio/MetaSounds", "Audio/Cues", "Audio/Ambience", "Audio/Music", "Audio/Voice", "Audio/Attenuation", "Audio/Concurrency",
    "VFX/Niagara", "VFX/Materials", "Cinematics/Sequences", "Cinematics/Cameras",
    "Environment/Megascans", "Environment/Fab", "Environment/Foliage", "Environment/Materials", "Environment/Decals",
    "Lighting/PostProcess", "Lighting/Presets",
    "Maps/Persistent", "Maps/Test",
    "ThirdParty/FabRaw",
]
for k in KAPITEL:
    for sub in ("Maps", "Props", "Dialogue", "Sequences", "Quests"):
        FOLDERS.append("Chapters/%s/%s" % (k, sub))


def main():
    made = 0
    for f in FOLDERS:
        path = "%s/%s" % (ROOT, f)
        if not unreal.EditorAssetLibrary.does_directory_exist(path):
            if unreal.EditorAssetLibrary.make_directory(path):
                made += 1
            else:
                unreal.log_warning("Ordner nicht angelegt: " + path)
    unreal.log("HAM: %d Ordner neu angelegt (insgesamt %d vorgesehen)" % (made, len(FOLDERS)))


main()
