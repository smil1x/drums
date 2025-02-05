"use client"
import { useRef, useEffect, useState } from 'react';
import Script from "next/script";

const MidiPlayer = () => {
    const playerRef = useRef(null);
    const [midiLoaded, setMidiLoaded] = useState(false);
    debugger

    useEffect(() => {
        const player = playerRef.current;

        if (player) {
            player.addEventListener('midi-loaded', () => {
                // setMidiLoaded(true);
            });

            player.addEventListener('note-click', (event) => {
                const noteTime = event.detail.time;
                player.currentTime = noteTime; // Устанавливаем текущую позицию
                player.play(); // Начинаем воспроизведение
            });
        }

        return () => {
            if (player) {
                player.removeEventListener('midi-loaded', () => setMidiLoaded(false));
                player.removeEventListener('note-click', () => {
                });
            }
        };
    }, []);

    return (
        <div>
            <Script
                src="https://cdn.jsdelivr.net/npm/html-midi-player/dist/html-midi-player.min.js"
                strategy="beforeInteractive"
            />
            <h1>MIDI Player</h1>
            {/*<PlayerElement/>*/}

            {!midiLoaded && <p>Загрузка MIDI...</p>}
        </div>
    );
};

export default MidiPlayer;