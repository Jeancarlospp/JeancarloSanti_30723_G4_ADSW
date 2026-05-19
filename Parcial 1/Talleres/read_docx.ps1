Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-DocxText ($path) {
    if (Test-Path $path) {
        $zip = [System.IO.Compression.ZipFile]::OpenRead($path)
        $entry = $zip.GetEntry('word/document.xml')
        if ($entry) {
            $stream = $entry.Open()
            $reader = New-Object System.IO.StreamReader($stream)
            $xml = $reader.ReadToEnd()
            $reader.Close()
            $stream.Close()
            $zip.Dispose()
            return $xml -replace '<[^>]+>', ' '
        }
        $zip.Dispose()
        return "No word/document.xml found"
    } else {
        return "File not found: $path"
    }
}

Write-Host "--- DOC 1 ---"
Get-DocxText "C:\Users\Sjean\Desktop\Universidad ESPE\Sexto Semestre Ing.Software\ADSW\JeancarloSanti_30723_G4_ADSW\Parcial 1\Talleres\01_Guia_PlantUML_CU_Analisis_CRUD_EstudianteOK.docx"
Write-Host "--- DOC 2 ---"
Get-DocxText "C:\Users\Sjean\Desktop\Universidad ESPE\Sexto Semestre Ing.Software\ADSW\JeancarloSanti_30723_G4_ADSW\Parcial 1\Talleres\02_Guia_2_casos_de_uso_clases_y_secuencia_CRUD.docx"
