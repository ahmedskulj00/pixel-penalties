"""Browser QA for dist/index.html: plays a tournament match end to end and screenshots each step.

Usage: python3 scripts/qa.py [desktop|mobile|dark|quick|all]
Fonts are served locally from @fontsource packages because the sandbox has no Google Fonts access.
"""
import asyncio
import base64
import sys
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = Path('/tmp/qa')
OUT.mkdir(exist_ok=True)
FONTS = Path('/tmp/fonts/node_modules/@fontsource')


def face(family, rel, weight):
    data = base64.b64encode((FONTS / rel).read_bytes()).decode()
    return (
        f"@font-face{{font-family:'{family}';font-style:normal;font-weight:{weight};font-display:block;"
        f"src:url(data:font/woff2;base64,{data}) format('woff2');}}"
    )


FONT_CSS = ''.join(
    [face('Press Start 2P', 'press-start-2p/files/press-start-2p-latin-400-normal.woff2', 400)]
    + [face('Pixelify Sans', f'pixelify-sans/files/pixelify-sans-latin-{w}-normal.woff2', w) for w in (400, 500, 600, 700)]
    + [face('Atkinson Hyperlegible', f'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-{w}-normal.woff2', w) for w in (400, 700)]
)

import os
URL = (ROOT / 'dist' / os.environ.get('QA_FILE', 'index.html')).as_uri()


async def open_page(browser, name, viewport, scheme='light', reduced=False):
    ctx = await browser.new_context(
        viewport=viewport,
        color_scheme=scheme,
        reduced_motion='reduce' if reduced else 'no-preference',
        device_scale_factor=1,
        has_touch=viewport['width'] < 600,
    )
    page = await ctx.new_page()
    errors = []
    page.on('console', lambda m: errors.append(f'console.{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
    page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
    await page.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=FONT_CSS))
    await page.route('https://fonts.gstatic.com/**', lambda r: r.abort())
    await page.goto(URL)
    await page.evaluate('document.fonts.ready')
    await page.wait_for_timeout(200)
    return ctx, page, errors


async def shot(page, name, full=False):
    await page.screenshot(path=str(OUT / f'{name}.png'), full_page=full)


async def phase(page):
    checks = [
        ('intro', page.get_by_role('button', name='Start the shootout')),
        ('aim', page.get_by_role('group', name='Choose where to shoot')),
        ('strike', page.locator('.meter')),
        ('dive', page.get_by_role('group', name='Choose which way to dive')),
        ('result', page.get_by_role('button', name='Next kick')),
        ('result', page.get_by_role('button', name='See the result')),
        ('done', page.get_by_role('button', name='Back to the bracket')),
        ('done', page.get_by_role('button', name='Back to the groups')),
        ('done', page.get_by_role('button', name='Back to the table')),
        ('done', page.get_by_role('button', name='Rematch')),
    ]
    for label, loc in checks:
        if await loc.count():
            return label
    return 'kick'


async def play_match(page, prefix, max_steps=600):
    seen = set()
    zones = ['a', 'e', 'd', 's', 'q', 'a', 'd', 'w']
    kick = 0
    for _ in range(max_steps):
        p = await phase(page)
        if p == 'intro':
            await shot(page, f'{prefix}-intro')
            await page.keyboard.press('Space')
        elif p == 'aim':
            if 'aim' not in seen:
                await shot(page, f'{prefix}-aim')
            await page.keyboard.press(zones[kick % len(zones)])
            kick += 1
        elif p == 'strike':
            await page.wait_for_timeout(1300)
            if 'strike' not in seen:
                await shot(page, f'{prefix}-strike')
            # Strike when the marker is near the centre (it sweeps a triangle wave).
            await page.wait_for_function(
                "() => { const t = document.querySelector('.meter__track'); if (!t) return true;"
                " const m = /translateX\\(([-\\d.]+)%\\)/.exec(t.style.transform); return !m || Math.abs(parseFloat(m[1]) - 50) < 4; }",
                timeout=5000,
            )
            await page.keyboard.press('Space')
            if 'flight' not in seen:
                await page.wait_for_timeout(760)
                await shot(page, f'{prefix}-flight')
                seen.add('flight')
        elif p == 'dive':
            if 'dive' not in seen:
                await shot(page, f'{prefix}-dive')
            await page.keyboard.press(['a', 'd', 's'][kick % 3])
            kick += 1
        elif p == 'result':
            if 'result' not in seen:
                await page.wait_for_timeout(450)
                await shot(page, f'{prefix}-result')
            await page.keyboard.press('Space')
        elif p == 'done':
            await page.wait_for_timeout(400)
            await shot(page, f'{prefix}-done')
            return True
        else:
            await page.wait_for_timeout(150)
            continue
        seen.add(p)
        await page.wait_for_timeout(250)
    return False


