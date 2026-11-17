"""Genera la versión portable (un solo .html sin internet) y la versión para publicar."""
import base64, re, pathlib
R = pathlib.Path(__file__).parent
SRC = R / 'src'
DIST = R

def b64(path): return base64.b64encode(path.read_bytes()).decode()

def css_inline(rel):
    path = SRC / rel
    css = path.read_text(encoding='utf-8')
    # KaTeX: deja sólo woff2 y lo embebe
    css = re.sub(r'src:url\((fonts/[^)]+\.woff2)\) format\("woff2"\)(,url\([^)]+\) format\("[a-z]+"\))*',
                 lambda m: f'src:url(data:font/woff2;base64,{b64(path.parent / m.group(1))}) format("woff2")', css)
    css = re.sub(r'url\((\.\./vendor/fuentes/[^)]+\.woff2)\)',
                 lambda m: f'url(data:font/woff2;base64,{b64((path.parent / m.group(1)).resolve())})', css)
    return css

html = (SRC / 'index.html').read_text(encoding='utf-8')
cabeza = re.search(r'<!--@CABEZA-->(.*?)<!--@/CABEZA-->', html, re.S).group(1).strip()
cuerpo = re.search(r'<!--@CUERPO-->(.*?)<!--@/CUERPO-->', html, re.S).group(1).strip()
estilos = '\n'.join([
    '<style>\n' + (SRC / 'css/estilos.css').read_text(encoding='utf-8') + '\n</style>',
    '<!-- Fuentes y estilos de KaTeX embebidos (no editar) -->',
    '<style>' + css_inline('css/fuentes.css') + '</style>',
    '<style>' + css_inline('vendor/katex/katex.min.css') + '</style>',
])
app = '\n'.join(f'<script>\n{(SRC / "js" / f).read_text(encoding='utf-8')}\n</script>' for f in
                ['1-aritmetica.js', '2-motor.js', '3-latex.js', '4-graficas.js', '5-interfaz.js'])
katex_local = '<!-- KaTeX 0.16.11 (biblioteca para dibujar LaTeX, embebida) -->\n<script>' + (SRC / 'vendor/katex/katex.min.js').read_text(encoding='utf-8') + '</script>'
katex_cdn = '<script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.js"></script>'

portable = f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{cabeza}
{estilos}
</head>
<body>
{cuerpo}
{app}
{katex_local}
</body>
</html>
'''
(DIST / '3CM3_NGED_( G04_Ecuaciones_de_Segundo_Orden )_ED.html').write_text(portable, encoding='utf-8')
print('Listo: 3CM3_NGED_( G04_Ecuaciones_de_Segundo_Orden )_ED.html', len(portable)//1024, 'KB')
