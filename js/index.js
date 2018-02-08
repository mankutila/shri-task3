(function() {
    ymaps.ready(init);

    function init() {

        let cities = [],
            currentLastChar = '';


        let map = new ymaps.Map("map", {
            center: [36.71760102758775, -4.568153582031248],
            zoom: 2
        }),
        userCollection = new ymaps.GeoObjectCollection(null, {
            preset: 'islands#yellowIcon'
        }),
        compCollection = new ymaps.GeoObjectCollection(null, {
            preset: 'islands#blueIcon'
        });
        // compCollection.add(new ymaps.Placemark([55.73, 37.75]));
        map.geoObjects.add(userCollection).add(compCollection);




        document.getElementById('send').addEventListener('click', function(e) {
            e.preventDefault();
            let value = document.getElementById('town').value;
            checkUserInput(value);
        });

        // console.log(checkUserInput('Минск'));
        console.log(cities);
        // console.log(getLastChar('Неаполь'));

        function checkUserInput(value) {
            const url = 'http://api.geonames.org/searchJSON?name=' + value + '&cities=cities15000&lang=ru&style=MEDIUM&maxRows=20&fclass=P&username=mankutila';
            let place = {};
            fetch(url)
                .then((resp) => resp.json())
                .then(function (data) {
                    console.log(data);
                    if (data.totalResultsCount !== 0) {
                        place = data.geonames[0];
                        cities.push({
                            'name': place.name,
                            'coord': [place.lat, place.lng],
                            'country': place.countryName,
                            'owner' : 'user'
                        });
                        showResult(cities[cities.length - 1].name + ' (' + cities[cities.length - 1].country + ')');
                        currentLastChar = getLastChar(place.name);
                        showResult('Текущая буква: ' + currentLastChar);
                        userCollection.add(new ymaps.Placemark(cities[cities.length - 1].coord));
                        setTimeout(function() {
                            compInput(currentLastChar)
                        }, 3000);
                    }

                })
                .catch(function (error) {
                    console.log(error);
                });
        }

        function compInput(firstChar) {
            const url = 'http://api.geonames.org/searchJSON?name_startsWith=' + firstChar + '&orderby=population&cities=cities15000&lang=ru&style=MEDIUM&maxRows=50&fclass=P&username=mankutila';
            let place = {}, index;
            fetch(url)
                .then((resp) => resp.json())
                .then(function (data) {
                    console.log(data);
                    if (data.totalResultsCount !== 0) {
                        index = Math.round(Math.random() * 50); //мы запрашиваем всегда только 50 городов, поэтому выбираем случайный из 50
                        place = data.geonames[index];
                        cities.push({
                            'name': place.name,
                            'coord': [place.lat, place.lng],
                            'country': place.countryName,
                            'owner' : 'comp'
                        });
                        showResult(cities[cities.length - 1].name + ' (' + cities[cities.length - 1].country + ')');
                        compCollection.add(new ymaps.Placemark(cities[cities.length - 1].coord));
                        currentLastChar = getLastChar(place.name);
                        showResult('Текущая буква: ' + currentLastChar);
                    }

                })
                .catch(function (error) {
                    console.log(error);
                });
        }

        function placeMark(city) {
            let placemark = new YMaps.Placemark(new YMaps.GeoPoint(city.lng,city.lat));

            // Добавляет метку на карту
            map.addOverlay(placemark);
        }

        function getLastChar(word) {
            let char = word.slice(-1);
            if (char === 'ь' || char === 'ъ' || char === 'ы' || char === 'й') {
                return getLastChar(word.substring(0, word.length - 1));
            }
            return char;
        }

        function showResult(txt) {
            let info = document.createElement('p'),
                item = cities[cities.length - 1];
            info.innerHTML = txt;

            document.getElementsByClassName('game__result')[0].appendChild(info);
        }




        /*

        ymaps.ready(init);

        function init() {
            var monitriceMap = new ymaps.Map("map-monitris", {
                    center: [55.75399399999374,37.62209300000001],
                    zoom: 11
                }),
                doulaMap = new ymaps.Map("map-doula", {
                    center: [55.75399399999374,37.62209300000001],
                    zoom: 11
                });
            showBaloons(infoMonitris.items, monitriceMap);
            showBaloons(infoDoulas.items, doulaMap);
        }

        function showBaloons(array, map) {
            array.forEach(function(item, i) {
                var myGeocoder = ymaps.geocode(item.address);
                myGeocoder.then(
                    function (res) {
                        var firstGeoObject = res.geoObjects.get(0),
                            slideItem = $('[data-id="' + item.id + '"]'),
                            slideItemSel = '[data-id="' + item.id + '"]';
                        firstGeoObject.options.set({
                            iconLayout: 'default#image',
                            iconImageHref: '/wp-content/themes/monitrice2017/images/pin.svg',
                            iconImageSize: [54, 81],
                            iconImageOffset: [-50, -70],
                            balloonCloseButton: false
                        });
                        firstGeoObject.properties.set({
                            balloonContentBody: [
                                '<a class="balloon-inner" href="' + item.link + '">',
                                '<div class="balloon-inner__left">',
                                '<p>' + item.name + '</p>',
                                '</div>',
                                '<div class="balloon-inner__right">',
                                '<img src="' + item.imgSrc + '" />',
                                '</div>',
                                '</a>'
                            ].join('')
                        });
                        console.log(slideItem);
                        map.geoObjects.add(firstGeoObject);
                        firstGeoObject.balloon.events.add('click', function() {
                            localStorage.setItem("specId", item.id);
                        });
                        $('.under-map .slider').on('click', slideItemSel, function(e) {
                            map.balloon.close();
                            if (firstGeoObject.balloon.isOpen()) {
                                firstGeoObject.balloon.close();
                            } else {
                                map.panTo(firstGeoObject.geometry.getCoordinates(), {
                                    delay: 0,
                                    callback: function () {
                                        firstGeoObject.balloon.open();
                                    }
                                });
                            }
                        });
                    },
                    function (err) {
                        console.log('error');
                    }
                );
            });
        }*/
        }
    })();