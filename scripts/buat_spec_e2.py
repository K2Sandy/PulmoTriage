with open('docs/desain-figma.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()
body_html = ''.join(lines[2251:2582])
full_html = f'''<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @font-face {{
      font-family: 'Fraunces';
      src: url('../frontend/app/fonts/Fraunces-VariableFont_opsz,SOFT,WONK,opsz.ttf');
    }}
    @font-face {{
      font-family: 'Atkinson Hyperlegible Next';
      src: url('../frontend/app/fonts/AtkinsonHyperlegibleNext-VariableFont_wght.ttf');
    }}
    @font-face {{
      font-family: 'Atkinson Hyperlegible Mono';
      src: url('../frontend/app/fonts/AtkinsonHyperlegibleMono-VariableFont_wght.ttf');
    }}
    body {{ margin: 0; padding: 0; background-color: #f3f4f6; }}
  </style>
</head>
<body>
{body_html}
</body>
</html>'''
with open('scripts/spec_e2.html', 'w', encoding='utf-8') as f:
    f.write(full_html)
print('scripts/spec_e2.html created successfully')
