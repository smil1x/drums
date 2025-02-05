
export const getMeasureBoundaries = (measureIndex, ppq, bpm, beatsPerMeasure = 4) => {
    const startTick = measureIndex * ppq * beatsPerMeasure;
    const endTick = (measureIndex + 1) * ppq * beatsPerMeasure;

    const startTime = (startTick / ppq) * (60 / bpm);
    const endTime = (endTick / ppq) * (60 / bpm);

    return { startTick, endTick, startTime, endTime };
};

export const getVexFlowDuration = (durationInSeconds, bpm) => {
    const quarterNoteDuration = 60 / bpm; // Длительность четвертной в секундах
    const relativeDuration = durationInSeconds / quarterNoteDuration;

    if (relativeDuration >= 1) return "q";  // Четвертная
    if (relativeDuration >= 0.5) return "8"; // Восьмая
    if (relativeDuration >= 0.25) return "16"; // Шестнадцатая
    return "32";
};

export const NoteMap = new Map()
NoteMap.set(35, 'f/4')
NoteMap.set(36, 'f/4')
NoteMap.set(38, 'c/5')
NoteMap.set(42, 'g/5/x2')
NoteMap.set(43, 'a/4')
NoteMap.set(44, 'd/4/x2')
NoteMap.set(45, 'd/5')
NoteMap.set(47, 'e/5')
NoteMap.set(48, 'd/5')
NoteMap.set(49, 'a/5/x2')
NoteMap.set(51, 'f/5/x2')
NoteMap.set(57, 'a/5/x2')
