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
            setTimeout(function () {
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
            // showResults('user');
        });

        // console.log(cities);
        // console.log(getLastChar('Неаполь'));

        function drawPlayer() {
            let phrase = ['первым ходит компьютер', 'первый ход за вами'],
                player = Math.round(Math.random());

            return {
                'player': player,
                'phrase': phrase[player]
            };
        }

        function userInput(value) {
            const url = 'https://secure.geonames.org/searchJSON?name=' + value + '&cities=cities15000&lang=ru&style=MEDIUM&maxRows=20&fclass=P&username=mankutila';
            let place = {};
            fetch(url)
                .then((resp) => resp.json())
                .then(function (data) {
                    console.log(data);
                    if (data.totalResultsCount !== 0) {
                        let i = 0;
                        while (!/^[А-ЯЁ\s-]*$/i.test(data.geonames[i].name)) {
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
                        showResult('Текущая буква: ' + currentLastChar);
                        showResult(cities[cities.length - 1].name + ' (' + cities[cities.length - 1].country + ')');
                        userCollection.add(new ymaps.Placemark(cities[cities.length - 1].coord, {
                            balloonContent: '<b>' + cities[cities.length - 1].name + '</b><br> Назвал пользователь'
                        }));
                        townInput.value = '';
                        townInput.disabled = true;
                        sendBtn.disabled = true;
                        setTimeout(function () {
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

        function compInput(firstChar) {
            const url = 'https://secure.geonames.org/searchJSON?name_startsWith=' + firstChar + '&orderby=population&cities=cities15000&lang=ru&style=MEDIUM&maxRows=50&fclass=P&username=mankutila';
            let place = {}, index;
            fetch(url)
                .then((resp) => resp.json())
                .then(function (data) {
                    console.log(data);
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
                    showResult('Текущая буква: ' + currentLastChar);
                    showResult(cities[cities.length - 1].name + ' (' + cities[cities.length - 1].country + ')');
                    townInput.disabled = false;
                    sendBtn.disabled = false;

                })
                .catch(function (error) {
                    console.log(error);
                });
        }

        function isNamed(city) {
            for (let i = 0; i < cities.length; i++) {
                if (city.toLowerCase() === cities[i].name.toLowerCase()) {
                    return true;
                }
            }
            return false;
        }

        function getLastChar(word) {
            let char = word.slice(-1);
            if (char === 'ь' || char === 'ъ' || char === 'ы' || char === 'й') {
                return getLastChar(word.substring(0, word.length - 1));
            }
            return char;
        }

        function randomLetter() {
            const alphabet = 'абвгдеёжзиклмнопрстуфхцчшщэюя';
            return alphabet[Math.round(Math.random() * (alphabet.length - 1))];
        }

        function showResult(txt) {
            let info = document.createElement('p');
            info.innerHTML = txt;
            document.getElementsByClassName('game__result')[0].prepend(info);
        }

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

        function showError(txt) {
            errorBlock.innerHTML = txt;
            townInput.value = '';
            townInput.classList.add('txt-input--invalid');
        }

        function hideError() {
            errorBlock.innerHTML = '';
            townInput.classList.remove('txt-input--invalid');

        }

    }
})();