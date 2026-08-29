import sys, asyncio
from playwright.async_api import async_playwright
async def main(url, out, w=1200, h=900):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': w, 'height': h})
        await pg.goto(url)
        await pg.wait_for_timeout(300)
        await pg.screenshot(path=out, full_page=True)
        await b.close()
asyncio.run(main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv)>3 else 1200, int(sys.argv[4]) if len(sys.argv)>4 else 900))
