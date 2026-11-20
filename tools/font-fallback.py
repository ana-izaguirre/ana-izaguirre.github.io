#!/usr/bin/env python3
"""
Size-matched fallback metrics for the web fonts.

While Fraunces and Nunito load, a system font stands in. If it has different
proportions, the page reflows when the web font arrives (CLS). This computes
size-adjust and ascent/descent/line-gap overrides that make a system font take
the same room as the web font, for the "... Fallback" @font-face rules in
index.html.

Width is averaged over the characters the page actually uses, so the result
fits this text rather than the alphabet. Liberation Serif and Liberation Sans
are metric-compatible with Times New Roman and Arial, so one set of values
covers Windows, macOS and Linux.

Usage:  python3 tools/font-fallback.py   (needs fontTools and fc-match; dev only)
"""
import html
import re
import subprocess
from fontTools.ttLib import TTFont

PAGE = 'index.html'
FONTS = [('Fraunces', 'fonts/fraunces.woff2', 'Liberation Serif'),
         ('Nunito', 'fonts/nunito.woff2', 'Liberation Sans')]


def page_text():
    src = open(PAGE, encoding='utf-8').read()
    src = re.sub(r'<(script|style|svg)[\s\S]*?</\1>', '', src)
    return html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', src)))


def metrics(path, text):
    """Average advance width over the text, and vertical metrics, in em."""
    font = TTFont(path)
    cmap, hmtx, upm = font.getBestCmap(), font['hmtx'].metrics, font['head'].unitsPerEm
    widths = [hmtx[cmap[ord(c)]][0] for c in text if ord(c) in cmap]
    hhea = font['hhea']
    return sum(widths) / len(widths) / upm, hhea.ascent / upm, -hhea.descent / upm, hhea.lineGap / upm


def main():
    text = page_text()
    for name, web, fallback in FONTS:
        path = subprocess.check_output(['fc-match', '-f', '%{file}', fallback]).decode()
        w, asc, desc, gap = metrics(web, text)
        fw = metrics(path, text)[0]
        size = w / fw
        print(f'{name}: size-adjust:{size * 100:.2f}%;ascent-override:{asc / size * 100:.2f}%;'
              f'descent-override:{desc / size * 100:.2f}%;line-gap-override:{gap / size * 100:.2f}%')


if __name__ == '__main__':
    main()
