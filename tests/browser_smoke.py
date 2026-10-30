from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page();errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
 page.goto('http://127.0.0.1:5173/');page.get_by_role('textbox',name='Texto',exact=True).fill('Hola, Auvioz. Esta descarga contiene voz real.')
 page.get_by_role('button',name='Generar audio').click()
 page.locator('.result audio').wait_for()
 page.wait_for_function("document.querySelector('.result audio').duration > 0")
 with page.expect_download() as info:page.locator('.result button').click()
 path=info.value.path();assert path.stat().st_size>1000
 page.reload();page.locator('.history-item').first.wait_for();assert page.locator('.history-item audio').count()==1
 locales=['es','en','pt','fr','de','it','ja','zh','ru','ar','hi','tr']
 for locale in locales:
  page.locator('header select').select_option(locale)
  assert page.locator('html').get_attribute('lang')==locale
  assert page.locator('h1').inner_text()
 page.locator('header select').select_option('ar');assert page.locator('html').get_attribute('dir')=='rtl'
 page.locator('header select').select_option('es')
 page.get_by_role('button',name='Traducir',exact=True).click();assert page.get_by_role('textbox',name='Origen',exact=True).count()==1
 print('translator API:',page.evaluate('!!window.Translator'),flush=True)
 page.get_by_role('button',name='Transcribir',exact=True).click();assert page.get_by_role('textbox',name='Transcripción',exact=True).count()==1
 page.set_viewport_size({'width':390,'height':844});page.get_by_role('button',name='Hablar',exact=True).first.click()
 assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 page.screenshot(path='/tmp/auvioz-mobile.png',full_page=True)
 assert not errors,errors
 print(json.dumps({'download_bytes':path.stat().st_size,'locales':12,'history_persisted':True,'mobile_overflow':False,'page_errors':errors}))
 b.close()
