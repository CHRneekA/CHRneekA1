// 
// 
//              to do:
//          - title overflow and movement in compact mode (no transition between formats, no movement)
//          - redesign editor (text editor part specifically)?
//          - deletion confirmation button overlap with color slider?
//          - optimize JS (scroll / position) smoothing for non 60 fps monitors
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 



const TRANSLATE_TIME = 3;
const EDITOR_TRANSLATE_TIME = 2;
const SCROLL_SPEED = 5;
const SCROLL_MULT = 0.05;
const SCROLL_FORCE_MULT = 0.4;
const DISPLAY_OPTIONS = [
    [400, 300, false],
    [400, 400, false],
    [400, 92, true],
    [800, 92, true],
    [800, 500, false],
    [300, 400, false]
];

class Note {
    constructor(note, pos, note_list) {
        this.text = note.text;
        this.title = note.title;

        this.less_info = false;
        this.text_hide_check = 0;

        this.color = note.color;

        this.x = pos.x + note_list.note_width / 2;
        this.y = pos.y;

        this.end_x = pos.x + note_list.note_width / 2;
        this.end_y = pos.y;

        this.ID = -1;
        
        this.build_note = () => {
            this.el__note = document.createElement("div");
            this.el__note.className = "note note__hide";
            
            this.el__note__title = document.createElement("h1");
            this.el__note__title.className = "note__title note__title__cut";

            this.el__note__text = document.createElement("h3");
            this.el__note__text.className = "note__text";

            this.el__note.onclick = () => {
                note_list.editor.open(this.ID);
            };
        }
        this.apply_color = (hover) => {

            if (hover) {
                this.el__note.style.setProperty("background-color", `hsla(${this.color}, 60%, 20%, 0.5)`);
                // this.el__note.style.setProperty("cursor", "pointer");
            } else {
                this.el__note.style.setProperty("background-color", `hsla(${this.color}, 60%, 10%, 0.5)`);
                // this.el__note.style.setProperty("cursor", "");
            }

            this.el__note__title.style.setProperty("color", `hsl(${this.color}, 75%, 50%)`);

            // this.el__note__title.style.setProperty("background-image", `-webkit-linear-gradient(0deg,
            //     hsla(${this.color}, 75%, 50%, 0) 2.5%,
            //     hsl(${this.color}, 75%, 50%) 5%,
            //     hsl(${this.color}, 75%, 50%) 95%,
            //     hsla(${this.color}, 75%, 50%, 0) 97.5%
            // )`);

            this.el__note__text.style.setProperty(
                "background-image",
                `-webkit-linear-gradient(90deg, hsla(${this.color}, 60%, 55%, 0) 2.5%, hsl(${this.color}, 60%, 55%) 15%)`
            );
            this.el__note.style.setProperty("border-color", `hsl(${this.color}, 60%, 60%)`);

        }
        this.edit_note = (title = this.title, text = this.text, color = this.color) => {
            this.el__note__title.innerHTML = title;
            this.el__note__text.innerHTML = text;

            this.title = title;
            this.text = text;
            this.color = color;

            this.apply_color();
        }
        this.add_hover_effects = () => {
            this.el__note.addEventListener("mouseenter", () => this.apply_color(true));
            this.el__note.addEventListener("mouseleave", () => this.apply_color(false));
        }
        
        this.build_note();
        this.edit_note();
        this.add_hover_effects();

        this.__note_list = note_list;
    }
    append() {
        this.el__note.appendChild(this.el__note__title);
        this.el__note.appendChild(this.el__note__text);

        this.el__note.style.setProperty("width", `${this.note_width}px`);
        this.el__note.style.setProperty("height", `${this.note_height}px`);

        this.__note_list.el__note_list.appendChild(this.el__note);
    }
    delete() {
        this.el__note.className = "note note__hide";
        setTimeout(() => {
            this.__note_list.el__note_list.removeChild(this.el__note);
        }, 200);
    }
    step() {
        this.el__note.className = "note";
        let vx = (this.end_x - this.x) * 0.5 / Math.max(0.5, TRANSLATE_TIME);
        let vy = (this.end_y - this.y) * 0.5 / Math.max(0.5, TRANSLATE_TIME);
        
        this.x += vx;
        this.y += vy;

        this.el__note.style.setProperty("left", `${this.x}px`);
        this.el__note.style.setProperty("top", `${this.y}px`);
    }
    translate(pos, force_pos) {
        this.end_x = pos.x + this.__note_list.note_width / 2;
        this.end_y = pos.y;

        if (force_pos) {
            this.x = this.end_x;
            this.y = this.end_y;
        }
    }
    set_size(size, less_info) {
        this.el__note.style.setProperty("width", `${size.x}px`);
        this.el__note.style.setProperty("height", `${size.y}px`);

        clearTimeout(this.text_hide_check);
        if (less_info) {
            this.el__note__title.className = "note__title note__title__cut";
            this.text_hide_check = setTimeout(() => {
                this.el__note__text.style.setProperty("display", "none");
            }, 300);
        } else {
            this.el__note__text.style.setProperty("display", "block");
            this.el__note__title.className = "note__title";
        }
    }
    animation_frame(time) {
        return -(Math.cos(Math.PI * time) - 1) / 2;
    }
}

