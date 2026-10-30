from playwright.sync_api import sync_playwright
import os
base=os.environ.get('AUVIOZ_TEST_URL','http://127.0.0.1:3003')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width,number in [(390,1),(1440,2)]:
  page=b.new_page(locale='es-ES',viewport={'width':width,'height':850})
  page.goto(base)
  video=page.locator('video');assert video.get_attribute('src').endswith(f'_{number}.mp4')
  page.wait_for_function('document.querySelector("video").currentTime > 0 || !!document.querySelector(".intro-play")')
  if page.locator('.intro-play').count(): page.locator('.intro-play').click()
  page.wait_for_function('document.querySelector("video").currentTime > 0')
  assert page.locator('video').evaluate('v=>!v.muted')
  assert page.locator('.welcome-intro').evaluate("el=>!el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}))")
  if number==1:page.get_by_role('button',name='Omitir intro').click()
  else:page.locator('.welcome-intro').wait_for(state='detached',timeout=12000)
  page.locator('header').wait_for();page.close()
 page=b.new_page(reduced_motion='reduce');page.goto(base);page.locator('header').wait_for();assert page.locator('video').count()==0
 page=b.new_page();page.route('**/media/**',lambda route:route.abort());page.goto(base);page.locator('header').wait_for(timeout=12000)
 response=page.request.get(base+'/media/Auvioz_app_logo_animation_2.mp4',headers={'Range':'bytes=0-99'})
 assert response.status==206 and len(response.body())==100 and response.headers['content-type']=='video/mp4'
 print('PASS: mobile/desktop playback, skip/end, reduced motion, failed-video fallback, blocked context menu and MP4 range response.')
 b.close()
