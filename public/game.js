var socket = io.connect();

var game = {
    energy: 0, // starting energy
    dom: document.querySelector("#energy"),
    update_dom: function() {
        this.dom.innerHTML = this.energy;
    }
};

var like_button = {
    remaining_time: 0,  // milliseconds
    default_html: 'I love this game! <span class="details">+500</span>',
    dom: document.querySelector("#like"),
    click_like: function() {
        if (!this.remaining_time) {
            socket.emit('click_like');
        }
    },
    update_dom: function() {
        var seconds_left = this.remaining_time / 1000;
        
        // The "like" button is off cooldown! enable it again!
        if (seconds_left <= 0){
            this.dom.classList.remove("disabled");
            this.dom.removeAttribute("disabled");
            this.dom.childNodes[0].innerHTML = this.default_html;
        }

        // The "like" button is still on cooldown. Update the time remaining
        else {
            this.dom.classList.add("disabled");
            this.dom.setAttribute("disabled");
            var seconds = Math.round(seconds_left) % 60;
            var minutes = Math.floor(seconds_left / 60) % 60;
            var hours = Math.floor(seconds_left / 60 / 60);

            hours = (hours<10? '0':'') + hours;
            minutes = (minutes<10? '0':'') + minutes;
            seconds = (seconds<10? '0':'') + seconds;
            this.dom.childNodes[0].innerHTML = "Wait " + hours + ":" + minutes +  ":" + seconds;
        }
    }
};

socket.on('energy_update', function (data) {
    game.energy = data.energy;
    game.update_dom();
});

socket.on('like_update', function (data) {
    like_button.remaining_time = data.remaining_time;
    like_button.update_dom();
});

// invite_button.addEventListener("click", add_invite_bonus);
like_button.dom.addEventListener("click", like_button.click_like);
// game.purchase_button.addEventListener("click", purchase);
// invite_button.addEventListener("click", try_posting);