class Custom_Scroll {
    constructor(el) {

        this.scroll_delta = 0;

        this.el = el;

        this.el.addEventListener("wheel", w => {
            this.scroll_delta += w.deltaY * (1 + Math.pow(Math.abs(this.scroll_delta), SCROLL_FORCE_MULT)) * SCROLL_MULT;
            w.preventDefault();
        });
    }
    step() {
        this.scroll_delta *= 0.5 ** (1 / SCROLL_SPEED);

        if (this.scroll_delta > 0) {
            let check = this.el.scrollTop;
            this.el.scrollTop += Math.floor(this.scroll_delta);

            if (this.el.scrollTop == check) this.scroll_delta = 0;
        } else {
            let check = this.el.scrollTop;
            this.el.scrollTop += Math.ceil(this.scroll_delta);

            if (this.el.scrollTop == check) this.scroll_delta = 0;
        }
    }
}

class Note_List {
    constructor() {
        this.notes = [];

        this.el__note_list = document.getElementById("note_list");

        this.time = performance.now();

        this.delta_time = 0;

        this.scroll = new Custom_Scroll(this.el__note_list);

        window.addEventListener("resize", () => {
            this.translate_notes();
        });

        this.editor = new Editor(this);

        this.display_format = 0;

        this.note_width = DISPLAY_OPTIONS[this.display_format][0];
        this.note_height = DISPLAY_OPTIONS[this.display_format][1];
        this.note_height_margin = 10;
    }
    step() {
        requestAnimationFrame(() => this.step());

        this.get_time();
        this.notes_step();
        this.scroll.step();
        this.editor.step();
    }
    change_format(save = false) {
        this.display_format = ++this.display_format % DISPLAY_OPTIONS.length;

        if (save) this.save_to_storage();

        this.note_width = DISPLAY_OPTIONS[this.display_format][0];
        this.note_height = DISPLAY_OPTIONS[this.display_format][1];
        this.note_height_margin = 10;

        for (let i = this.notes.length; i--;) {
            this.notes[i].set_size({x: this.note_width, y: this.note_height }, DISPLAY_OPTIONS[this.display_format][2]);
        }

        this.translate_notes();
    }
    get_time() {
        let time = performance.now();

        this.delta_time = (time - this.time);

        this.time = time;
    }
    notes_step() {
        for (let i = this.notes.length; i--;) {
            this.notes[i].step();
        }
    }
    new_note(note_info, pos, do_translate = true) {
        let note = new Note(note_info, pos, this);

        note.set_size({ x: this.note_width, y: this.note_height }, false);
        note.append();

        this.notes.unshift(note);
        if (do_translate) this.translate_notes();
    }
    move_forward(index) {
        this.notes.unshift(this.notes.splice(index, 1)[0]);
        
        this.translate_notes();
    }
    create_new_note() {
        let margin_x = this.note_width / 20;
        let margin_y = this.note_height / 20;

        let max_ammount = Math.max(1, Math.floor((innerWidth - margin_x) / (this.note_width + margin_x)));
        let x = 0;

        if (this.notes.length < max_ammount) {
            x = (innerWidth - (this.notes.length + 1) * this.note_width - this.notes.length * margin_x) / 2;
        } else {
            x = (innerWidth - max_ammount * this.note_width - (max_ammount - 1) * margin_x) / 2;
        }

        this.new_note({
            title: "ЗАГОЛОВОК",
            text: "ТЕКСТ",
            color: Math.floor(Math.random() * 60 + 90)
        }, { x: x, y: margin_y + this.note_height_margin });

        this.editor.open(0);
    }
    delete_note(ID) {
        this.notes[ID].delete();
        this.notes.splice(ID, 1);
        
        this.translate_notes();
    }
    save_to_storage() {
        let data = {
            settings: {
                format: this.display_format
            },
            notes: []
        };

        for (let i = 0; i < this.notes.length; i++) {
            data.notes[i] = {
                title: this.notes[i].title,
                text: this.notes[i].text,
                color: this.notes[i].color
            }
        }

        // console.log(data)
        eel.save_note_data(JSON.stringify(data));
    }
    translate_notes(force_pos = false) {
        let margin_x = this.note_width / 20;
        let margin_y = this.note_height / 20;

        let max_ammount = Math.max(1, Math.floor((innerWidth - margin_x) / (this.note_width + margin_x)));

        let last_notes = this.notes.length % max_ammount;

        let offset_x = (innerWidth - max_ammount * this.note_width - (max_ammount - 1) * margin_x) / 2;

        for (let i = 0; i < this.notes.length - last_notes; i++) {
            let index_x = i % max_ammount;
            let index_y = Math.floor(i / max_ammount);

            let x = index_x * (margin_x + this.note_width) + offset_x;
            let y = index_y * (margin_y + this.note_height) + margin_y + this.note_height_margin;

            this.notes[i].translate({ x, y }, force_pos);
            this.notes[i].ID = i;
        }

        offset_x = (innerWidth - last_notes * this.note_width - (last_notes - 1) * margin_x) / 2;

        for (let i = this.notes.length - last_notes; i < this.notes.length; i++) {
            let index_x = i % max_ammount;
            let index_y = Math.floor(i / max_ammount);

            let x = index_x * (margin_x + this.note_width) + offset_x;
            let y = index_y * (margin_y + this.note_height) + margin_y + this.note_height_margin;

            this.notes[i].translate({ x, y }, force_pos);
            this.notes[i].ID = i;
        }

        document.getElementById("lower_pad").style.setProperty("height", `${this.note_height_margin}px`);
        document.getElementById("lower_pad").style.setProperty("top", `${Math.ceil(this.notes.length / max_ammount) * (margin_y + this.note_height) + margin_y + this.note_height_margin}px`);
    }
    load_notes(save_data) {

        // console.log(save_data)

        try {
            this.display_format = save_data.settings.format - 1;
        } catch (e) {
            this.display_format = 0;
        }

        this.change_format();

        for (let i = save_data.notes.length; i--;) note_list.new_note({
            title: save_data.notes[i].title,
            text: save_data.notes[i].text,
            color: save_data.notes[i].color
        }, { x: 0, y: 0 }, false);

        this.translate_notes(true);
    }
    init() {
        this.await_data = eel.get_note_data()();

        this.await_data.then(
            save_data => {
                document.getElementById("change_format").className = "button_circle";
                document.getElementById("new_note_button").className = "button_circle";

                requestAnimationFrame(() => this.load_notes(JSON.parse(save_data)));
            }, alert
        );
        
        requestAnimationFrame(() => this.step());
    }
}

