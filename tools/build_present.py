"""Regenerate present.html from index.html.

The slides reuse the diagrams and text blocks of the main page, so run this after editing index.html:

    python3 tools/build_present.py

Slide wording that exists only in the presentation is written in this file.
"""
import os, re
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
src = open('index.html').read()

def grab(pattern):
    m = re.search(pattern, src, re.S)
    assert m, pattern
    return m.group(0)

hero = grab(r'<svg class="hero-art cells".*?</svg>\s*(?=</div>\s*</section>)')
hero = hero.strip()
tract = grab(r'<svg class="tract" id="tract".*?</svg>')
cycle = grab(r'<div class="cycle">.*?</figure>\s*</div>\s*</div>')
step_art = re.findall(r'<div class="art">(<svg class="cells" viewBox="0 0 120 120".*?</svg>)</div>', src, re.S)
tl_art = re.findall(r'<div class="art">(<svg class="cells" viewBox="0 0 40 40".*?</svg>)</div>', src, re.S)
assert len(step_art) == 4 and len(tl_art) == 5, (len(step_art), len(tl_art))
# Drop the hero entrance glow so it doesn't replay oddly; keep the swim animation.
organs = [
    ("ovaries", "Ovaries", "Hold the follicles, release one egg each cycle, and make estrogen and progesterone."),
    ("tubes", "Fallopian tubes", "Fimbriae catch the egg. Fertilization happens in the ampulla."),
    ("uterus", "Uterus", "A muscular, pear-sized organ where the embryo implants and grows."),
    ("endometrium", "Endometrium", "The lining that thickens each month, and is shed if no embryo implants."),
    ("cervix", "Cervix", "The neck of the uterus. Its mucus thins around ovulation to let sperm through."),
    ("vagina", "Vagina", "The elastic canal to the outside: the birth canal and route for menstrual flow."),
    ("vulva", "Vulva", "The external structures, the labia, clitoris and vestibule, which protect the organs inside."),
]
organ_li = "\n".join(f'          <li data-part="{p}"><b>{n}</b><p>{d}</p></li>' for p, n, d in organs)

steps = [
    ("Sperm reach the egg", "A few hundred of millions make it to the ampulla and push through the corona radiata."),
    ("The acrosome reaction", "Enzymes from the sperm's acrosome digest a path through the zona pellucida."),
    ("One sperm fuses", "The cortical reaction hardens the zona and shuts every other sperm out."),
    ("A zygote forms", "Two pronuclei of 23 chromosomes each combine: 46, a new individual."),
]
step_li = "\n".join(
    f'''        <li data-step><div class="art">{a}</div><h3><i>{k+1}</i>{t}</h3><p>{d}</p></li>'''
    for k, (a, (t, d)) in enumerate(zip(step_art, steps)))

week = [
    ("Day 0", "Zygote", "Ampulla", "", "One cell, 46 chromosomes"),
    ("Day 1–2", "Cleavage", "Fallopian tube", "", "First division at about 30 hours"),
    ("Day 3–4", "Morula", "Entering uterus", "", "A solid ball of 16+ cells"),
    ("Day 5", "Blastocyst", "Uterus", " uterus", "Hollow, with an inner cell mass"),
    ("Day 6–10", "Implantation", "Endometrium", " uterus", "Burrows in and starts making hCG"),
]
week_li = "\n".join(
    f'''        <li data-step><div class="when">{w}</div><div class="art">{a}</div><h3>{t}</h3><p class="where{c}">{where}</p><p>{d}</p></li>'''
    for a, (w, t, where, c, d) in zip(tl_art, week))

def block(pattern):
    m = re.search(pattern, src, re.S)
    assert m, pattern
    return m.group(0)

# Follicle stages, journey stops, hormone cards: same markup as the site, revealed one at a time.
follicles = block(r'<ol class="follicles">.*?</ol>').replace('<li>', '<li data-step>')
route = block(r'<ol class="route">.*?</ol>').replace('<li>', '<li data-step>')
hormones = block(r'<div class="hormones">.*?</ul>\s*</div>')
hormones = re.sub(r'<h3 class="sub-h">.*?</h3>\s*', '', hormones).replace('<li>', '<li data-step>')
health = block(r'<div class="health">.*?</div>\s*(?=<blockquote)')
health = re.sub(r'<section aria-labelledby', '<section data-step aria-labelledby', health)
quote = block(r'<blockquote class="closing">.*?</blockquote>')
thumbs = re.findall(r'<img src="(assets/posters/[^"]+-thumb-560\.webp)"[^>]*alt="([^"]*)"', src)
assert len(thumbs) >= 1, len(thumbs)
poster_wall = "\n".join(f'        <img src="{u}" alt="" loading="lazy" decoding="async">' for u, a in thumbs)
n_posters = len(thumbs)

