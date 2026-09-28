"""Prüft, ob der Spieler-Blueprint und der Spielmodus alle referenzierten Assets finden."""
import os, unreal

AR = unreal.AssetRegistryHelpers.get_asset_registry()
EAL = unreal.EditorAssetLibrary
opts = unreal.AssetRegistryDependencyOptions(include_soft_package_references=True, include_hard_package_references=True)
out = []
todo = ['/Game/FirstPerson/Blueprints/BP_FirstPersonCharacter', '/Game/FirstPerson/Blueprints/BP_FirstPersonGameMode',
        '/Game/FirstPerson/Blueprints/BP_FirstPersonPlayerController', '/Game/FirstPerson/Anims/ABP_FP_Copy']
seen = set()
while todo:
    pkg = todo.pop()
    if pkg in seen: continue
    seen.add(pkg)
    for d in AR.get_dependencies(pkg, opts) or []:
        d = str(d)
        if not d.startswith('/Game/'): continue
        if not EAL.does_asset_exist(d): out.append(f'FEHLT: {d}  (gebraucht von {pkg})')
        else: todo.append(d)
bp = unreal.load_asset('/Game/FirstPerson/Blueprints/BP_FirstPersonCharacter')
out.append(f'BP_FirstPersonCharacter geladen: {bp is not None}; geprüfte Pakete: {len(seen)}')
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'check_player_log.txt'), 'w', encoding='utf-8').write('\n'.join(out))
