/*
* Игра в города.
* Игра использует Geonames API. Каждый ввод города посылает запрос к Geonames и получает результат в виде
* списка городов, которые могут быть подходящими. Т.е., города получаются по одному в ходе игры. Это позволяет
* называть в игре любой город мира, что было бы невозможно при полученном или заданном заранее списке городов,
* потому что они заведомо менее полные.
*
* */

(function () {
    ymaps.ready(init);

    function init() {

        let cities = [],
            currentLastChar = '',
            firstPlayer = drawPlayer(), // 0 - computer, 1 - user
            townInput = document.getElementById('town'),
            errorBlock = document.getElementById('error'),
            finish = document.getElementById('finish'),
            sendBtn = document.getElementById('send'),
            map = new ymaps.Map("map", {
                center: [36.71760102758775, -4.568153582031248],
                zoom: 2
            }),
            userCollection = new ymaps.GeoObjectCollection(null, {
                preset: 'islands#redIcon'
            }),
            compCollection = new ymaps.GeoObjectCollection(null, {
                preset: 'islands#darkGreenIcon'
            });
        map.geoObjects.add(userCollection).add(compCollection);

        document.getElementById('draw').innerHTML = firstPlayer.phrase;

        townInput.disabled = true;
        sendBtn.disabled = true;

        if (firstPlayer.player === 0) {
            currentLastChar = randomLetter();
            setTimeout(function () { // отсрочка вызова на 1,5 сек - имитация того, что компьютер «думает»
                compInput(currentLastChar)
            }, 1500);
        } else {
            townInput.disabled = false;
            sendBtn.disabled = false;
            townInput.focus();
        }

        townInput.addEventListener('keydown', function () {
            hideError();
        });

        sendBtn.addEventListener('click', function (e) {
            e.preventDefault();
            let value = townInput.value;

            // валидация поля ввода города
            if (value === '') {
                showError("Поле не должно быть пустым");
            } else if (isNamed(value)) {
                showError("Города не должны повторяться");
            } else if (value.charAt(0).toLowerCase() !== currentLastChar && currentLastChar !== '') {
                showError("Нужно назвать город на букву «" + currentLastChar + "»");
            } else {
                userInput(value);
            }

        });

        document.getElementById('concede').addEventListener('click', function (e) {
            e.preventDefault();
            showResults('comp');
        });

        /**
         * Функция выбирает, кто ходит первым: компьютер или юзер.
         *
         * @returns {number} player 0 - компьютер, 1 - юзер
         * @returns {string} phrase информационная фраза, соответствующая выбранному игроку
         */
        function drawPlayer() {
            let phrase = ['первым ходит компьютер', 'первый ход за вами'],
                player = Math.round(Math.random());

            return {
                'player': player,
                'phrase': phrase[player]
            };
        }


        /**
         * Функция обработки того, что ввёл пользователь.
         * Функция отправлет запрос к Geonames API и получает список городов, отвечающих тому, что ввёл юзер.
         * Отфильтровывает и выбирает из них тот, который скорее всего ввёл пользователь. Добавляет город на карту.
         * Фильтрация нужна, потому что Geonames на запрос "Минск" может вернуть геообъекты с названиями и "Минск",
         * и "Horad Minsk" и т.п.
         *
         * @param {string} value пользователем название города
         */

        function userInput(value) {
            const url = 'https://secure.geonames.org/searchJSON?name=' + value + '&cities=cities15000&lang=ru&style=MEDIUM&maxRows=20&fclass=P&username=mankutila';
            let place = {};
            fetch(url)
                .then((resp) => resp.json())
                .then(function (data) {

                    if (data.totalResultsCount !== 0) {
                        let i = 0;
                        while (!/^[А-ЯЁ\s-]*$/i.test(data.geonames[i].name)) { //выбрать только кириллические названия
                            if (data.geonames.length - 1 === i) {
                                document.getElementById('error').innerHTML = "Не могу найти город с таким названием";
                                return false;
                            }
                            i++;
                        }
                        place = data.geonames[i];
                        cities.push({
                            'name': place.name,
                            'coord': [place.lat, place.lng],
                            'country': place.countryName,
                            'owner': 'user'
                        });
                        currentLastChar = getLastChar(place.name);
                        showInfo('Текущая буква: ' + currentLastChar);
                        showInfo(cities[cities.length - 1].name + ' (' + cities[cities.length - 1].country + ')');
                        userCollection.add(new ymaps.Placemark(cities[cities.length - 1].coord, {
                            balloonContent: '<b>' + cities[cities.length - 1].name + '</b><br> Назвал пользователь'
                        }));
                        townInput.value = '';
                        townInput.disabled = true;
                        sendBtn.disabled = true;
                        setTimeout(function () { // отсрочка вызова на 1,5 сек - имитация того, что компьютер «думает»
                            compInput(currentLastChar)
                        }, 1500);
                    } else {
                        document.getElementById('error').innerHTML = "Не могу найти город с таким названием"
                    }

                })
                .catch(function (error) {
                    console.log(error);
                });
        }

        /**
         * Функция хода компьютера.
         * Функция запрашивает у Geonames API 50 городов на текущую букву, а затем выбирает из них случайный,
         * отфильтровывая ненужные, и выводит. Добавляет выбранный город на карту
         * Фильтрация нужна, потому что Geonames на запрос, например, на букву "г" может вернуть геообъекты с названиями и "Гродно",
         * и "Горад Гродна", и с латиницей в названии и т.п.
         *
         * @param {string} firstChar буква, на которую компьютер должен назвать город
         */
        function compInput(firstChar) {
            const url = 'https://secure.geonames.org/searchJSON?name_startsWith=' + firstChar + '&orderby=population&cities=cities15000&lang=ru&style=MEDIUM&maxRows=50&fclass=P&username=mankutila';
            let place = {}, index;
            fetch(url)
                .then((resp) => resp.json())
                .then(function (data) {
                    let dataArray = data.geonames;

                    index = Math.round(Math.random() * 50); //мы запрашиваем всегда только 50 городов, поэтому выбираем случайный из 50

                    while (isNamed(dataArray[index].name) || /(Горад )/i.test(dataArray[index].name) || !/^[А-ЯЁ\s-]*$/i.test(dataArray[index].name)) {
                        dataArray.splice(index, 1);
                        if (dataArray.length === 0) {
                            showResults('user');
                            return false;
                        }
                        index = Math.round(Math.random() * dataArray.length);
                    }

                    place = dataArray[index];
                    cities.push({
                        'name': place.name,
                        'coord': [place.lat, place.lng],
                        'country': place.countryName,
                        'owner': 'comp'
                    });
                    compCollection.add(new ymaps.Placemark(cities[cities.length - 1].coord, {
                        balloonContent: '<b>' + cities[cities.length - 1].name + '</b><br> Назвал компьютер'
                    }));
                    currentLastChar = getLastChar(place.name);
                    showInfo('Текущая буква: ' + currentLastChar);
                    showInfo(cities[cities.length - 1].name + ' (' + cities[cities.length - 1].country + ')');
                    townInput.disabled = false;
                    sendBtn.disabled = false;

                })
                .catch(function (error) {
                    console.log(error);
                });
        }

        /**
         * Функция проверяет, назывался ли город или нет
         *
         * @param {string} town название города
         * @returns {boolean} true - назывался, false - не назывался
         */
        function isNamed(town) {
            for (let i = 0; i < cities.length; i++) {
                if (town.toLowerCase() === cities[i].name.toLowerCase()) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Функция получает последнюю букву слова с учётом правил игры в города
         *
         * @param {string} word название города
         * @returns {string} char последняя буква названия города, отвечающая правилам игры
         */
        function getLastChar(word) {
            let char = word.slice(-1);
            if (char === 'ь' || char === 'ъ' || char === 'ы' || char === 'й') {
                return getLastChar(word.substring(0, word.length - 1));
            }
            return char;
        }

        /**
         * Функция получает случайную букву алфавита (кроме ь, ъ, ы и й)
         *
         * @returns {string} случайная буква
         */
        function randomLetter() {
            const alphabet = 'абвгдеёжзиклмнопрстуфхцчшщэюя';
            return alphabet[Math.round(Math.random() * (alphabet.length - 1))];
        }

        /**
         * Функция выводит информационные сообщения в блок с текущими результатами игры
         *
         * @param {string} txt Текст, который нужно вывести
         */
        function showInfo(txt) {
            let info = document.createElement('p');
            info.innerHTML = txt;
            document.getElementsByClassName('game__result')[0].prepend(info);
        }

        /**
         * Функция выводит информационные сообщения после окончания игры
         *
         * @param {string} winner Имя игрока, который выиграл. 'comp' - компьютер, 'user' - пользователь
         */
        function showResults(winner) {
            document.getElementsByClassName('game')[0].style.display = 'none';
            finish.style.display = 'flex';
            if (cities.length === 0) {
                finish.innerHTML = 'Никто ничего не назвал :('
            } else {
                let winnerTxt = document.createElement('h2');
                if (winner === 'comp') {
                    winnerTxt.innerHTML = 'Выиграл компьютер';
                } else {
                    winnerTxt.innerHTML = 'Вы выиграли!';
                }
                finish.prepend(winnerTxt);

                for (let i = 0; i < cities.length; i++) {
                    let info = document.createElement('p');
                    info.innerHTML = cities[i].name;
                    if (cities[i].owner === 'user') {
                        document.getElementsByClassName('game-finish__user')[0].append(info)
                    } else {
                        document.getElementsByClassName('game-finish__comp')[0].append(info)
                    }
                }
            }
        }

        /**
         * Функция показывает ошибку валидации поля ввода города
         *
         * @param {string} txt Текст ошибки
         */
        function showError(txt) {
            errorBlock.innerHTML = txt;
            townInput.value = '';
            townInput.classList.add('txt-input--invalid');
        }

        /**
         * Функция скрывает ошибку валидации поля ввода города
         */
        function hideError() {
            errorBlock.innerHTML = '';
            townInput.classList.remove('txt-input--invalid');
        }

    }
})();