from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(locale="es-ES",reduced_motion="reduce")
 page.add_init_script('''
 window.__translated=[];
 Object.defineProperty(window,'Translator',{value:{availability:async()=> 'downloadable',create:async options=>{options.monitor({addEventListener:(name,fn)=>fn({loaded:1})});return {translate:async text=>{window.__translated.push(text);return 'Hello, world';},destroy:()=>{}};}}});
 class FakeRecognition { start(track){window.__track=!!track;setTimeout(()=>{this.onstart?.();const result=[{transcript:'Texto reconocido'}];result.isFinal=true;this.onresult?.({resultIndex:0,results:[result]});this.onend?.();},20);}stop(){this.onend?.();}abort(){} }
 Object.defineProperty(window,'SpeechRecognition',{value:FakeRecognition});
 ''')
 page.goto('http://127.0.0.1:5173/')
 page.get_by_role('button',name='Traducir',exact=True).click()
 page.get_by_role('textbox',name='Origen',exact=True).fill('Hola, mundo')
 page.get_by_role('button',name='Traducir texto',exact=True).click()
 page.wait_for_function("document.querySelector('textarea[readonly]').value === 'Hello, world'")
 assert page.evaluate('window.__translated')==['Hola, mundo']
 page.get_by_role('button',name='Transcribir',exact=True).click()
 import wave,io,struct,math
 stream=io.BytesIO()
 with wave.open(stream,'wb') as w:
  w.setnchannels(1);w.setsampwidth(2);w.setframerate(16000)
  w.writeframes(b''.join(struct.pack('<h',int(1000*math.sin(i/20))) for i in range(16000)))
 page.locator('input[type=file]').set_input_files({'name':'sample.wav','mimeType':'audio/wav','buffer':stream.getvalue()})
 page.wait_for_function("document.querySelector('textarea').value.includes('Texto reconocido')")
 assert page.evaluate('window.__track') is True
 print('PASS: mocked Translator download/create/translate and SpeechRecognition audio-track integration. This does not validate real recognition or downloaded models.')
 b.close()