async def tournament_flow(browser, prefix, viewport, scheme='light'):
    ctx, page, errors = await open_page(browser, prefix, viewport, scheme)
    await shot(page, f'{prefix}-01-home')
    await page.get_by_role('button', name='Tournament').first.click()
    await page.wait_for_timeout(150)
    await shot(page, f'{prefix}-02-competitions')
    await page.get_by_role('button', name='European Championship').first.click()
    await page.wait_for_timeout(150)
    await shot(page, f'{prefix}-03-editions')
    await page.locator('.ed-card', has_text='1976').first.click()
    await page.wait_for_timeout(150)
    await shot(page, f'{prefix}-04-nations')
    await page.get_by_role('button', name='Czechoslovakia').first.click()
    await page.get_by_role('button', name='Start tournament').click()
    await page.wait_for_timeout(200)
    await shot(page, f'{prefix}-05-bracket', full=True)
    await page.get_by_role('button', name='Take the shootout').click()
    await page.wait_for_timeout(250)
    await shot(page, f'{prefix}-06-howto')
    await page.get_by_role('button', name='Close').click()
    await page.wait_for_timeout(150)
    ok = await play_match(page, f'{prefix}-m1')
    if ok:
        await page.get_by_role('button', name='Back to the bracket').click()
        await page.wait_for_timeout(250)
        await shot(page, f'{prefix}-07-after', full=True)
    await ctx.close()
    return ok, errors


async def quick_flow(browser, prefix, viewport, scheme='light'):
    ctx, page, errors = await open_page(browser, prefix, viewport, scheme)
    await page.get_by_role('button', name='Quick shootout').click()
    await page.get_by_role('button', name='Wales').first.click()
    await page.get_by_role('button', name='Scotland').first.click()
    await shot(page, f'{prefix}-01-quick')
    await page.get_by_role('button', name='To the spot').click()
    await page.wait_for_timeout(200)
    close = page.get_by_role('button', name='Close')
    if await close.count():
        await close.click()
    ok = await play_match(page, f'{prefix}-m')
    await page.get_by_role('button', name='Settings').click()
    await page.wait_for_timeout(200)
    await shot(page, f'{prefix}-02-settings')
    await ctx.close()
    return ok, errors


async def main(which):
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        runs = {
            'desktop': lambda: tournament_flow(browser, 'd', {'width': 1280, 'height': 800}),
            'dark': lambda: tournament_flow(browser, 'n', {'width': 1280, 'height': 800}, 'dark'),
            'mobile': lambda: tournament_flow(browser, 'p', {'width': 390, 'height': 844}),
            'quick': lambda: quick_flow(browser, 'q', {'width': 1024, 'height': 700}),
        }
        for name in runs if which == 'all' else [which]:
            ok, errors = await runs[name]()
            print(f'{name}: match completed={ok}; {len(errors)} console problems')
            for e in errors[:12]:
                print('   ', e[:300])
        await browser.close()


asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else 'desktop'))
