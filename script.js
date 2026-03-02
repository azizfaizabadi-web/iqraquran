document.addEventListener('DOMContentLoaded', () => {

    // --- Navbar Scroll Effect ---
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- Intersection Observer for Scroll Animations ---
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target); // Optional: Stop observing once animated
            }
        });
    }, observerOptions);

    const hiddenElements = document.querySelectorAll('.hidden');
    hiddenElements.forEach((el) => observer.observe(el));

    // --- Smooth Scrolling for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Simple Audio Player Mockup Interaction ---
    const playBtn = document.querySelector('.play-btn');
    const playIcon = playBtn ? playBtn.querySelector('i') : null;
    let isPlaying = false;

    if (playBtn && playIcon) {
        playBtn.addEventListener('click', () => {
            isPlaying = !isPlaying;
            if (isPlaying) {
                playIcon.classList.remove('fa-play');
                playIcon.classList.add('fa-pause');
            } else {
                playIcon.classList.remove('fa-pause');
                playIcon.classList.add('fa-play');
            }
        });
    }

    // --- Dynamic Quran Reader Implementation ---
    const surahCustom = document.getElementById('surah-custom');
    const reciterCustom = document.getElementById('reciter-custom');
    const transCustom = document.getElementById('trans-custom');

    const surahInput = document.getElementById('surah-select');
    const reciterInput = document.getElementById('reciter-select');
    const transInput = document.getElementById('translation-select');

    const readerContent = document.getElementById('reader-content');
    const quranAudio = document.getElementById('quran-audio');
    const setupCustomDropdown = (customElement, inputElement, onChangeCallback) => {
        if (!customElement) return;

        const selected = customElement.querySelector('.select-selected');
        const itemsContainer = customElement.querySelector('.select-items');

        // Toggle dropdown open/close
        selected.addEventListener('click', function (e) {
            e.stopPropagation(); // prevent document click from closing immediately
            closeAllSelect(this);
            this.nextElementSibling.classList.toggle('select-hide');
            this.classList.toggle('select-arrow-active');
        });

        // Handle item click delegation
        itemsContainer.addEventListener('click', function (e) {
            const nestedToggle = e.target.closest('.nested-toggle');
            if (nestedToggle) {
                e.stopPropagation();

                // If clicking a Surah item, collapse others
                if (nestedToggle.classList.contains('surah-item')) {
                    const allNested = itemsContainer.querySelectorAll('.nested-items.show-nested');
                    allNested.forEach(ni => {
                        if (ni !== nestedToggle.nextElementSibling) {
                            ni.classList.remove('show-nested');
                            const prevIcon = ni.previousElementSibling.querySelector('i.fa-chevron-up');
                            if (prevIcon) {
                                prevIcon.classList.remove('fa-chevron-up');
                                prevIcon.classList.add('fa-chevron-down');
                            }
                        }
                    });
                }

                const nestedItems = nestedToggle.nextElementSibling;
                if (nestedItems && nestedItems.classList.contains('nested-items')) {
                    nestedItems.classList.toggle('show-nested');
                    const icon = nestedToggle.querySelector('i.fa-chevron-down, i.fa-chevron-up');
                    if (icon) {
                        icon.classList.toggle('fa-chevron-down');
                        icon.classList.toggle('fa-chevron-up');
                    }
                }

                // If it's a Surah, we want to select it and trigger load WITHOUT closing dropdown
                if (nestedToggle.classList.contains('surah-item')) {
                    const selectedTextSpan = selected.querySelector('span');
                    selectedTextSpan.innerHTML = nestedToggle.innerHTML.replace(/<i.*?>.*?<\/i>/g, '');

                    inputElement.value = nestedToggle.getAttribute('data-value');

                    const allItems = customElement.querySelectorAll('.select-item:not(.verse-item)');
                    allItems.forEach(i => i.classList.remove('same-as-selected'));
                    nestedToggle.classList.add('same-as-selected');

                    if (onChangeCallback) onChangeCallback();
                }

                return;
            }

            const item = e.target.closest('.select-item');
            if (!item) return;

            // Handle nested Verse selection specifically
            if (item.classList.contains('verse-item')) {
                const sNumber = item.getAttribute('data-surah-number');
                const vNumber = item.getAttribute('data-verse-number');

                const surahItemSelected = customElement.querySelector(`.surah-item[data-value="${sNumber}"]`);
                if (surahItemSelected) {
                    const selectedTextSpan = selected.querySelector('span');
                    selectedTextSpan.innerHTML = surahItemSelected.innerHTML.replace(/<i.*?>.*?<\/i>/g, '');
                }

                if (surahInput.value !== sNumber) {
                    surahInput.value = sNumber;
                    window.pendingVerseScroll = parseInt(vNumber) - 1;
                    if (onChangeCallback) onChangeCallback();
                } else {
                    const targetAyah = document.getElementById(`ayah-${parseInt(vNumber) - 1}`);
                    if (targetAyah) {
                        targetAyah.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        if (reciterInput.value !== 'none') {
                            targetAyah.click(); // trigger audio playback for this ayah
                        }
                    }
                }
                closeAllSelect();
                return;
            }

            // Update selected text
            const selectedTextSpan = selected.querySelector('span');
            selectedTextSpan.innerHTML = item.innerHTML.replace(/<i.*?>.*?<\/i>/g, ''); // Remove chevron from span text

            // Update hidden input value
            inputElement.value = item.getAttribute('data-value');

            // Highlight active item
            const allItems = this.querySelectorAll('.select-item:not(.verse-item)');
            allItems.forEach(i => i.classList.remove('same-as-selected'));
            item.classList.add('same-as-selected');

            // Close dropdown
            selected.click();

            // Trigger callback if data is loaded
            if (onChangeCallback) onChangeCallback();
        });
    };

    // Close all dropdowns if clicked outside
    function closeAllSelect(elmnt) {
        const x = document.getElementsByClassName("select-items");
        const y = document.getElementsByClassName("select-selected");
        const arrNo = [];
        for (let i = 0; i < y.length; i++) {
            if (elmnt == y[i]) {
                arrNo.push(i)
            } else {
                y[i].classList.remove("select-arrow-active");
            }
        }
        for (let i = 0; i < x.length; i++) {
            if (arrNo.indexOf(i)) {
                x[i].classList.add("select-hide");
            }
        }
    }

    document.addEventListener("click", closeAllSelect);

    if (surahCustom && readerContent) {
        // Init static dropdowns
        setupCustomDropdown(reciterCustom, reciterInput, () => handleReaderChange());
        setupCustomDropdown(transCustom, transInput, () => handleReaderChange());

        // Fetch Surahs List
        fetch('https://api.alquran.cloud/v1/surah')
            .then(response => response.json())
            .then(data => {
                const surahs = data.data;
                const surahListContainer = document.getElementById('surah-list');
                surahListContainer.innerHTML = '';

                data.data.forEach(surah => {
                    const item = document.createElement('div');
                    item.className = 'select-item nested-toggle surah-item';
                    item.setAttribute('data-value', surah.number);
                    item.innerHTML = `${surah.number}. ${surah.englishName} (${surah.name}) <i class="fa-solid fa-chevron-down"></i>`;
                    surahListContainer.appendChild(item);

                    const verseContainer = document.createElement('div');
                    verseContainer.className = 'nested-items';

                    for (let i = 1; i <= surah.numberOfAyahs; i++) {
                        const vItem = document.createElement('div');
                        vItem.className = 'select-item verse-item';
                        vItem.setAttribute('data-surah-number', surah.number);
                        vItem.setAttribute('data-verse-number', i);
                        vItem.innerHTML = `Verse ${i}`;
                        verseContainer.appendChild(vItem);
                    }
                    surahListContainer.appendChild(verseContainer);
                });

                // Initialize Surah dropdown after populating
                setupCustomDropdown(surahCustom, surahInput, () => handleReaderChange());
            })
            .catch(err => {
                const surahListContainer = document.getElementById('surah-list');
                if (surahListContainer) surahListContainer.innerHTML = '<div class="select-item" data-value="">Error Loading Surahs</div>';
                console.error('Error fetching surahs:', err);
            });

        // Function to load Surah content
        const loadSurah = (surahNumber, transEdition, reciterEdition) => {
            readerContent.innerHTML = '<div class="loading-spinner text-gold">Loading Surah...</div>';

            // Use Uthmani script as requested
            let editions = `quran-uthmani,${transEdition}`;
            if (transEdition === 'ar.quran-uthmani') {
                editions = 'quran-uthmani';
            }
            if (reciterEdition !== 'none') {
                editions += `,${reciterEdition}`;
            }

            fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/${editions}`)
                .then(response => response.json())
                .then(data => {
                    const arabicData = data.data[0];
                    let transData = null;
                    let audioData = null;

                    if (transEdition !== 'ar.quran-uthmani' && data.data.length > 1) {
                        transData = data.data[1];
                    }
                    if (reciterEdition !== 'none') {
                        audioData = data.data[data.data.length - 1]; // Audio edition is always the last requested
                    }

                    let htmlOutput = '';

                    // Add Bismillah for non Fatihah & non Tawbah surahs 
                    if (surahNumber != 1 && surahNumber != 9) {
                        htmlOutput += `<div class="ayah-container text-center mb-4">
                            <p class="arabic-text">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                         </div>`;
                    }

                    const translationColors = [
                        '#2e7d32', // Emerald Green
                        '#1565c0', // Deep Blue
                        '#880e4f', // Deep Pink/Maroon
                        '#6a1b9a', // Purple
                        '#bf360c', // Burnt Orange
                        '#00695c', // Teal
                        '#283593', // Indigo
                        '#4e342e', // Deep Brown
                        '#ad1457', // Magenta
                        '#00838f'  // Cyan
                    ];
                    // Pick a consistent color based on the surah number
                    const surahColor = translationColors[(surahNumber - 1) % translationColors.length];

                    arabicData.ayahs.forEach((ayah, index) => {
                        let translationHtml = '';
                        // Do not show translation if it's identical to the Arabic text or if Arabic Only is selected
                        if (transData && transData.ayahs[index] && transEdition !== 'ar.quran-uthmani') {
                            // Only show translation if it's actually an Urdu or English translation
                            if (transEdition.startsWith('ur.') || transEdition.startsWith('en.')) {
                                const transClass = transEdition.startsWith('ur.') ? 'translation-text urdu-translation' : 'translation-text';
                                translationHtml = `<p class="${transClass}" style="color: ${surahColor};">${transData.ayahs[index].text}</p>`;
                            }
                        }

                        // Remove Bismillah from ayah text if present
                        let ayahText = ayah.text;
                        if (surahNumber != 1 && index === 0 && ayahText.includes('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ')) {
                            ayahText = ayahText.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim();
                        }
                        // Alternate Bismillah for indopak
                        if (surahNumber != 1 && index === 0 && ayahText.includes('بِسۡمِ اللّٰہِ الرَّحۡمٰنِ الرَّحِیۡمِ')) {
                            ayahText = ayahText.replace('بِسۡمِ اللّٰہِ الرَّحۡمٰنِ الرَّحِیۡمِ', '').trim();
                        }

                        htmlOutput += `
                            <div class="ayah-container" id="ayah-${index}">
                                <p class="arabic-text">${ayahText} ﴿${ayah.numberInSurah}﴾</p>
                                ${translationHtml}
                            </div>
                        `;
                    });

                    readerContent.innerHTML = htmlOutput;
                    readerContent.scrollTop = 0; // Reset scroll

                    // Check if there's a pending verse navigate request
                    if (typeof window.pendingVerseScroll !== 'undefined' && window.pendingVerseScroll !== null) {
                        setTimeout(() => {
                            const targetAyah = document.getElementById(`ayah-${window.pendingVerseScroll}`);
                            if (targetAyah) {
                                targetAyah.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                if (reciterEdition !== 'none') {
                                    targetAyah.click(); // trigger audio playback for this ayah
                                }
                            }
                            window.pendingVerseScroll = null;
                        }, 100);
                    }

                    // Set up sequential Ayah-by-Ayah audio playback
                    const audioPlayerContainer = document.querySelector('.audio-player-dynamic');
                    if (reciterEdition === 'none') {
                        if (audioPlayerContainer) audioPlayerContainer.style.display = 'none';
                        if (quranAudio) quranAudio.pause();

                        // Ensure ayahs cursor is default not pointer
                        document.querySelectorAll('.ayah-container').forEach(container => {
                            container.style.cursor = 'default';
                        });
                    } else {
                        if (audioPlayerContainer) audioPlayerContainer.style.display = 'block';

                        if (quranAudio && audioData) {
                            const ayahs = audioData.ayahs;
                            let currentAyahIndex = 0;

                            // Load the first Ayah audio
                            const loadAyahAudio = (index) => {
                                if (index >= 0 && index < ayahs.length) {
                                    quranAudio.src = ayahs[index].audio;
                                    quranAudio.load();

                                    // Highlight active ayah
                                    document.querySelectorAll('.ayah-container').forEach(el => el.classList.remove('active-ayah'));

                                    const activeAyahElement = document.getElementById(`ayah-${index}`);

                                    if (activeAyahElement) {
                                        activeAyahElement.classList.add('active-ayah');
                                        // Smooth scroll to the active ayah
                                        activeAyahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                }
                            };

                            loadAyahAudio(currentAyahIndex);

                            // Remove old listeners to prevent stacking
                            const playNextAyah = () => {
                                currentAyahIndex++;
                                if (currentAyahIndex < ayahs.length) {
                                    loadAyahAudio(currentAyahIndex);
                                    quranAudio.play();
                                } else {
                                    // Surah finished, reset to beginning
                                    currentAyahIndex = 0;
                                    loadAyahAudio(currentAyahIndex);
                                }
                            };

                            quranAudio.removeEventListener('ended', window.quranAudioEndedHandler || (() => { }));
                            window.quranAudioEndedHandler = playNextAyah;
                            quranAudio.addEventListener('ended', playNextAyah);

                            // Allow clicking an ayah to start playing from there
                            document.querySelectorAll('.ayah-container').forEach((container, index) => {
                                container.style.cursor = 'pointer';
                                // clone and replace to avoid multiple event listeners
                                const newContainer = container.cloneNode(true);
                                container.parentNode.replaceChild(newContainer, container);

                                newContainer.addEventListener('click', () => {
                                    currentAyahIndex = index;
                                    loadAyahAudio(currentAyahIndex);
                                    quranAudio.play();
                                });
                            });
                        }
                    }
                })
                .catch(err => {
                    readerContent.innerHTML = '<div class="loading-spinner text-gold">Failed to load content. Please try again.</div>';
                    console.error('Error fetching surah content:', err);
                });
        };

        // Event Listeners for Dropdowns
        const handleReaderChange = () => {
            const surahNumber = surahInput.value;
            const transEdition = transInput.value || 'ar.quran-uthmani'; // Default to Arabic Only
            const reciterEdition = reciterInput.value || 'ar.alafasy';

            if (surahNumber) {
                // If there's an active ayah, save its position so it resumes there after reload
                const activeAyah = document.querySelector('.ayah-container.active-ayah');
                if (activeAyah && (typeof window.pendingVerseScroll === 'undefined' || window.pendingVerseScroll === null)) {
                    const ayahId = activeAyah.id.replace('ayah-', '');
                    window.pendingVerseScroll = parseInt(ayahId);
                }

                loadSurah(surahNumber, transEdition, reciterEdition);
            }
        };
    }

    // --- Tutors Modal Logic ---
    const tutorsData = {
        'm1': { name: 'Sheikh Ahmad', title: 'Tajweed Expert', desc: 'Sheikh Ahmad is a renowned expert in Tajweed and Qira\'at, with spanning decades of experience. He holds Ijazahs in all 10 Qira\'at.', exp: '15+ Years Experience', img: 'tutor_male.png' },
        'm2': { name: 'Sheikh Tariq', title: 'Hifz Instructor', desc: 'Sheikh Tariq specializes in systematic Quran memorization (Hifz) techniques for all ages. He has successfully mentored hundreds of Huffaz.', exp: '12+ Years Experience', img: 'tutor_male.png' },
        'm3': { name: 'Sheikh Omar', title: 'Islamic Studies', desc: 'A graduate of Al-Azhar University, Sheikh Omar provides deep insights into Fiqh, Hadith, and Seerah, making complex topics accessible.', exp: '10+ Years Experience', img: 'tutor_male.png' },
        'f1': { name: 'Ustadha Aisha', title: 'Quranic Arabic', desc: 'Ustadha Aisha holds an Ijazah in Arabic language and literature. Her proven methods quickly develop strong foundational skills.', exp: '8+ Years Experience', img: 'tutor_female.png' },
        'f2': { name: 'Ustadha Fatima', title: 'Tafseer and Tajweed', desc: 'With a deep passion for the Quranic sciences, Ustadha Fatima excels in teaching Tajweed for sisters and delivering inspiring Tafseer sessions.', exp: '11+ Years Experience', img: 'tutor_female.png' },
        'f3': { name: 'Ustadha Zainab', title: 'Children\'s Islamic Ed.', desc: 'Ustadha Zainab uses engaging, interactive methods to instill a love for the Quran and Islamic values in young learners.', exp: '9+ Years Experience', img: 'tutor_female.png' }
    };

    const modal = document.getElementById('tutor-modal');
    const closeBtn = document.querySelector('.close-modal');
    const tutorTriggers = document.querySelectorAll('.modal-trigger');

    tutorTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const tutorId = trigger.getAttribute('data-tutor');
            const data = tutorsData[tutorId];

            if (data) {
                document.getElementById('modal-img').src = data.img;
                document.getElementById('modal-name').textContent = data.name;
                document.getElementById('modal-title').textContent = data.title;
                document.getElementById('modal-desc').textContent = data.desc;
                document.getElementById('modal-exp').textContent = data.exp;

                modal.style.display = 'block';
            }
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // --- Certified Tutors Box Toggle Logic ---
    const certifiedTutorsBox = document.getElementById('certified-tutors-box');
    const tutorsSection = document.getElementById('tutors');

    if (certifiedTutorsBox && tutorsSection) {
        certifiedTutorsBox.addEventListener('click', () => {
            // Show the section
            tutorsSection.style.display = 'block';

            // Re-trigger the intersection observer for the hidden elements inside if needed
            const hiddenTutorElements = tutorsSection.querySelectorAll('.hidden');
            hiddenTutorElements.forEach((el) => observer.observe(el));

            // Scroll down to the newly visible section
            setTimeout(() => {
                tutorsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        });
    }
});
