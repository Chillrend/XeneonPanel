Set WshShell = CreateObject("WScript.Shell")
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir

Set fso = CreateObject("Scripting.FileSystemObject")
' Prioritize xeneon-agent.exe if compiled, otherwise run pythonw agent.py
If fso.FileExists(scriptDir & "\xeneon-agent.exe") Then
    WshShell.Run """" & scriptDir & "\xeneon-agent.exe""", 0, False
ElseIf fso.FileExists(scriptDir & "\agent.py") Then
    WshShell.Run "pythonw """ & scriptDir & "\agent.py""", 0, False
End If
