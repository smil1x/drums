"use client";
import React, { useEffect, useRef, useState } from "react";
import { Midi } from "@tonejs/midi";
import Vex, { Accidental, Beam, Fraction, Stave, StaveNote } from "vexflow";
import * as Tone from "tone";
import { getMeasureBoundaries, getVexFlowDuration, NoteMap } from "./utils";

const heightPerStave = 150;

let prevX = 0;
let prevY = 0;

let sampler;
let part;

export default function MidiViewer() {
    const [midi, setMidi] = useState(null);
    const [aims, setAims] = useState(null);
    const [isPlay, setPlay] = useState(false);
    const [tone, setTone] = useState(null);
    const svgContainerRef = useRef(null);
    const sliderRef = useRef(null);

    useEffect(() => {
        // setMidiForTone()
    }, [midi]);

    useEffect(() => {
        loadMidi()

        return () => {
            tone.dispose();
        };
    }, []);

    // Загрузка MIDI-файла
    const loadMidi = async () => {
        const response = await fetch("/midi/dymDemo.mid");
        const arrayBuffer = await response.arrayBuffer();
        const midi = new Midi(arrayBuffer);
        // setMidi(midi)

        console.log(midi)
        const track = midi.tracks[0];


        const ppq = midi.header.ppq;
        const bpm = midi.header.tempos.length > 0 ? midi.header.tempos[0].bpm : 120;
        const timeSignatures = midi.header.timeSignatures.length > 0 ? midi.header.timeSignatures[0].timeSignature : [4, 4];
        const durationTicks = midi.durationTicks
        setMidiForTone(midi, bpm, ppq);

        renderNotes(track.notes, ppq, bpm, timeSignatures, durationTicks)
    };

    // Отрисовка нот в SVG
    const renderNotes = (notes, ppq, bpm, timeSignatures, durationTicks) => {
        if (!svgContainerRef.current) return;

        const VF = Vex.Flow;
        const renderer = new VF.Renderer(svgContainerRef.current, VF.Renderer.Backends.SVG);

        const width = 1100
        const numberOfStaves = notes.at(-1).bars

        const StaveWidth = 400;
        const noteStartX = 60;

        const lines = numberOfStaves % 2 === 0 ? numberOfStaves : numberOfStaves +1

        renderer.resize(width, heightPerStave * lines)
        const context = renderer.getContext()

        const notesWithTime = []

        let currentNoteFromMidi = 0
        let prevStave


        for (let i = 0; i < lines; i++) {
            let staveX
            let staveY
            if(i % 2 === 0 ){
                staveX = 0
                staveY = i/2 * heightPerStave
            } else {
                staveX = prevStave.width + prevStave.x
                staveY = prevStave.y
            }

            const stave = new Stave(staveX, staveY, StaveWidth);
            if (i === 0) {
                stave.addClef('percussion').addTimeSignature(`${timeSignatures[0]}/${timeSignatures[1]}`)
            }
            // stave.setNoteStartX(noteStartX)
            stave.setContext(context).draw()

            const staveNotes = []

            for (; currentNoteFromMidi < notes.length;) {

                const noteBar = notes[currentNoteFromMidi].bars

                if (noteBar <= i + 1 - 0.02) {
                    const midi = notes[currentNoteFromMidi].midi
                    const duration = notes[currentNoteFromMidi].duration
                    const pitch = notes[currentNoteFromMidi].pitch
                    const octave = notes[currentNoteFromMidi].octave
                    const time = notes[currentNoteFromMidi].time
                    const tick = notes[currentNoteFromMidi].ticks

                    const staveNotKey = NoteMap.get(midi) || `${pitch}/${octave}`

                    const keys = [staveNotKey]

                    for (let j = currentNoteFromMidi+1; j < notes.length; j++) {
                        const midi = notes[j].midi
                        const pitch = notes[j].pitch
                        const octave = notes[j].octave

                        if(notes[j].time === time){
                            currentNoteFromMidi = j
                            keys.push(NoteMap.get(midi) || `${pitch}/${octave}`)
                        }else {
                            break
                        }
                    }

                    const vexNote = {
                        keys: keys,
                        duration: getVexFlowDuration(duration, bpm),
                        time: time,
                        tick: tick
                    }
                    staveNotes.push(vexNote)
                    currentNoteFromMidi++
                } else {
                    break
                }
            }
            const staveInfo = getMeasureBoundaries(i, ppq, bpm)
            if(i % 2 === 0) {
                notesWithTime.push({
                    keys: ['stave'],
                    tick: staveInfo.startTick,
                    time: staveInfo.startTime,
                    x: stave.getX(),
                    y: stave.getY()
                })
            }


            prevStave = stave
            if(staveNotes.length > 0){
                const vexNotes = staveNotes.map((note) => {
                    const n = new StaveNote({
                        keys: note.keys,
                        duration: note.duration
                    })
                    // console.log(n.getAttributes().id)
                    return n
                })
                const beams = VF.Beam.generateBeams(vexNotes, {stem_direction: 1, flat_beams: true})
                VF.Formatter.FormatAndDraw(context, stave, vexNotes)
                vexNotes.forEach((i, index) => {
                    const w = i.getWidth() / 2
                    const bbox = i.getBoundingBox()
                    const id = i.getAttribute('id')
                    staveNotes[index] = {
                        ...staveNotes[index],
                        x: bbox.x + w,
                        y: stave.getY(),
                        id: id
                    }
                })
                //{keys: ['stave'], tick: staveInfo.endTick, time: staveInfo.endTime}
                notesWithTime.push(...staveNotes)

                beams.forEach(beam => beam.setContext(context).draw());
            }
            if(i % 2 !== 0) {
                notesWithTime.push({
                    keys: ['stave'],
                    tick: staveInfo.endTick,
                    time: staveInfo.endTime,
                    x: stave.getX() + stave.getWidth(),
                    y: stave.getY()
                })
            }
            // console.log(stave.getX() + stave.getWidth())

        }
        console.log(notesWithTime)
        setAims(notesWithTime)
        renderSlider()


    };

    function updateSliderPosition() {
        if (!sliderRef.current || !aims) return;
        if (Tone.Transport.state !== "started") {
            return;
        }
        const startSliderX = 20

        const currentTime = Tone.Transport.seconds;
        const currentTick = Tone.Transport.ticks;

        let smoothFactor = 0.2; // Скорость движения

        let targetX = prevX;
        let targetY = prevY;

        // Находим текущую и следующую ноты
        const nextAims = aims.filter(item => item.tick > currentTick);
        const prevAims = aims.filter(item => item.tick <= currentTick);

        if (nextAims.length > 0) {
            const next = nextAims[0];

            if (prevAims.length > 0) {
                const prev = prevAims[prevAims.length - 1];

                // Интерполяция положения ползунка между prev и next
                const tickProgress = (currentTick - prev.tick) / (next.tick - prev.tick);
                targetX = prev.x + (next.x - prev.x) * tickProgress;
                targetY = prev.y + (next.y - prev.y) * tickProgress;
            } else {

                targetX = currentTick * next.x / next.tick
                targetY = next.y;
            }

            const noteThresholdTick = 150; // Порог попадания по X
            const noteThresholdY = 20; // Порог попадания по Y


            aims.forEach((note, i) => {
                const elem = svgContainerRef.current.querySelector(`#vf-${note.id}`);
                if (!elem) return;

                // Проверяем, находится ли ползунок в пределах ноты по X и Y
                const isActive =  Math.abs(currentTick - note.tick) < noteThresholdTick &&
                    Math.abs(prevY - note.y) < noteThresholdY;

                if (isActive) {
                    elem.setAttribute("fill", "red");
                }
                else {
                    elem.setAttribute("fill", "black");
                }
            });

        } else {
            Tone.Transport.pause();
            Tone.Transport.seconds = 0
            setPlay(false);
            prevX = 0
            prevY = 0
            targetX = prevX
            targetY = prevY
            sliderRef.current.setAttribute('x1',1);
            sliderRef.current.setAttribute('x2',1);
            sliderRef.current.setAttribute('y1', 0 - 10);
            sliderRef.current.setAttribute('y2',120);
        }

        // Плавное движение
        prevX += (targetX - prevX) * smoothFactor;
        prevY += (targetY - prevY) * smoothFactor;
        sliderRef.current.setAttribute('x1',prevX);
        sliderRef.current.setAttribute('x2',prevX);
        sliderRef.current.setAttribute('y1', prevY - 10);
        sliderRef.current.setAttribute('y2', prevY + 120);
    }


    function animationLoop() {
        // Вызываем вашу функцию
        updateSliderPosition();

        // Запрашиваем следующий кадр
        requestAnimationFrame(animationLoop);
    }

    requestAnimationFrame(animationLoop);

    const renderSlider = () => {

        const svg = document.querySelector('svg');
        const slider = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        slider.setAttribute('x1', '1'); // Начальная позиция
        slider.setAttribute('y1', '0');
        slider.setAttribute('x2', '1');
        slider.setAttribute('y2', '120');
        slider.setAttribute('stroke', 'red');
        slider.setAttribute('stroke-width', '2');
        sliderRef.current = slider
        svg.appendChild(slider);
    }

    const setMidiForTone = (midi, bbm, ppq) => {
        if (part) {
            part.dispose(); // Очищаем предыдущие события
        }
        if (!sampler) {
            sampler = new Tone.Sampler({
                urls: {
                    35: "35.wav",
                    36: "36.wav",
                    38: "38.wav",
                    42: "42.wav",
                    43: "43.wav",
                    44: "44.wav",
                    45: "45.wav",
                    47: "47.wav",
                    48: "48.wav",
                    49: "49.wav",
                    51: "51.wav",
                },
                release: 1,
                baseUrl: "/samples/", // Путь к сэмплам
                onload: () => console.log("Сэмплы загружены!")
            }).toDestination();
        }

        Tone.Transport.PPQ = ppq;
        Tone.Transport.bpm.value = bbm;

        const notes = [];
        midi.tracks.forEach((track) => {
            track.notes.forEach((note) => {
                notes.push({
                    time: note.time,
                    note: note.name,
                    duration: note.duration,
                    velocity: note.velocity,
                });
            });
        });

        part = new Tone.Part((time, note) => {
            sampler.triggerAttackRelease(note.note, note.duration, time, note.velocity);
        }, notes).start(0);
    };

    const togglePlay = async () => {
        if (Tone.Transport.state === "started") {
            Tone.Transport.pause();
            setPlay(false);
        } else {
            await Tone.start(); // Нужно для взаимодействия с браузером
            Tone.Transport.start();
            setPlay(true);
        }
    };

    const logToneTick = () => {
        console.log(Tone.Transport.ticks)
    }

    const handleClick = (event) => {
        if (!svgContainerRef.current) return;
        debugger
        // Получаем границы div-контейнера
        const rect = svgContainerRef.current.getBoundingClientRect();

        // Рассчитываем координаты внутри контейнера
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;


        console.log("Координаты клика:", x, y);

        const bar = (Math.floor(y / heightPerStave)) * 150

        let notes = aims.filter((i) => i.y === bar)

        const left  = notes.filter((i) => i.x <=  x)
        const right  = notes.filter((i) => i.x >=  x)

        const timeRange = right[0].time - left[0].time;
        const xRange = right[0].x - left[0].x;
        const tempX = x - left[0].x;

        const time = (right[0].time - left[0].time) / (right[0].x - left[0].x) * tempX + left[0].time;

        sliderRef.current.setAttribute('x1',x);
        sliderRef.current.setAttribute('x2',x);
        sliderRef.current.setAttribute('y1', bar - 10);
        sliderRef.current.setAttribute('y2', bar + 120);
        prevX = x
        prevY = bar
        console.log('time', time)

        Tone.Transport.seconds = time
    };


    return (
        <div>
            <h1>MIDI Viewer</h1>
            <div style={{display: 'flex'}}>
                <div style={{marginLeft: '10px'}} ref={svgContainerRef} onClick={handleClick}></div>
                <button style={{height: '30px'}} onClick={togglePlay}>
                    {isPlay ? "Stop" : "Play"}
                </button>
                <button style={{height: '30px'}} onClick={logToneTick}>
                    log tick
                </button>
            </div>
        </div>
    );
}
