        // --- TUI Playback State & Logic ---
        const audioData = [
            {
                title: "Cargo Bay 7",
                artist: "Retro_X",
                url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
            },
            {
                title: "Obsidian Core",
                artist: "Synth_Dust",
                url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
            },
            {
                title: "Terminal Echoes",
                artist: "Rusty_Gears",
                url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
            }
        ];

        let state = {
            isPlaying: false,
            currentIdx: 0,
            selectedIdx: 0,
            volume: 0.8,
            loop: false,
            shuffle: false,
            volumeMode: false,
            searchMode: false,
            searchQuery: "",
            helpOpen: false,
        };

        const audio = document.getElementById("audioEngine");
        const focusOverlay = document.getElementById("focusOverlay");
        const tuiCanvas = document.getElementById("tuiCanvas");

        function initTui() {
            renderLibrary();
            updateTuiElements();
            
            audio.addEventListener("timeupdate", () => {
                if (state.isPlaying) updateProgressBar();
            });
            audio.addEventListener("ended", () => {
                if (state.loop) {
                    audio.currentTime = 0;
                    audio.play();
                } else {
                    nextTrack();
                }
            });
        }

        function renderLibrary() {
            const container = document.getElementById("tuiLibrary");
            container.innerHTML = "";
            
            audioData.forEach((track, idx) => {
                const item = document.createElement("div");
                item.className = "tui-lib-item";
                if (idx === state.selectedIdx) item.className += " selected";
                if (idx === state.currentIdx && state.isPlaying) item.className += " playing";
                
                item.textContent = track.title;
                item.onclick = () => {
                    state.selectedIdx = idx;
                    playSelected();
                };
                container.appendChild(item);
            });
        }

        function updateTuiElements() {
            const statusStr = state.isPlaying ? "playing" : (audio.paused && audio.currentTime > 0 ? "paused" : "stopped");
            const lpStr = state.loop ? " • Loop" : "";
            const shStr = state.shuffle ? " • Shuffle" : "";
            const volModeStr = state.volumeMode ? " (v: volume mode)" : "";
            document.getElementById("tuiTitleLine").textContent = 
                `State: ${statusStr} • Volume: ${Math.round(state.volume * 100)}% [System (ALSA)]${volModeStr}${lpStr}${shStr}`;

            if (state.isPlaying || audio.currentTime > 0) {
                const currentTrack = audioData[state.currentIdx];
                document.getElementById("tuiTrackTitle").textContent = currentTrack.title;
                document.getElementById("tuiTrackArtist").textContent = currentTrack.artist;
                document.getElementById("tuiTrackIndex").textContent = `${state.currentIdx + 1} / ${audioData.length}`;
            } else {
                document.getElementById("tuiTrackTitle").textContent = "-";
                document.getElementById("tuiTrackArtist").textContent = "-";
                document.getElementById("tuiTrackIndex").textContent = `0 / ${audioData.length}`;
            }

            const inputBox = document.getElementById("tuiInputBox");
            const inputTitle = document.getElementById("tuiInputTitle");
            const inputPanel = document.getElementById("tuiInputPanel");

            if (state.searchMode) {
                inputPanel.style.borderColor = "var(--tui-cyan)";
                inputTitle.style.color = "var(--tui-cyan)";
                inputBox.style.color = "var(--text-bright)";
                inputBox.textContent = state.searchQuery ? state.searchQuery : "Type to search…";
            } else if (state.volumeMode) {
                inputPanel.style.borderColor = "var(--tui-yellow)";
                inputTitle.style.color = "var(--tui-yellow)";
                inputTitle.textContent = "Volume";
                inputBox.style.color = "var(--text-bright)";
                inputBox.textContent = "Use Up/Down Arrow to modify volume";
            } else {
                inputPanel.style.borderColor = "var(--border-dim)";
                inputTitle.style.color = "var(--text-dark)";
                inputTitle.textContent = "Search";
                inputBox.style.color = "var(--text-dark)";
                inputBox.textContent = "Press S to search";
            }

            const hintBox = document.getElementById("tuiHintBox");
            if (state.searchMode) {
                hintBox.innerHTML = `Press <span style="color: var(--tui-purple); font-weight: bold">Enter</span> select • <span style="color: var(--tui-purple); font-weight: bold">Esc</span> cancel`;
            } else if (state.volumeMode) {
                hintBox.innerHTML = `Press <span style="color: var(--tui-purple); font-weight: bold">↑/↓</span> modify • <span style="color: var(--tui-purple); font-weight: bold">v/Esc</span> exit`;
            } else {
                hintBox.innerHTML = `Press <span style="color: var(--tui-purple); font-weight: bold">h</span> for cheatsheet • <span style="color: var(--tui-purple); font-weight: bold">v</span> volume mode`;
            }

            renderLibrary();
        }

        function updateProgressBar() {
            const fill = document.getElementById("tuiProgressFill");
            const label = document.getElementById("tuiProgressLabel");
            
            const cur = audio.currentTime || 0;
            const dur = audio.duration || 0;
            
            const ratio = dur > 0 ? (cur / dur) * 100 : 0;
            fill.style.width = `${ratio}%`;
            
            label.textContent = `${formatTime(cur)} / ${dur > 0 ? formatTime(dur) : "--:--"}`;
        }

        function formatTime(secs) {
            const m = Math.floor(secs / 60);
            const s = Math.floor(secs % 60);
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }

        function focusTui() {
            focusOverlay.classList.add("hidden");
            tuiCanvas.focus();
        }

        function blurTui() {
            focusOverlay.classList.remove("hidden");
        }

        function playSelected() {
            state.currentIdx = state.selectedIdx;
            const track = audioData[state.currentIdx];
            
            audio.src = track.url;
            audio.volume = state.volume;
            audio.play()
                .then(() => {
                    state.isPlaying = true;
                    updateTuiElements();
                })
                .catch(err => {
                    console.log("Audio play postponed pending user interaction", err);
                });
        }

        function togglePause() {
            if (!audio.src) {
                playSelected();
                return;
            }
            if (state.isPlaying) {
                audio.pause();
                state.isPlaying = false;
            } else {
                audio.play();
                state.isPlaying = true;
            }
            updateTuiElements();
        }

        function nextTrack() {
            if (state.shuffle) {
                state.selectedIdx = Math.floor(Math.random() * audioData.length);
            } else {
                state.selectedIdx = (state.selectedIdx + 1) % audioData.length;
            }
            playSelected();
        }

        function prevTrack() {
            state.selectedIdx = (state.selectedIdx - 1 + audioData.length) % audioData.length;
            playSelected();
        }

        tuiCanvas.addEventListener("keydown", (e) => {
            const keysToPrevent = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];
            if (keysToPrevent.includes(e.key)) {
                e.preventDefault();
            }

            if (e.key === "Escape") {
                state.searchMode = false;
                state.volumeMode = false;
                state.helpOpen = false;
                document.getElementById("tuiHelp").classList.remove("active");
                updateTuiElements();
                return;
            }

            if (state.searchMode) {
                if (e.key === "Enter") {
                    state.searchMode = false;
                    playSelected();
                } else if (e.key === "Backspace") {
                    state.searchQuery = state.searchQuery.slice(0, -1);
                    applySimulatedSearch();
                } else if (e.key.length === 1) {
                    state.searchQuery += e.key;
                    applySimulatedSearch();
                }
                updateTuiElements();
                return;
            }

            if (state.volumeMode) {
                if (e.key === "ArrowUp") {
                    state.volume = Math.min(1.0, state.volume + 0.05);
                    audio.volume = state.volume;
                } else if (e.key === "ArrowDown") {
                    state.volume = Math.max(0.0, state.volume - 0.05);
                    audio.volume = state.volume;
                } else if (e.key.toLowerCase() === "v") {
                    state.volumeMode = false;
                }
                updateTuiElements();
                return;
            }

            switch(e.key.toLowerCase()) {
                case "arrowup":
                case "k":
                    state.selectedIdx = Math.max(0, state.selectedIdx - 1);
                    updateTuiElements();
                    break;
                case "arrowdown":
                case "j":
                    state.selectedIdx = Math.min(audioData.length - 1, state.selectedIdx + 1);
                    updateTuiElements();
                    break;
                case " ":
                    togglePause();
                    break;
                case "enter":
                    playSelected();
                    break;
                case "arrowleft":
                    audio.currentTime = Math.max(0, audio.currentTime - 5);
                    updateProgressBar();
                    break;
                case "arrowright":
                    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
                    updateProgressBar();
                    break;
                case "n":
                    if (e.shiftKey) prevTrack();
                    else nextTrack();
                    break;
                case "p":
                    if (e.shiftKey) prevTrack();
                    else audio.currentTime = Math.max(0, audio.currentTime - 10);
                    break;
                case "l":
                    state.loop = !state.loop;
                    updateTuiElements();
                    break;
                case "s":
                    if (e.shiftKey) { // 'S'
                        state.searchMode = true;
                        state.searchQuery = "";
                    } else { // 's'
                        state.shuffle = !state.shuffle;
                    }
                    updateTuiElements();
                    break;
                case "v":
                    state.volumeMode = true;
                    updateTuiElements();
                    break;
                case "h":
                case "?":
                    state.helpOpen = !state.helpOpen;
                    if (state.helpOpen) {
                        document.getElementById("tuiHelp").classList.add("active");
                    } else {
                        document.getElementById("tuiHelp").classList.remove("active");
                    }
                    break;
            }
        });

        function applySimulatedSearch() {
            if (!state.searchQuery) return;
            const q = state.searchQuery.toLowerCase();
            const foundIdx = audioData.findIndex(t => t.title.toLowerCase().includes(q));
            if (foundIdx !== -1) {
                state.selectedIdx = foundIdx;
            }
        }

        initTui();

        // --- Tab Selection Options for Installer Code Block ---
        function switchTab(target, element) {
            document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
            element.classList.add("active");

            document.getElementById("tab-curl").style.display = "none";
            document.getElementById("tab-arch").style.display = "none";
            document.getElementById("tab-deb").style.display = "none";
            document.getElementById("tab-rpm").style.display = "none";

            document.getElementById("tab-" + target).style.display = "flex";
        }

        function copyCommand(text, btn) {
            navigator.clipboard.writeText(text).then(() => {
                btn.textContent = "Copied";
                btn.classList.add("copied");
                setTimeout(() => {
                    btn.textContent = "Copy";
                    btn.classList.remove("copied");
                }, 1500);
            });
        }

window.focusTui = focusTui;
window.blurTui = blurTui;
window.playSelected = playSelected;
window.togglePause = togglePause;
window.nextTrack = nextTrack;
window.prevTrack = prevTrack;
window.applySimulatedSearch = applySimulatedSearch;
window.switchTab = switchTab;
window.copyCommand = copyCommand;