class Editor {
    constructor(note_list) {

        this.fade_out_check = 0;
        this.click_through_check = 0;
        this.deletion_confirmation_check = 0;

        this.save = () => {
            if (!this.is_open) return;

            this.is_open = false;

            this.__note.edit_note(
                this.el__title_editor.value,
                this.el__text_editor.innerHTML,
                this.el__color_slider.value
            );
            this.__note_list.move_forward(this.editing_ID);
            this.__note_list.save_to_storage();

            this.close();
        }
        this.close = () => {
            this.el__editor.className = "editor editor__hide";
            this.el__black_overlay.className = "black_overlay black_overlay__hide";

            this.click_through_check = setTimeout(() => {
                this.el__black_overlay.style.setProperty("pointer-events", "none");
            }, 200);
            this.fade_out_check = setTimeout(() => {
                this.el__black_overlay.style.setProperty("display", "none");
            }, 400);
        }
        this.deletion_confirmation = () => {
            this.deletion_button_shown = !this.deletion_button_shown;

            if (this.deletion_button_shown) {
                this.el__deletion_confirmation_button.style.setProperty("display", "block");
                requestAnimationFrame(() => {
                    this.el__deletion_confirmation_button.className = "deletion_button";
                });
                clearTimeout(this.deletion_confirmation_check);
            } else {
                this.el__deletion_confirmation_button.className = "deletion_button deletion_button_hide";
                
                this.deletion_confirmation_check = setTimeout(() => {
                    this.el__deletion_confirmation_button.style.setProperty("display", "none");
                }, 200);
                
            }
        }
        this.delete = () => {
            if (!this.is_open) return;

            this.is_open = false;
            this.__note_list.delete_note(this.editing_ID);

            this.__note_list.save_to_storage();
            
            this.close();
        }
        this.change_color = () => {
            if (!this.is_open) return;
            
            this.el__color_slider.style.setProperty("--slider-color", `hsl(${this.el__color_slider.value}, 60%, 60%)`);
            this.el__color_slider.style.setProperty("border-color", `hsl(${this.el__color_slider.value}, 60%, 60%)`);
            this.el__color_slider.style.setProperty("background-color", `hsla(${this.el__color_slider.value}, 60%, ${this.color_slider_hover * 20 + 20}%, 0.5)`);
        }
        this.build_editor = () => {
            this.el__black_overlay = document.createElement("div");
            this.el__editor = document.createElement("div");
            this.el__editor__box = document.createElement("div");

            this.el__toolbar = document.createElement("div");
            this.el__close_button = document.createElement("button");
            this.el__color_slider = document.createElement("input");
            this.el__delete_button = document.createElement("button");
            this.el__deletion_confirmation_button = document.createElement("button");

            this.el__title_editor = document.createElement("input");
            this.el__text_editor = document.createElement("div");

            this.el__black_overlay.className = "black_overlay black_overlay__hide";
            this.el__editor.className = "editor editor__hide";
            this.el__editor__box.className = "editor__box";
            
            this.el__toolbar.className = "editor__toolbar";
            this.el__close_button.className = "button_rounded close_icon";
            this.el__color_slider.className = "color_slider";

            this.el__delete_button.className = "button_rounded delete_icon";
            this.el__deletion_confirmation_button.className = "deletion_button deletion_button_hide";

            this.el__deletion_confirmation_button.innerHTML = "Удалить?";

            this.el__title_editor.className = "editor__title_editor";
            this.el__text_editor.className = "editor__text_editor";

            this.size = { x: 0, y: 0 };

            this.is_open = false;

            this.deletion_button_shown = false;

            this.el__black_overlay.style.setProperty("display", "none");
            this.el__deletion_confirmation_button.style.setProperty("display", "none");

            this.el__title_editor.setAttribute("type", "text");
            this.el__text_editor.setAttribute("contenteditable", "true");

            this.el__color_slider.setAttribute("type", "range");
            this.el__color_slider.setAttribute("min", "0");
            this.el__color_slider.setAttribute("max", "359");

            this.el__color_slider.oninput = this.change_color;

            this.el__close_button.onclick = this.save;
            this.el__delete_button.onclick = this.deletion_confirmation;
            this.el__deletion_confirmation_button.onclick = this.delete;

            document.body.appendChild(this.el__black_overlay);
            this.el__black_overlay.appendChild(this.el__editor);

            this.el__black_overlay.appendChild(this.el__toolbar);
            this.el__editor.appendChild(this.el__editor__box);

            this.el__editor__box.appendChild(this.el__title_editor);
            this.el__editor__box.appendChild(this.el__text_editor);

            this.el__toolbar.appendChild(this.el__close_button);
            this.el__toolbar.appendChild(this.el__color_slider);
            this.el__toolbar.appendChild(this.el__delete_button);
            this.el__black_overlay.appendChild(this.el__deletion_confirmation_button);
            
            this.color_slider_hover = false;

            this.add_hover_effects = () => {
                this.el__color_slider.addEventListener("mouseenter", () => {
                    this.color_slider_hover = true;
                    this.el__color_slider.style.setProperty("background-color", `hsla(${this.el__color_slider.value}, 60%, 40%, 0.5)`);
                });
                this.el__color_slider.addEventListener("mouseleave", () => {
                    this.color_slider_hover = false;
                    this.el__color_slider.style.setProperty("background-color", `hsla(${this.el__color_slider.value}, 60%, 20%, 0.5)`);
                });
            }
            this.add_hover_effects();
            
            this.scroll = new Custom_Scroll(this.el__editor__box);
        }
        this.open = (ID) => {
            this.editing_ID = ID;
            this.__note = note_list.notes[ID];

            this.is_open = true;
            
            this.el__color_slider.value = this.__note.color;
            
            this.el__title_editor.value = this.__note.title;
            this.el__text_editor.innerHTML = this.__note.text;

            this.el__color_slider.style.setProperty("--slider-color", `hsl(${this.__note.color}, 60%, 60%)`);
            this.el__color_slider.style.setProperty("border-color", `hsl(${this.__note.color}, 60%, 60%)`);
            this.el__color_slider.style.setProperty("background-color", `hsla(${this.__note.color}, 60%, 20%, 0.5)`);
            
            this.el__black_overlay.style.setProperty("display", "block");
            this.el__black_overlay.style.setProperty("pointer-events", "auto");

            this.el__deletion_confirmation_button.style.setProperty("display", "none");
            this.el__deletion_confirmation_button.className = "deletion_button deletion_button_hide";

            requestAnimationFrame(() => {
                this.el__black_overlay.className = "black_overlay";
                this.el__editor.className = "editor";
            });

            clearTimeout(this.fade_out_check);
            clearTimeout(this.click_through_check);
            clearTimeout(this.deletion_confirmation_check);

            this.deletion_button_shown = false;
        }

        this.build_editor();

        this.__note_list = note_list;
    }
    step() {
        let mult = 0.5 / Math.max(0.5, TRANSLATE_TIME);

        this.size.x += (innerWidth * 0.8 - this.size.x) * mult;
        this.size.y += (innerHeight * 0.7 - this.size.y) * mult;

        this.el__editor.style.setProperty("width", `${this.size.x}px`);
        this.el__editor.style.setProperty("height", `${this.size.y}px`);

        this.scroll.step();
    }
}

let note_list = new Note_List();

note_list.init();


/* frames - const

0.5 - 0.75                            ||      0.5 + Math.pow(0.5, 2)
1   - 1 + 1                               ||      1 + Math.pow(1, 1)
2   - 2 + 1.414213562373095               ||      2 + Math.pow(2, 0.5)
3   - 3 + 1.8473
4   - 4 + 2.285213507883245
5   - 5 + 2.725023958872576
100 - 100 + 44.7700817110843


*/