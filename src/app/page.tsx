"use client"
// import styles from "./page.module.css";
import dynamic from 'next/dynamic';
const MidiPlayer = dynamic(() => import("../components/HtmlMidiPlayer"), { ssr: false });


export default function Home() {



	return (
		<div>
			<div>
				html-midi-player
			</div>
			<div>
				<MidiPlayer/>
			</div>

		</div>

	);
}
