(function () {
    function startRecognizer() {
        if ('webkitSpeechRecognition' in window) {
            let recognition = new webkitSpeechRecognition(),
                icon = document.getElementsByClassName('voice-icon')[0],
                townInput = document.getElementById('town');
            recognition.lang = 'ru-RU';

            recognition.onresult = function (event) {
                let result = event.results[0][0];
                console.clear();
                console.log(result.transcript);
                townInput.value = result.transcript;
                document.getElementById('send').click();
            };

            document.getElementById('voice').onclick = function (e) {
                e.preventDefault();
                recognition.start();
                icon.classList.add('voice-icon--active')
            };

            recognition.onspeechend = function () {
                recognition.stop();
                icon.classList.remove('voice-icon--active');
                townInput.value = '';
            };
            recognition.onspeechstart = function () {
                townInput.classList.remove('txt-input--invalid');
                townInput.value = '';
                document.getElementById('error').innerHTML = '';
            }

        } else {
            document.getElementById('voice').style.display = 'none'
        }
    }

    startRecognizer();


})();