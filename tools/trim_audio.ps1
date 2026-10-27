param([string]$Dir)
# Quita el silencio del principio y del final de cada wav (16 bits, mono) y reescribe la cabecera.
Get-ChildItem $Dir -Recurse -Filter *.wav | ForEach-Object {
    $b = [IO.File]::ReadAllBytes($_.FullName)
    $rate = [BitConverter]::ToUInt32($b, 24)
    # buscar el trozo "data"
    $pos = 12
    while ($pos -lt $b.Length - 8) {
        $id = [Text.Encoding]::ASCII.GetString($b, $pos, 4)
        $len = [BitConverter]::ToUInt32($b, $pos + 4)
        if ($id -eq 'data') { break }
        $pos += 8 + $len
    }
    $start = $pos + 8
    $count = [int][Math]::Min($len, $b.Length - $start) / 2
    $first = -1; $last = -1
    for ($i = 0; $i -lt $count; $i++) {
        $s = [BitConverter]::ToInt16($b, $start + 2 * $i)
        if ([Math]::Abs($s) -gt 400) { if ($first -lt 0) { $first = $i }; $last = $i }
    }
    if ($first -lt 0) { return }
    $pad = [int]($rate * 0.05)
    $from = [Math]::Max(0, $first - $pad)
    $to = [Math]::Min($count - 1, $last + $pad)
    $n = ($to - $from + 1) * 2
    $out = New-Object byte[] (44 + $n)
    [Text.Encoding]::ASCII.GetBytes('RIFF').CopyTo($out, 0)
    [BitConverter]::GetBytes([uint32](36 + $n)).CopyTo($out, 4)
    [Text.Encoding]::ASCII.GetBytes('WAVEfmt ').CopyTo($out, 8)
    [BitConverter]::GetBytes([uint32]16).CopyTo($out, 16)
    [BitConverter]::GetBytes([uint16]1).CopyTo($out, 20)
    [BitConverter]::GetBytes([uint16]1).CopyTo($out, 22)
    [BitConverter]::GetBytes([uint32]$rate).CopyTo($out, 24)
    [BitConverter]::GetBytes([uint32]($rate * 2)).CopyTo($out, 28)
    [BitConverter]::GetBytes([uint16]2).CopyTo($out, 32)
    [BitConverter]::GetBytes([uint16]16).CopyTo($out, 34)
    [Text.Encoding]::ASCII.GetBytes('data').CopyTo($out, 36)
    [BitConverter]::GetBytes([uint32]$n).CopyTo($out, 40)
    [Array]::Copy($b, $start + 2 * $from, $out, 44, $n)
    [IO.File]::WriteAllBytes($_.FullName, $out)
}
