// "use client";
// import React, { useRef, useState } from "react";
// import { Midi } from "@tonejs/midi";
// import Vex from "vexflow";
// import * as Tone from "tone";
//
// export default function MidiViewer() {
// 	const [notes, setNotes] = useState([]);
// 	const svgContainerRef = useRef(null);
// 	const synthRef = useRef(null);
//
// 	// Загрузка MIDI-файла
// 	const loadMidi = async (file) => {
// 		const arrayBuffer = await file.arrayBuffer();
// 		const midi = new Midi(arrayBuffer);
// 		const track = midi.tracks[1];
//
// 		const extractedNotes = track.notes.map((note) => ({
// 			name: note.name,
// 			octave: note.octave,
// 			duration: note.duration,
// 			time: note.time,
// 		}));
//
// 		setNotes(extractedNotes);
// 		renderNotes(extractedNotes);
// 	};
//
// 	// Преобразование MIDI-ноты в формат для VexFlow
// 	const midiNoteToVexFlowKey = (note) => {
// 		const pitch = note.name.slice(0, -1).toLowerCase();
// 		const octave = note.octave;
// 		return `${pitch}/${octave}`;
// 	};
//
// 	// Отрисовка нот в SVG
// 	const renderNotes = (notes) => {
// 		if (!svgContainerRef.current) return;
//
// 		const VF = Vex.Flow;
// 		const renderer = new VF.Renderer(svgContainerRef.current, VF.Renderer.Backends.SVG);
// 		renderer.resize(800, 200);
// 		const context = renderer.getContext();
// 		const stave = new VF.Stave(10, 40, 700);
// 		stave.addClef("treble").setContext(context).draw();
//
// 		const staveNotes = notes.map((note) => {
// 			return new VF.StaveNote({
// 				keys: [midiNoteToVexFlowKey(note)],
// 				duration: "q",
// 			});
// 		});
//
// 		VF.Formatter.FormatAndDraw(context, stave, staveNotes);
//
// 		// Добавляем клики по нотам
// 		const svgNotes = svgContainerRef.current.querySelectorAll("svg .vf-stavenote");
// 		svgNotes.forEach((svgNote, index) => {
// 			svgNote.style.cursor = "pointer";
// 			svgNote.onclick = () => handleNoteClick(index, notes);
// 		});
// 	};
//
// 	// Обработка клика по ноте
// 	const handleNoteClick = (index, notes) => {
// 		const selectedNote = notes[index];
// 		console.log(`Клик по ноте: ${selectedNote.name}, время: ${selectedNote.time}`);
// 		// Запускаем воспроизведение с выбранной ноты
// 	};
//
// 	const play = () => {
// 		const player = new Tone.Player('/midi/dym.mp3').toDestination()
// 		player.autostart = true;
// 	};
//
// 	const playMidi = async () => {
// 		// Загружаем MIDI файл
// 		const response = await fetch("/midi/twinkle_twinkle.mid");
// 		const arrayBuffer = await response.arrayBuffer();
// 		const midi = new Midi(arrayBuffer);
//
// 		// Перебираем все треки в MIDI файле
// 		midi.tracks.forEach((track) => {
// 			// Создаём инструмент для воспроизведения
// 			const synth = new Tone.PolySynth(Tone.Synth).toDestination();
//
// 			// Проходимся по всем нотам трека
// 			track.notes.forEach((note) => {
// 				// Запланировать воспроизведение ноты
// 				synth.triggerAttackRelease(
// 					note.name, // Нота (например, C4)
// 					note.duration, // Длительность (например, 0.5s)
// 					note.time, // Время начала
// 					note.velocity // Громкость (от 0 до 1)
// 				);
// 			});
// 		});
//
// 		// Начать воспроизведение
// 		await Tone.start();
// 		Tone.Transport.start();
//
// 		// Останавливаем воспроизведение, когда закончится MIDI файл
// 		const totalDuration = midi.duration; // Длительность всего MIDI в секундах
// 		setTimeout(() => {
// 			Tone.Transport.stop();
// 		}, totalDuration * 1000); // Преобразуем в миллисекунды
// 	};
//
// 	return (
// 		<div>
// 			<h1>MIDI Viewer</h1>
// 	<input
// 	type="file"
// 	accept=".mid"
// 	onChange={(e) => e.target.files[0] && loadMidi(e.target.files[0])}
// 	/>
// 	<div ref={svgContainerRef}></div>
// 		<button onClick={play}>
// 		play
// 		</button>
// 		<button onClick={playMidi}>
// 		play midi
// 	</button>
// 	</div>
// );
// }
