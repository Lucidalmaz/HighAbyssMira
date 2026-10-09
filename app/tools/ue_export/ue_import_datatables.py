"""
High Abyss Mira - Unreal-Editor-Skript 2/3: DataTables aus den exportierten JSONs erzeugen.   *** ENTWURF, in Unreal noch nie ausgefuehrt ***

Voraussetzung: C++-Modul "HighAbyssMira" mit Zeilen-Structs (jeweils USTRUCT(BlueprintType) : public FTableRowBase), siehe ARCHITEKTUR_UE.md §4:
    FHamDialogRow, FHamTaskRow, FHamThoughtRow, FHamItemRow, FHamLocationRow, FHamPuzzleRow, FHamCharacterRow
(Alternativ: UserDefinedStructs per Hand anlegen und STRUCT_PATHS unten anpassen, z. B. "/Game/HAM/Core/Data/Structs/S_DialogRow.S_DialogRow".)

Ablauf:  1) node app/tools/ue_export/export.js          (erzeugt docs/unreal/data/*.json)
         2) dieses Skript im Editor ausfuehren           (konvertiert nach "Name"-Arrays, legt DataTables unter /Game/HAM/Core/Data/Tables an)
UE-JSON-Regel: Array von Objekten, jedes mit "Name" (= Zeilenschluessel); Feldnamen muessen den Struct-Properties entsprechen (Gross-/Kleinschreibung egal).
Die Spalten-Mappings (FIELDS) sind bewusst schmal: lieber im Struct erweitern als hier alles durchreichen.
"""
import json
import os
import unreal

REPO = os.environ.get("HAM_REPO") or os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DATA = os.path.join(REPO, "docs", "unreal", "data")
DEST = "/Game/HAM/Core/Data/Tables"

STRUCT_PATHS = {
    "DT_Dialog":    "/Script/HighAbyssMira.HamDialogRow",
    "DT_Tasks":     "/Script/HighAbyssMira.HamTaskRow",
    "DT_Thoughts":  "/Script/HighAbyssMira.HamThoughtRow",
    "DT_Items":     "/Script/HighAbyssMira.HamItemRow",
    "DT_Locations": "/Script/HighAbyssMira.HamLocationRow",
    "DT_Puzzles":   "/Script/HighAbyssMira.HamPuzzleRow",
    "DT_Characters": "/Script/HighAbyssMira.HamCharacterRow",
}


def load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)


def rows_dialog():
    out = []
    for d in load("dialoge.json"):
        out.append({"Name": d["Name"], "Speaker": d.get("sprecher", ""), "SpeakerId": d.get("sprecherId", ""), "Text": d.get("text", ""),
                    "DurationMs": d.get("dauerMs") or 0, "SourceFile": d.get("datei", ""), "SourceLine": d.get("zeile", 0),
                    "SourceFunction": d.get("funktion", ""), "Beat": d.get("beat", ""), "Echo": d.get("echo", ""),
                    "ChapterGuess": d.get("kapitelModul") or []})
    return out


def rows_tasks():
    j = load("aufgaben.json")
    out = []
    for a in j["aufgaben"]:
        out.append({"Name": a["Name"], "Text": a.get("text", ""), "Kind": a.get("art", ""), "Index": a.get("index", -1), "Beat": a.get("beat", ""),
                    "SourceFile": a.get("datei", ""), "SourceLine": a.get("zeile", 0), "ChapterGuess": a.get("kapitelModul") or []})
    for n in j["nebenaufgaben"]:
        out.append({"Name": n["Name"], "Text": n.get("beschreibung", ""), "Title": n.get("titel", ""), "Kind": "side", "SourceFile": n.get("datei", ""), "SourceLine": n.get("zeile", 0)})
    return out


