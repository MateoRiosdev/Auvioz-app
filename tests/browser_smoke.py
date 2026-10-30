# Current static-site smoke suite (browser speech, not the retired audio API).
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('browser_speech.py')), run_name='__main__')
