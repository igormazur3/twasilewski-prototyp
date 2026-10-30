// Skrypty strony: menu, pojawianie się sekcji, test i formularze.
// Zdarzenia pomiaru trafiają do dataLayer (GA4 przez GTM, po zgodzie).
(function () {
    document.documentElement.classList.add('js');

    window.dataLayer = window.dataLayer || [];
    function track(event, params) {
        window.dataLayer.push(Object.assign({ event: event }, params || {}));
    }

    // WhatsApp: numer w formacie międzynarodowym bez plusa, np. 48500600700. DO UZUPEŁNIENIA.
    var WA_NUMBER = '';
    var WA_TEXT = 'Dzień dobry, piszę ze strony twasilewski.pl.';
    document.querySelectorAll('[data-wa]').forEach(function (a) {
        if (WA_NUMBER) a.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(WA_TEXT);
        a.addEventListener('click', function () {
            var place = a.closest('header, .hero, .contact, .mobile-bar, footer');
            track('whatsapp_click', { wa_place: place ? place.className.split(' ')[0] : 'inne' });
        });
    });

    // Przycisk „Zapytaj o to” w karcie usługi ustawia temat w formularzu kontaktowym.
    var topicSelect = document.querySelector('[data-topic-select]');
    document.querySelectorAll('[data-topic]').forEach(function (a) {
        a.addEventListener('click', function () {
            if (topicSelect) topicSelect.value = a.getAttribute('data-topic');
            track('service_ask', { service: a.getAttribute('data-topic') });
        });
    });

    // Menu mobilne
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('nav');
    if (toggle && nav) {
        toggle.addEventListener('click', function () {
            var open = nav.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        nav.addEventListener('click', function (e) {
            if (e.target.tagName === 'A') {
                nav.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Pojawianie się sekcji
    // Animujemy zawartość sekcji, nie samą ramę, żeby linie ramy stały w miejscu.
    var revealed = document.querySelectorAll('.section > .wrap > *');
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -10% 0px' });
        revealed.forEach(function (el) {
            el.classList.add('reveal');
            io.observe(el);
        });
    }

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Zmienny nagłówek w hero. Każdy problem przestawia też wąskie gardło w kartach pod nim.
    // Etapy: 0 reklama, 1 strona, 2 zapytanie, 3 sprzedaż.
    var PROBLEMS = [
        { a: 'Wydajesz więcej,', b: 'a firma ', c: 'nie rośnie?', leak: 2, title: 'Obsługa zapytań', text: 'Część zapytań czeka za długo albo ginie. Najpierw to, potem więcej reklam.' },
        { a: 'Zapytania są,', b: 'a klientów ', c: 'mało?', leak: 3, title: 'Proces sprzedaży', text: 'Zapytania przychodzą, ale nie kończą się umową. Problem jest po drodze, nie w reklamach.' },
        { a: 'Ruch jest,', b: 'a zapytań ', c: 'brak?', leak: 1, title: 'Strona', text: 'Ludzie wchodzą i wychodzą, zanim zostawią kontakt. Więcej ruchu tego nie naprawi.' },
        { a: 'Reklamy klikają,', b: 'a nikt nie ', c: 'kupuje?', leak: 0, title: 'Reklamy', text: 'Budżet idzie na ludzi, którzy nie kupią. Najpierw to, potem więcej pieniędzy.' }
    ];
    var rotator = document.querySelector('[data-rotator]');
    var heroFunnel = document.querySelector('[data-hero-funnel]');
    var heroAlert = document.querySelector('[data-hero-alert]');
    if (rotator && !reduceMotion) {
        var rotA = rotator.querySelector('[data-rot-a]');
        var rotB = rotator.querySelector('[data-rot-b]');
        var idx = 0;
        var paused = false;

        var setFunnel = function (leak) {
            Array.prototype.forEach.call(heroFunnel.children, function (li, i) {
                var b = li.querySelector('b');
                li.classList.toggle('is-leak', i === leak);
                b.className = i < leak ? 'ok' : (i === leak ? '' : 'dim');
                b.textContent = i < leak ? 'w porządku' : (i === leak ? 'tu ucieka' : 'czeka');
            });
        };

        var next = function () {
            if (paused || document.hidden) return;
            idx = (idx + 1) % PROBLEMS.length;
            var p = PROBLEMS[idx];
            rotator.classList.add('is-out');
            heroAlert.classList.add('is-swap');
            setTimeout(function () {
                rotA.textContent = p.a;
                rotB.innerHTML = '';
                rotB.appendChild(document.createTextNode(p.b));
                var acc = document.createElement('span');
                acc.className = 'accent';
                acc.textContent = p.c;
                rotB.appendChild(acc);
                heroAlert.querySelector('.alert-title').textContent = p.title;
                heroAlert.querySelector('.alert-text').textContent = p.text;
                setFunnel(p.leak);
                rotator.classList.remove('is-out');
                rotator.classList.add('is-in');
                heroAlert.classList.remove('is-swap');
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () { rotator.classList.remove('is-in'); });
                });
            }, 450);
        };

        var heroCopy = document.querySelector('.hero-copy');
        heroCopy.addEventListener('mouseenter', function () { paused = true; });
        heroCopy.addEventListener('mouseleave', function () { paused = false; });
        heroCopy.addEventListener('focusin', function () { paused = true; });
        heroCopy.addEventListener('focusout', function () { paused = false; });
        setInterval(next, 5000);
    }

    // Liczby w sekcji „Dlaczego” odliczają od zera, gdy pojawią się na ekranie. Wartość końcowa stoi w HTML.
    var counters = document.querySelectorAll('[data-count]');
    if (counters.length && !reduceMotion && 'IntersectionObserver' in window) {
        var countIo = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                var end = Number(el.getAttribute('data-count'));
                var start = performance.now();
                var tick = function (now) {
                    var t = Math.min((now - start) / 1200, 1);
                    el.textContent = Math.round(end * (1 - Math.pow(1 - t, 3))) + '+';
                    if (t < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
                countIo.unobserve(el);
            });
        }, { threshold: 0.6 });
        counters.forEach(function (el) { countIo.observe(el); });
    }

    // Jak pracuję: krok na środku ekranu staje się aktywny i przełącza ilustrację obok.
    var howSteps = document.querySelectorAll('.how-steps li');
    var howPanels = document.querySelectorAll('.how-panel');
    var howCount = document.querySelector('[data-how-count]');
    if (howSteps.length && 'IntersectionObserver' in window) {
        var activate = function (n) {
            howSteps.forEach(function (li, i) { li.classList.toggle('is-active', i === n); });
            howPanels.forEach(function (el, i) { el.classList.toggle('is-active', i === n); });
            howCount.textContent = 'Krok 0' + (n + 1) + ' / 0' + howSteps.length;
        };
        var howIo = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) activate(Number(entry.target.getAttribute('data-step')));
            });
        }, { rootMargin: '-45% 0px -45% 0px' });
        howSteps.forEach(function (li) { howIo.observe(li); });
    }

    // Test: każda odpowiedź dodaje punkty obszarom.
    var QUESTIONS = [
        {
            q: 'Czy wiesz, ile kosztuje Cię zdobycie jednego klienta?',
            a: [
                ['Tak, znam tę liczbę', {}],
                ['Mniej więcej', { dane: 1 }],
                ['Nie wiem', { dane: 2 }]
            ]
        },
        {
            q: 'Czy liczby z panelu reklamowego zgadzają się z tym, co widzisz w sprzedaży?',
            a: [
                ['Tak, zgadzają się', {}],
                ['Nie bardzo', { dane: 2 }],
                ['Nikt tego nie porównywał', { dane: 2 }]
            ]
        },
        {
            q: 'Co działo się ze sprzedażą, gdy rósł budżet na reklamy?',
            a: [
                ['Rosła razem z budżetem', {}],
                ['Rosła, ale wolniej niż budżet', { reklamy: 1 }],
                ['Prawie nie drgnęła', { reklamy: 2 }],
                ['Budżet nie rósł', {}]
            ]
        },
        {
            q: 'Ile osób z tych, które wchodzą na stronę, zostawia zapytanie albo kupuje?',
            a: [
                ['Wiem i to mi wystarcza', {}],
                ['Wiem, ale to za mało', { strona: 2 }],
                ['Nie wiem', { dane: 1, strona: 1 }]
            ]
        },
        {
            q: 'Co dzieje się z zapytaniem, które przychodzi do firmy?',
            a: [
                ['Ktoś odpowiada tego samego dnia i prowadzi temat do końca', {}],
                ['Odpowiadamy, kiedy ktoś znajdzie czas', { sprzedaz: 2 }],
                ['Bywa, że zapytania giną', { sprzedaz: 3 }]
            ]
        },
        {
            q: 'Czy wracasz do ludzi, którzy już kupili albo o coś pytali?',
            a: [
                ['Tak, mamy maile albo automatyczne wiadomości', {}],
                ['Czasem, ręcznie', { relacje: 1 }],
                ['Nie', { relacje: 2 }]
            ]
        },
        {
            q: 'Ile powtarzalnej pracy w marketingu i sprzedaży robicie ręcznie?',
            a: [
                ['Niewiele', {}],
                ['Sporo', { sprzedaz: 1, relacje: 1 }],
                ['Większość', { sprzedaz: 1, relacje: 2 }]
            ]
        }
    ];

    // Kolejność rozstrzyga remisy: bez pewnych danych reszta jest zgadywaniem.
    var ORDER = ['dane', 'sprzedaz', 'strona', 'reklamy', 'relacje'];
    var LABELS = { dane: 'Dane', reklamy: 'Reklamy', strona: 'Strona', sprzedaz: 'Obsługa zapytań', relacje: 'Powracający klienci' };

    var RESULTS = {
        dane: ['Dane, którym nie możesz ufać', 'Bez pewnych liczb każda decyzja o budżecie to zgadywanie. Możesz dokładać pieniędzy do kanału, który dobrze wygląda tylko w raporcie. Od tego bym zaczął: pomiar ustawiony tak, żeby było widać, co naprawdę sprzedaje.'],
        reklamy: ['Reklamy, które nie przekładają się na sprzedaż', 'Budżet rośnie, sprzedaż nie. Zwykle to znaczy, że płacisz za ruch, który nie kupuje, albo kampanie są ustawione pod kliknięcia, a nie pod klientów.'],
        strona: ['Strona, która nie zamienia ruchu w klientów', 'Ludzie przychodzą i wychodzą. Więcej reklam tego nie naprawi, bo to dolewanie wody do dziurawego wiadra. Najpierw trzeba znaleźć miejsce, w którym odpadają.'],
        sprzedaz: ['To, co dzieje się z zapytaniem', 'Płacisz za zapytania, a część z nich ginie albo czeka za długo. To najtańsze pieniądze do odzyskania, bo klient już sam się zgłosił.'],
        relacje: ['Klienci, do których nie wracasz', 'Zwykle łatwiej sprzedać komuś, kto już Cię zna, niż zdobyć nowego klienta. Baza kontaktów, z którą nic się nie dzieje, to pieniądze, które leżą na stole.'],
        ok: ['Masz porządek w podstawach', 'Z Twoich odpowiedzi nie wynika jedno oczywiste wąskie gardło. Wtedy szukam wzrostu: gdzie dołożyć, żeby firma urosła szybciej.']
    };

    // Maksymalna liczba punktów w każdym obszarze, do skalowania pasków wyniku.
    var MAX = {};
    QUESTIONS.forEach(function (item) {
        var best = {};
        item.a.forEach(function (option) {
            Object.keys(option[1]).forEach(function (k) { best[k] = Math.max(best[k] || 0, option[1][k]); });
        });
        Object.keys(best).forEach(function (k) { MAX[k] = (MAX[k] || 0) + best[k]; });
    });

    function level(ratio) {
        if (ratio >= 0.6) return 'wysokie';
        if (ratio > 0.2) return 'średnie';
        return 'niskie';
    }

    var quiz = document.querySelector('[data-quiz]');
    if (quiz) {
        var steps = {
            start: quiz.querySelector('[data-step="start"]'),
            questions: quiz.querySelector('[data-step="questions"]'),
            result: quiz.querySelector('[data-step="result"]')
        };
        var elQuestion = quiz.querySelector('[data-quiz-question]');
        var elOptions = quiz.querySelector('[data-quiz-options]');
        var elCount = quiz.querySelector('[data-quiz-count]');
        var elProgress = quiz.querySelector('[data-quiz-progress]');
        var answers = [];
        var current = 0;

        QUESTIONS.forEach(function () { elProgress.appendChild(document.createElement('span')); });

        function pad(n) { return (n < 10 ? '0' : '') + n; }

        function show(name) {
            Object.keys(steps).forEach(function (k) { steps[k].hidden = k !== name; });
        }

        function render() {
            var item = QUESTIONS[current];
            elCount.textContent = pad(current + 1) + ' / ' + pad(QUESTIONS.length);
            Array.prototype.forEach.call(elProgress.children, function (seg, i) {
                seg.classList.toggle('is-done', i <= current);
            });
            elQuestion.textContent = item.q;
            elOptions.innerHTML = '';
            item.a.forEach(function (option, i) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'quiz-option';
                var key = document.createElement('kbd');
                key.textContent = String.fromCharCode(65 + i);
                b.appendChild(key);
                b.appendChild(document.createTextNode(option[0]));
                b.addEventListener('click', function () { answer(i); });
                elOptions.appendChild(b);
            });
            quiz.querySelector('[data-quiz-back]').hidden = current === 0;
            track('quiz_step', { quiz_step: current + 1 });
        }

        function answer(i) {
            answers[current] = i;
            current += 1;
            if (current < QUESTIONS.length) {
                render();
                elOptions.querySelector('button').focus();
            } else {
                finish();
            }
        }

        function finish() {
            var score = {};
            answers.forEach(function (a, qi) {
                var points = QUESTIONS[qi].a[a][1];
                Object.keys(points).forEach(function (k) { score[k] = (score[k] || 0) + points[k]; });
            });
            // Wynik to obszar z największym odsetkiem możliwych punktów, remis rozstrzyga ORDER.
            var best = 'ok', max = 0;
            ORDER.forEach(function (k) {
                var ratio = (score[k] || 0) / MAX[k];
                if (ratio > max) { max = ratio; best = k; }
            });

            var r = RESULTS[best];
            quiz.querySelector('[data-result-title]').textContent = best === 'ok' ? r[0] : 'Twoje wąskie gardło: ' + r[0].charAt(0).toLowerCase() + r[0].slice(1);
            quiz.querySelector('[data-result-text]').textContent = r[1];
            quiz.querySelector('[data-result-field]').value = best;

            var bars = quiz.querySelector('[data-result-bars]');
            bars.innerHTML = '<p class="result-bars-label mono">Ryzyko strat w każdym obszarze</p>';
            ORDER.forEach(function (k) {
                var ratio = (score[k] || 0) / MAX[k];
                var row = document.createElement('div');
                row.className = 'result-bar' + (k === best ? ' is-top' : '');
                row.innerHTML = '<span></span><i></i><b></b>';
                row.querySelector('span').textContent = LABELS[k];
                row.querySelector('i').style.setProperty('--v', Math.max(ratio * 100, 4) + '%');
                row.querySelector('b').textContent = level(ratio);
                bars.appendChild(row);
            });

            show('result');
            quiz.querySelector('[data-result-title]').focus();
            track('quiz_complete', { quiz_result: best });
        }

        function restart(params) {
            answers = [];
            current = 0;
            show('questions');
            track('quiz_start', params);
            render();
        }

        quiz.querySelector('[data-quiz-start]').addEventListener('click', function () { restart(); });

        // Pole w hero: zapisuje adres strony do formularza wyniku i od razu uruchamia test.
        var heroForm = document.querySelector('[data-hero-form]');
        if (heroForm) {
            heroForm.addEventListener('submit', function (e) {
                e.preventDefault();
                var www = heroForm.querySelector('[name="www"]').value.trim();
                if (www && !/^https?:\/\//i.test(www)) www = 'https://' + www;
                quiz.querySelector('[data-form="lead"] [name="www"]').value = www;
                document.getElementById('test').scrollIntoView({ behavior: 'smooth' });
                restart({ quiz_source: 'hero', has_www: www !== '' });
            });
        }
        quiz.querySelector('[data-quiz-restart]').addEventListener('click', function () { restart({ quiz_restart: true }); });
        quiz.querySelector('[data-quiz-back]').addEventListener('click', function () {
            if (current > 0) { current -= 1; render(); }
        });
    }

    // Formularze. W prototypie bez wysyłki, w motywie zapis przez admin-post.php i wp_mail.
    document.querySelectorAll('[data-form]').forEach(function (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var valid = true;
            form.querySelectorAll('[required]').forEach(function (field) {
                var ok = field.type === 'checkbox' ? field.checked : field.value.trim() !== '' && field.checkValidity();
                field.setAttribute('aria-invalid', ok ? 'false' : 'true');
                if (!ok && valid) { field.focus(); valid = false; }
            });
            if (!valid) return;
            var kind = form.getAttribute('data-form');
            if (kind === 'lead') {
                track('lead_submit', { quiz_result: form.querySelector('[name="wynik"]').value });
            } else if (kind === 'contact') {
                track('contact_submit', { topic: form.querySelector('[name="temat"]').value || 'nie-wiem' });
            } else {
                track('video_request');
            }
            form.querySelectorAll('input, select, textarea, button').forEach(function (el) { el.disabled = true; });
            form.querySelector('.form-ok').hidden = false;
        });
    });
})();
