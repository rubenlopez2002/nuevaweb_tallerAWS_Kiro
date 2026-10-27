param([string]$OutDir)
# Genera audio/<idioma>/<n>.wav con voces masculinas de Windows (WinRT).
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[void][Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType = WindowsRuntime]
[void][Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]

$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, $type) {
    $t = $asTask.MakeGenericMethod($type).Invoke($null, @($op))
    $t.Wait() | Out-Null
    $t.Result
}

$want = @{ es = 'Pablo'; en = 'David'; fr = 'Paul'; de = 'Stefan' }
$all = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices
foreach ($lang in $want.Keys) {
    $voice = $all | Where-Object { $_.DisplayName -like "*$($want[$lang])" } | Select-Object -First 1
    $dir = Join-Path $OutDir $lang
    New-Item -ItemType Directory -Force $dir | Out-Null
    $synth = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
    $synth.Voice = $voice
    for ($n = 1; $n -le 90; $n++) {
        $stream = Await ($synth.SynthesizeTextToStreamAsync([string]$n)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
        $size = [uint32]$stream.Size
        $reader = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
        [void](Await ($reader.LoadAsync($size)) ([uint32]))
        $bytes = New-Object byte[] $size
        $reader.ReadBytes($bytes)
        [IO.File]::WriteAllBytes((Join-Path $dir "$n.wav"), $bytes)
        $reader.Dispose(); $stream.Dispose()
    }
    "$lang -> $($voice.DisplayName) OK"
}
