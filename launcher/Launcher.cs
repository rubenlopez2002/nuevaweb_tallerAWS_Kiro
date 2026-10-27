// Lanzador del Bingo: lleva dentro index.html, style.css y script.js.
// Los saca a una carpeta temporal y abre el juego en el navegador.
using System;
using System.Diagnostics;
using System.IO;
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
        Process.Start(new ProcessStartInfo(Path.Combine(dir, "index.html")) { UseShellExecute = true });
    }
}
