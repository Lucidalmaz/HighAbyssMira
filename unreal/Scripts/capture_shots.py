"""Macht Kontrollbilder aus mehreren Blickwinkeln (Editor mit Grafik, nicht -Cmd).
Aufruf: UnrealEditor.exe HighAbyssMira.uproject /Game/Maps/Birkenhain -ExecutePythonScript="Scripts/capture_shots.py"
Die Bilder landen in Saved/Screenshots/HAM_*.png; danach beendet sich der Editor.
"""
import os, unreal

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), 'Saved', 'Screenshots', 'HAM')
os.makedirs(OUT, exist_ok=True)
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
UES = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem)
M = 100.
SHOTS = [  # Name, Position (m), Blick (yaw, pitch)
    ('01_start', (-66, 2, 1.7), (0, 2)),
    ('02_strasse', (-34, -1.5, 1.7), (12, 1)),
    ('03_nr7', (24, -4.5, 1.7), (-80, 6)),
    ('04_laterne', (18, 3.5, 1.7), (-20, 14)),
    ('05_kreuzung', (8, 12, 2.2), (-110, -2)),
    ('06_brandhaus', (-13, -8, 1.7), (-90, -4)),
]
state = {'i': 0, 'wait': 0, 'phase': 'warm'}

def set_view(pos, look):
    loc = unreal.Vector(pos[0] * M, pos[1] * M, pos[2] * M)
    UES.set_level_viewport_camera_info(loc, unreal.Rotator(roll=0, pitch=look[1], yaw=look[0]))

def tick(dt):
    s = state
    if s['phase'] == 'warm':  # Shader & Lumen einschwingen lassen
        s['wait'] += dt
        if s['wait'] > 25: s['phase'] = 'shoot'; s['wait'] = 0
        return
    if s['i'] >= len(SHOTS):
        s['wait'] += dt
        if s['wait'] > 6: unreal.unregister_slate_post_tick_callback(handle); unreal.SystemLibrary.quit_editor()
        return
    name, pos, look = SHOTS[s['i']]
    if s['wait'] == 0: set_view(pos, look)
    s['wait'] += dt
    if s['wait'] > 4.5:  # Lumen braucht ein paar Sekunden nach jedem Kameraschnitt
        unreal.AutomationLibrary.take_high_res_screenshot(1600, 900, os.path.join(OUT, f'HAM_{name}.png'))
        unreal.log(f'HAM: Screenshot {name}')
        s['i'] += 1; s['wait'] = 0

unreal.SystemLibrary.execute_console_command(None, 'r.ScreenPercentage 100')
handle = unreal.register_slate_post_tick_callback(tick)