page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>From Two Cells to Life — Presentation</title>
<meta name="description" content="Full-screen presentation mode for the From Two Cells to Life anatomy exhibit.">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#17122e">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="manifest" href="manifest.webmanifest">
<link rel="preload" href="assets/fonts/two-cells-sans.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css">
<link rel="stylesheet" href="assets/css/present.css">
<script src="assets/js/main.js" defer></script>
<script src="assets/js/present.js" defer></script>
</head>
<body>
<!-- Generated by tools/build_present.py from index.html. Do not edit by hand: change index.html or the script, then re-run it. -->
<main class="stage" aria-roledescription="slideshow" aria-label="From Two Cells to Life">

  <section class="slide s-title" aria-roledescription="slide" aria-label="Title" data-duration="10000">
    <div>
      <p class="event">Anatomy Working Model Making Competition cum Exhibition</p>
      <h1><span>From two cells</span> <span>to life</span></h1>
      <p class="tagline">Designed for life. Built for wonder.</p>
      <p class="lede">How the female body prepares, every month, for one sperm and one egg to meet.</p>
      <p class="who" id="who"></p>
    </div>
    {hero}
    <div class="qr-tile">
      <div class="qr-slot"></div>
      <p><b>Explore it yourself</b>Scan with your phone camera</p>
    </div>
  </section>

  <section class="slide s-organs" aria-roledescription="slide" aria-label="The organs" data-hook="organs">
    <header>
      <h2>A system built for one meeting</h2>
    </header>
    {tract}
    <ul class="p-organs">
{organ_li}
    </ul>
  </section>

  <section class="slide s-ovary" aria-roledescription="slide" aria-label="Inside the ovary">
    <header>
      <h2>Inside the ovary</h2>
      <p class="kicker">Making an egg, oogenesis, starts before birth. Each cycle a few follicles grow and usually one finishes.</p>
    </header>
    {follicles}
  </section>

  <section class="slide s-cycle" aria-roledescription="slide" aria-label="The menstrual cycle" data-hook="cycle">
    <header>
      <h2>The cycle, day by day</h2>
      <p class="kicker">The ovary and the uterus run two linked cycles, driven by four hormones.</p>
    </header>
    {cycle}
  </section>

  <section class="slide s-hormones" aria-roledescription="slide" aria-label="The four hormones">
    <header>
      <h2>The four hormones</h2>
      <p class="kicker">Two from the brain's pituitary gland, two from the ovary, passing control back and forth.</p>
    </header>
    {hormones}
  </section>

  <section class="slide s-journey" aria-roledescription="slide" aria-label="The sperm's journey">
    <header>
      <h2>The sperm’s journey</h2>
      <p class="kicker">Millions set off. A few hundred reach the egg. One gets in.</p>
    </header>
    {route}
  </section>

  <section class="slide s-fert" aria-roledescription="slide" aria-label="Fertilization">
    <header>
      <h2>Two cells become one</h2>
      <p class="kicker">Fertilization happens in the ampulla of the fallopian tube. Only one sperm gets in.</p>
    </header>
    <ol class="p-steps cells">
{step_li}
    </ol>
  </section>

  <section class="slide s-week" aria-roledescription="slide" aria-label="The first week">
    <header>
      <h2>The first week</h2>
      <p class="kicker">The zygote divides again and again as it travels to the uterus.</p>
    </header>
    <ol class="p-week">
{week_li}
    </ol>
  </section>

  <section class="slide s-health" aria-roledescription="slide" aria-label="Caring for the system">
    <header>
      <h2>Caring for the system</h2>
    </header>
    {health}
    {quote}
  </section>

  <section class="slide s-facts" aria-roledescription="slide" aria-label="Facts">
    <header><h2>By the numbers</h2></header>
    <div class="p-facts">
      <div data-step><strong>1–2 million</strong><span>immature eggs in the ovaries at birth</span></div>
      <div data-step><strong>300,000–400,000</strong><span>still left by puberty</span></div>
      <div data-step><strong>400–500</strong><span>eggs released over a lifetime</span></div>
      <div data-step><strong>12–24 hours</strong><span>for a released egg to be fertilized</span></div>
      <div data-step><strong>Up to 5 days</strong><span>that sperm survive in the reproductive tract</span></div>
      <div data-step><strong>A few hundred</strong><span>of the millions of sperm reach the egg</span></div>
    </div>
  </section>

  <section class="slide s-posters" aria-roledescription="slide" aria-label="Posters" data-duration="12000">
    <div class="poster-wall" aria-hidden="true">
{poster_wall}
    </div>
    <div class="poster-cta">
      <h2>Take the posters home</h2>
      <p class="kicker">All {n_posters} of our posters are on the website, ready to view or download.</p>
      <div class="qr-tile">
        <div class="qr-slot" data-hash="#posters"></div>
        <p><b>Scan for the posters</b>Opens the poster gallery</p>
      </div>
    </div>
  </section>

  <section class="slide s-quiz" aria-roledescription="slide" aria-label="Take the quiz" data-duration="14000">
    <div>
      <h2>Test yourself</h2>
      <p class="kicker">Scan the code to take the 15-question quiz on your phone. Can you get them all?</p>
      <p class="url" id="quiz-url"></p>
    </div>
    <div class="qr-big qr-slot" data-hash="#quiz" data-url-out="quiz-url"></div>
  </section>

  <div class="brandline">From Two Cells to Life</div>
  <div class="counter" aria-live="polite"></div>
  <div class="progress" aria-hidden="true"><i></i></div>
</main>

<div class="controls" role="toolbar" aria-label="Presentation controls">
  <button type="button" id="prev" aria-label="Previous"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 2.5 5 8l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>
  <button type="button" id="next" aria-label="Next"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 2.5 11 8l-5.5 5.5" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>
  <button type="button" id="kiosk" aria-pressed="false">Auto-play</button>
  <button type="button" id="fs" aria-pressed="false">Full screen</button>
  <a href="./">Exit</a>
</div>
<p class="hint" role="note">Use <kbd>←</kbd> <kbd>→</kbd> or a clicker · <kbd>F</kbd> full screen · <kbd>K</kbd> auto-play</p>
</body>
</html>
'''
open('present.html', 'w').write(page)
print(len(page))
