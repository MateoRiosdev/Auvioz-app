from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 ctx=b.new_context(locale='es-PE',reduced_motion='reduce')
 ctx.add_init_script('''
 window.__spoken=[];
 window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
 Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{name:'Jorge',voiceURI:'jorge',lang:'es-ES'},{name:'Lucia',voiceURI:'lucia',lang:'es-ES'},{name:'English',voiceURI:'en',lang:'en-US'}],addEventListener(){},removeEventListener(){},cancel(){},speak(u){window.__spoken.push({text:u.text,voice:u.voice.voiceURI});setTimeout(()=>u.onend?.(),50);}}});
 ''')
 page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:5174');page.locator('header').wait_for()
 assert page.locator('html').get_attribute('lang')=='es'
 assert page.get_by_text('Frecuencia de muestreo',exact=True).count()==0
 page.get_by_role('textbox',name='Texto',exact=True).fill('Hola, prueba del historial.')
 page.get_by_role('button',name='Generar audio').click()
 page.locator('.history-item').wait_for()
 assert page.evaluate('window.__spoken[0].voice')=='jorge'
 page.reload();page.locator('.history-item').wait_for()
 page.locator('.history-item').get_by_role('button',name='▶ Hablar',exact=True).click()
 assert page.locator('.history-timeline output').inner_text().startswith('≈')
 page.locator('.history-timeline input').fill('1')
 page.wait_for_function('window.__spoken.length > 1')
 assert page.evaluate('window.__spoken.at(-1).text') != 'Hola, prueba del historial.'
 assert page.evaluate('window.__spoken[0].text')=='Hola, prueba del historial.'
 page.get_by_role('button',name='Traducir',exact=True).click()
 page.get_by_role('textbox',name='Origen',exact=True).fill('Texto para escuchar')
 page.get_by_role('button',name='Hablar · Origen',exact=True).click()
 assert page.get_by_role('button',name='Copiar · Origen').is_enabled()
 assert page.evaluate('window.__spoken.at(-1).text')=='Texto para escuchar'
 page.locator('header .choice-trigger').click();assert page.get_by_role('option').count()==10;page.get_by_role('option',name='English',exact=True).click()
 assert page.locator('html').get_attribute('lang')=='en'
 page.reload();page.locator('header').wait_for();assert page.locator('html').get_attribute('lang')=='en'
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 assert ' '.join(page.locator('footer').inner_text().split())=='© 2026 — (MateoRiosdev) · Todos los derechos reservados'
 assert not errors,errors
 print('PASS: browser speech adapter, voice choice, persistent history/replay, translator actions, locale detection/persistence, dropdown, footer and mobile layout.')
 fresh=b.new_context(locale='en-US',reduced_motion='reduce');q=fresh.new_page();q.goto('http://127.0.0.1:5174');q.locator('header').wait_for();assert q.locator('html').get_attribute('lang')=='en'
 b.close()
