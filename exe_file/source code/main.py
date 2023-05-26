import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()

import eel
import os.path

@eel.expose
def save_note_data(data):

    if (os.path.exists('./save/notes.txt')):
        with open('./save/notes.txt', 'w') as f:
            f.write(data)
            f.close()
    else:
        with open('./save/notes.txt', 'a') as f:
            f.write(data)
            f.close()



@eel.expose
def get_note_data():

    if (os.path.exists('./save/notes.txt')):
        with open('./save/notes.txt', 'r') as f:
            data = f.readline()
            f.close()
            return data
    else:
        return '{"settings": { "format": 0 }, "notes": []}'

def main():
    eel.init("./client")
    eel.start("index.html", mode="chrome")

if __name__ == "__main__": main()