def rows_thoughts():
    return [{"Name": g["Name"], "Kind": g.get("art", ""), "ThoughtId": g.get("gedankeId", ""), "Context": g.get("anlass", "") or g.get("trifftAufgabe", ""), "Text": g.get("text", ""),
             "SourceFile": g.get("datei", ""), "SourceLine": g.get("zeile", 0)} for g in load("gedanken.json")]


def rows_items():
    return [{"Name": i["Name"], "Key": i["key"], "DisplayName": i.get("name", ""), "Description": i.get("beschreibung", ""), "Icon": i.get("icon", ""),
             "Dynamic": bool(i.get("dynamisch")), "GivenAt": [f"{v['datei']}:{v['zeile']}" for v in i.get("vergebenIn", [])]} for i in load("items.json")["items"]]


def rows_locations():
    o = load("orte.json")
    out = []
    for h in o["haeuser"]:
        out.append({"Name": h["Name"], "Kind": "house", "X": h.get("x", 0), "Z": h.get("z", 0), "Width": h.get("breite", 0), "Depth": h.get("tiefe", 0)})
    for e in o["echos"]:
        p = e.get("position") or [0, 0, 0]
        out.append({"Name": e["Name"], "Kind": "echo", "Title": e.get("titel", ""), "X": p[0], "Y": p[1], "Z": p[2]})
    for b in (o.get("kartenblaetter") or []):
        out.append({"Name": "MAP_" + b["id"], "Kind": "mapSheet", "Title": b.get("titel", ""), "X": b["x0"], "Z": b["z0"], "Width": b["x1"] - b["x0"], "Depth": b["z1"] - b["z0"]})
    return out  # Spiel-Koordinaten: Meter, x/z Bodenebene, y oben (Three.js). Umrechnung nach UE siehe ARCHITEKTUR_UE.md §3


def rows_puzzles():
    return [{"Name": p["Name"], "Number": p.get("nummer", ""), "Puzzle": p.get("raetsel", ""), "Solution": p.get("loesung", ""), "Hints": p.get("hinweise", ""), "Rating": p.get("bewertung", "")}
            for p in load("raetsel.json")["raetselTabellen"]]


def rows_characters():
    return [{"Name": c["Name"], "CharId": c["id"], "DisplayName": c.get("name", ""), "HeightM": c.get("hoehe", 0)} for c in load("figuren.json")["chars"]]


JOBS = [("DT_Dialog", rows_dialog), ("DT_Tasks", rows_tasks), ("DT_Thoughts", rows_thoughts), ("DT_Items", rows_items),
        ("DT_Locations", rows_locations), ("DT_Puzzles", rows_puzzles), ("DT_Characters", rows_characters)]


def make_table(asset_name, struct_path, rows):
    struct = unreal.load_object(None, struct_path)
    if not struct:
        unreal.log_error("Struct nicht gefunden: %s (C++-Modul gebaut? Editor neu gestartet?)" % struct_path)
        return
    full = "%s/%s" % (DEST, asset_name)
    if unreal.EditorAssetLibrary.does_asset_exist(full):
        table = unreal.EditorAssetLibrary.load_asset(full)
    else:
        factory = unreal.DataTableFactory()
        factory.set_editor_property("struct", struct)
        table = unreal.AssetToolsHelpers.get_asset_tools().create_asset(asset_name, DEST, unreal.DataTable, factory)
    ok = unreal.DataTableFunctionLibrary.fill_data_table_from_json_string(table, json.dumps(rows, ensure_ascii=False))
    unreal.EditorAssetLibrary.save_loaded_asset(table)
    unreal.log("%s: %d Zeilen, Import %s" % (asset_name, len(rows), "OK" if ok else "FEHLER (Feldnamen/Struct pruefen, Output Log lesen)"))


def main():
    unreal.EditorAssetLibrary.make_directory(DEST)
    for asset_name, fn in JOBS:
        try:
            make_table(asset_name, STRUCT_PATHS[asset_name], fn())
        except Exception as e:  # noqa
            unreal.log_error("%s: %s" % (asset_name, e))


main()
