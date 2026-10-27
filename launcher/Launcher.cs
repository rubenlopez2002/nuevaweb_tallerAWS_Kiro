// Lanzador del Bingo: lleva dentro index.html, style.css, script.js y los audios (audio.zip).
// Los saca a una carpeta temporal y abre el juego en el navegador.
using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;

class Launcher
{
    static void Main()
    {
        string dir = Path.Combine(Path.GetTempPath(), "BingoLocal");
        Directory.CreateDirectory(dir);
        Assembly asm = Assembly.GetExecutingAssembly();

        foreach (string name in new string[] { "index.html", "style.css", "script.js" })
        {
            using (Stream s = asm.GetManifestResourceStream(name))
            using (FileStream f = File.Create(Path.Combine(dir, name)))
            {
                s.CopyTo(f);
            }
        }

        string audioDir = Path.Combine(dir, "audio");
        if (Directory.Exists(audioDir)) Directory.Delete(audioDir, true);
        using (Stream z = asm.GetManifestResourceStream("audio.zip"))
        using (ZipArchive zip = new ZipArchive(z, ZipArchiveMode.Read))
        {
            foreach (ZipArchiveEntry e in zip.Entries)
            {
                if (e.Name.Length == 0) continue;
                string rel = e.FullName.Replace('/', Path.DirectorySeparatorChar);
                string target = Path.Combine(dir, rel);
                Directory.CreateDirectory(Path.GetDirectoryName(target));
                e.ExtractToFile(target, true);
            }
        }

        Process.Start(new ProcessStartInfo(Path.Combine(dir, "index.html")) { UseShellExecute = true });
    }
}
